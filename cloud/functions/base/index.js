const cloud = require("wx-server-sdk");

const COLLECTIONS = {
  COMMENT: "comment",
  USER: "user",
  ARTICLE: "article",
  BOOK: "book",
  SETTING: "setting",
  LOG: "log",
  SONG: "song",
  ALBUM: "album",
  NOTICE: "notice",
};
const CLOUD_ENV = process.env.CLOUD_ENV
const cdnPrefixes = [
  "http://sitar-cdn-1.jjlin.online/sitar",
  "http://sitar-cdn-2.jjlin.online"
]
const ONE_DAY = 24 * 60 * 60 * 1000;

// TIPS:
// __dirname 是 /var/usr

cloud.init();
const db = cloud.database({
  env: CLOUD_ENV,
});
const _ = db.command;
const $ = db.command.aggregate;

// ===== user =====
// 登录，不是授权
// 这个接口需要返回用户封禁信息，在请求结束前会阻塞渲染
// 所以不要查询太多数据拖慢接口
function login(event) {
  return new Promise(async (resolve, reject) => {
    try {
      const { openId } = event.userInfo;
      const user = await findUser(event, ["banned"]);
      const banned = user ? user.banned : false;
      // 新用户
      if (!user) {
        // 1. 初始化用户，相应的表中添加一条记录
        await createUser(openId);
      }
      resolve(banned);
    } catch (err) {
      reject(err);
    }
  });
}

function findUser(event, fields) {
  const { openId } = event.userInfo;
  return new Promise((resolve, reject) => {
    db.collection(COLLECTIONS.USER)
      .where({
        open_id: openId,
      })
      .field(createFieldObj(...fields))
      .get()
      .then(({ data }) => {
        if (data.length) resolve(data[0]);
        else resolve(null);
      })
      .catch(reject);
  });
}

// 用户信息+最近一条未读的通知
// 注意，如果返回 userInfo 授权后才有的字段
// 需要在前端控制如何展示
function getUserData(event) {
  const { openId } = event.userInfo;
  return new Promise((resolve, reject) => {
    db.collection(COLLECTIONS.USER)
      .aggregate()
      .match({
        open_id: openId
      })
      // 找用户没读过的通知
      .lookup({
        from: COLLECTIONS.NOTICE,
        let: {
          last_notice: '$last_notice'
        },
        pipeline:
          $.pipeline()
            .match(
              _.expr(
                // 查找发布时间比用户最后一次读通知晚的
                $.gt(['$timestamp', '$$last_notice'])
              )
            )
            .done(),
        as: 'notices',
      })
      .end()
      .then(({ list }) => {
        const user = list[0]
        const { banned, notices } = user
        if (notices.length) {
          // 时间倒序
          notices.sort((a, b) => b.timestamp - a.timestamp)
        }
        // 通知排序，
        resolve({
          // 用户信息
          openId,
          banned,
          notice: notices[0] // 取最近的一条
        });
      })
      .catch(reject);
  });
}

function getUserCommentList(event) {
  const { openId } = event.userInfo;
  return new Promise((resolve, reject) => {
    db.collection(COLLECTIONS.COMMENT)
      .aggregate()
      .match({
        open_id: openId,
      })
      .sort({
        timestamp: -1
      })
      .lookup({
        from: COLLECTIONS.ARTICLE,
        localField: "article_id",
        foreignField: "real_id",
        as: "article",
      })
      .end()
      .then(({ list }) => {
        const now = new Date().getTime();
        const commentList = []
        let commentLimit = 5;
        list.forEach(c => {
          const article = c.article[0]
          if (c.timestamp > now - ONE_DAY) commentLimit -= 1;
          if (c.show) {
            commentList.push({
              id: c._id,
              timestamp: c.timestamp,
              content: c.content,
              realId: c.article_id,
              articleId: article._id,
              title: article.title
            });
          }
        })
        resolve({
          // 评论
          commentList,
          commentLimit: commentLimit > 0 ? commentLimit : 0,
        });
      })
      .catch(reject);
  });
}

function getUserLikeList(event) {
  const { openId } = event.userInfo;
  return new Promise((resolve, reject) => {
    db.collection(COLLECTIONS.USER)
      .aggregate()
      .match({
        open_id: openId,
      })
      .lookup({
        from: COLLECTIONS.ARTICLE,
        localField: "open_id",
        foreignField: "like_id",
        as: "like_list",
      })
      .end()
      .then(({ list }) => {
        const { like_list } = list[0];
        // 赞过的
        const likeList = [];
        like_list.forEach((l) => {
          if (l.show) {
            likeList.push({
              id: l._id,
              realId: l.real_id,
              timestamp: l.timestamp,
              // 点赞数不能及时更新，显示出来意义不大
              // like: l.like_id.length,
              title: l.title,
            });
          }
        });
        resolve(likeList);
      })
      .catch(reject);
  });
}

function createUser(openId) {
  return db.collection(COLLECTIONS.USER).add({
    data: {
      open_id: openId,
      banned: false, // 是否封禁
      first_login: new Date().getTime(),
      random_song: [], // 使用随机歌曲功能的记录，时间戳
    },
  });
}

// 用户授权 userInfo 后更新 user 表
// 不管是首次授权还是多次授权
function updateUserInfo(event) {
  const { userInfo, data } = event;
  const { openId } = userInfo;
  return db
    .collection(COLLECTIONS.USER)
    .where({
      open_id: openId,
    })
    .update({
      data: {
        ...data, // 就是 userInfo，不过跟这里的 userInfo 重名
      },
    });
}

// ===== 首页 =====

// 轮播图 + 置顶 + 列表
function getHomepage(event) {
  return db
    .collection(COLLECTIONS.ARTICLE)
    .field(
      createFieldObj(
        "_id",
        "author",
        "title",
        "real_id",
        "digest",
        "thumb_url",
        "carousel",
        "top",
        "list"
      )
    )
    .where(
      // 查询条件先后顺序是有影响的
      // 这里必须先 or 后 and
      _.or([
        {
          carousel: true,
        },
        {
          top: true,
        },
        {
          list: true,
        },
      ]).and({
        show: true,
      })
    )
    .orderBy("timestamp", "desc")
    .get();
}

function getRandomArticle(event) {
  return new Promise((resolve, reject) => {
    db.collection(COLLECTIONS.ARTICLE)
      .aggregate()
      .match({
        show: true,
      })
      .sample({
        size: 1,
      })
      .end()
      .then(({ list }) => {
        const { _id, real_id } = list[0];
        resolve({
          id: _id,
          realId: real_id,
        });
      })
      .catch(reject);
  });
}

function getRandomImage(event) {
  return new Promise((resolve, reject) => {
    db.collection(COLLECTIONS.IMAGE_RAW)
      .aggregate()
      .sample({
        size: 1,
      })
      .end()
      .then(({ list }) => {
        const { url, media_id } = list[0];
        resolve({ url, media_id });
      })
      .catch(reject);
  });
}

function getRandomSong(event) {
  return new Promise(async (resolve, reject) => {
    try {
      let isLimit = false;
      let user = null;
      let latest = 0;
      const serverControl = true;
      user = await findUser(event, ["_id", "random_song"]);
      if (!user) throw { errMsg: "Oops! 找不到当前用户的信息" };
      const record = user.random_song;
      latest = record.sort().pop();
      if (latest > new Date().getTime() - ONE_DAY && serverControl) {
        isLimit = true;
      }
      if (isLimit) {
        resolve({
          latest,
        });
      } else {
        // 获取
        db.collection(COLLECTIONS.SONG)
          .aggregate()
          .sample({
            size: 1,
          })
          .lookup({
            from: COLLECTIONS.ALBUM,
            localField: "album_id",
            foreignField: "_id",
            as: "albums",
          })
          .end()
          .then(({ list }) => {
            const song = list[0];
            const { _id, albums, cloud_id, title } = song;
            const album = albums[0];
            const result = {
              _id,
              title,
              album: album.title,
              cover: album.cover_id,
              artist: album.artist,
              cloudId: cloud_id,
              cdnUrl: `${getCdnPrefix()}/${title}.mp3`,
            };
            // 记录
            db.collection(COLLECTIONS.USER)
              .doc(user._id)
              .update({
                data: {
                  random_song: _.push(new Date().getTime()),
                },
              })
              .then((_) => {
                resolve({
                  song: result,
                  latest,
                });
              })
              .catch(reject);
          })
          .catch(reject);
      }
    } catch (err) {
      reject(err);
    }
  });
}

// ===== 目录 =====

// book + booklet + other
function getMenuData(event) {
  return new Promise((resolve, reject) => {
    db.collection(COLLECTIONS.ARTICLE)
      .aggregate()
      .project({
        html: false,
        text: false,
      })
      .lookup({
        from: COLLECTIONS.BOOK,
        localField: "book_id",
        foreignField: "_id",
        as: "itsBook",
      })
      .limit(999)
      .end()
      .then(({ list }) => {
        const books = [];
        const booklets = [];
        const otherArticles = [];

        list.forEach((article) => {
          const {
            book_id,
            _id,
            real_id,
            like_id,
            view,
            show,
            title,
            timestamp,
            url,
            itsBook,
          } = article;
          if (show) {
            // article
            const a = {
              id: _id,
              realId: real_id,
              likeId: like_id,
              view,
              title,
              timestamp,
              url,
            };
            const book = itsBook[0];
            // book & booklet
            if (book) {
              const { _id, author, cover_id, intro, title, type } = book;
              if (type === "book") {
                const b = books.find((e) => e.id === _id);
                if (b) {
                  insert(b.articles, a);
                } else {
                  books.push({
                    id: _id,
                    author,
                    coverId: cover_id,
                    intro,
                    title,
                    articles: [a],
                  });
                }
              }
              // booklets
              else if (type === "booklet") {
                const b = booklets.find((e) => e.id === _id);
                if (b) {
                  insert(b.articles, a);
                } else {
                  booklets.push({
                    id: _id,
                    title,
                    articles: [a],
                  });
                }
              }
            }
            // 未分类
            else {
              insert(otherArticles, a);
            }
          }
        });
        resolve({
          books,
          booklets,
          others: otherArticles,
        });
      })
      .catch(reject);
  });
}

// ===== 文章 =====

function getArticleById(event) {
  const { id, if_modified_since } = event;
  // 阅读量 +1
  db.collection(COLLECTIONS.ARTICLE)
    .doc(id)
    .update({
      data: {
        view: _.inc(1), // 阅读 +1
      },
    });
  return new Promise((resolve, reject) => {
    db.collection(COLLECTIONS.ARTICLE)
      .where({
        _id: id,
      })
      .field(
        createFieldObj(
          "book_id",
          "_id",
          "author",
          "like_id",
          "html",
          "real_id",
          "title",
          "timestamp",
          "url",
          "view",
          "last_modified",
          "thumb_url"
        )
      )
      .get()
      .then((res) => {
        const data = res.data;
        if (!data.length) {
          resolve(null);
        } else {
          const article = data[0];
          const { last_modified } = article;
          // 无缓存/缓存过期时返回完整数据
          if (!if_modified_since || last_modified > if_modified_since) {
            resolve(article);
          }
          // 缓存未过期时，只返回点赞/点击数据
          else {
            resolve({
              like_id: article.like_id,
              view: article.view,
            });
          }
        }
      })
      .catch(reject);
  });
}

function searchArticleByKeyword(event) {
  const { keyword } = event;
  return db
    .collection(COLLECTIONS.ARTICLE)
    .field(
      createFieldObj(
        "_id",
        "book_id",
        "book_title",
        "real_id",
        "title",
        "timestamp",
        "url"
      )
    )
    .where({
      show: true,
      text: db.RegExp({
        regexp: `.*${keyword}`,
        options: "i",
      }),
    })
    .get();
}

// 获取评论
function getArticleComments(event) {
  const { realId } = event;
  return new Promise((resolve, reject) => {
    db.collection(COLLECTIONS.COMMENT)
      .aggregate()
      .match({
        show: true,
        article_id: realId,
      })
      .lookup({
        from: COLLECTIONS.USER,
        localField: "open_id",
        foreignField: "open_id",
        as: "user",
      })
      .lookup({
        from: COLLECTIONS.ARTICLE,
        localField: "article_id",
        foreignField: "real_id",
        as: "article",
      })
      .sort({
        timestamp: -1,
      })
      .end()
      .then(({ list }) => {
        resolve(
          list.map((e) => {
            const user = e.user[0];
            let article = e.article[0];
            article = article.show ? article : null;
            return {
              id: e._id,
              timestamp: e.timestamp,
              content: e.content,
              replyId: e.reply_id,
              openId: e.open_id,
              // user
              banned: user && user.banned,
              avatarUrl: user && user.avatarUrl,
              gender: user && user.gender,
              nickName: user && user.nickName,
              // article
              title: article && article.title,
              articleId: article && article._id,
              realId: article && article.real_id,
            };
          })
        );
      })
      .catch(reject);
  });
}

// 点赞/取消赞
function toggleLike(event) {
  const { id, userInfo, like } = event;
  const { openId } = userInfo;
  const data = {
    like_id: like ? _.addToSet(openId) : _.pull(openId),
  };
  return db.collection(COLLECTIONS.ARTICLE).doc(id).update({
    data,
  });
}

async function addComment(event) {
  const { userInfo, commentData } = event;
  const { openId } = userInfo;
  const { content, realId, replyId } = commentData;
  let isLegal = true
  try {
    await cloud.openapi.security.msgSecCheck({ content })
  }
  catch (err) {
    // 1. 内容不合法
    if (err.errCode === 87014) isLegal = false
    // 2. 请求失败，姑且算内容是合法的
  }
  try {
    await db.collection(COLLECTIONS.COMMENT)
      .add({
        data: {
          open_id: openId,
          timestamp: new Date().getTime(),
          show: isLegal,
          is_legal: isLegal,
          content,
          article_id: realId,
          reply_id: replyId,
        },
      })
    return isLegal ? {} : { errCode: 87014 }
  } catch (err) {
    throw err
  }
}

// ===== 其他 =====
function getVersion(event) {
  return new Promise((resolve, reject) => {
    db.collection(COLLECTIONS.SETTING)
      .where({
        setting_name: "version",
      })
      .get()
      .then(({ data }) => {
        resolve(data[0].version);
      })
      .catch(reject);
  });
}

// interface wxContextSample {
//   CLIENTIP: String;
//   CLIENTIPV6: String;
//   APPID: String;
//   OPENID: String;
//   ENV: String;
//   SOURCE: String;
// };
function uploadLogs(event) {
  const { userInfo, data } = event;
  data.forEach((item) => {
    item.open_id = userInfo.openId;
    if (item.level === "error" || item.type === "login") {
      item.context = cloud.getWXContext();
    }
  });
  return db.collection(COLLECTIONS.LOG).add({
    data,
  });
}

// 获取通知列表
function getNoticeList(event) {
  const { openId } = event.userInfo;
  return new Promise((resolve, reject) => {
    // 1. 获取
    db.collection(COLLECTIONS.NOTICE)
      .orderBy('timestamp', 'desc')
      .get()
      .then(({ data }) => {
        // 2. 更新用户最后一次阅读通知的时间
        db.collection(COLLECTIONS.USER)
          .where({
            open_id: openId
          })
          .update({
            data: {
              last_notice: new Date().getTime()
            },
          })
          .then(_ => {
            resolve(data)
          })
          .catch(reject)
      })
      .catch(reject);
  });
}

// ===== utils =====
function createFieldObj(...fields) {
  const fieldObj = {};
  fields.forEach((field) => {
    fieldObj[field] = true;
  });
  return fieldObj;
}

function getCdnPrefix() {
  return Math.random() > 0.5 ? cdnPrefixes[0] : cdnPrefixes[1]
}

// 按 timestamp 正序排序并加入数组
function insert(arr, ele) {
  if (arr.length === 0) return arr.push(ele);
  for (let i = 0; i < arr.length; i += 1) {
    if (ele.timestamp <= arr[i].timestamp) {
      arr.splice(i, 0, ele);
      break;
    }
    if (i === arr.length - 1) {
      arr.push(ele);
      break;
    }
  }
}

exports.main = (event, context) => {
  const eventSample = {
    userInfo: {
      appId: "",
      openId: "",
    },
    // 自定义参数
    // ...
  };
  switch (event.fn) {
    // 打开小程序时
    case "login":
      return login(event);
    // 获取用户信息
    case "getUserData":
      return getUserData(event);
    case "getUserCommentList":
      return getUserCommentList(event);
    case "getUserLikeList":
      return getUserLikeList(event);
    // 文章点赞/取消赞
    case "toggleLike":
      return toggleLike(event);
    // 获取文章评论
    case "getArticleComments":
      return getArticleComments(event);
    // 关键字搜索文章
    case "searchArticleByKeyword":
      return searchArticleByKeyword(event);
    // 获取首页轮播/指定/最近更新文章
    case "getHomepage":
      return getHomepage(event);
    // 目录页获取书籍及下属文章
    case "getMenuData":
      return getMenuData(event);
    // 随机抽一篇文章
    case "getRandomArticle":
      return getRandomArticle(event);
    // 随机抽一张图片
    case "getRandomImage":
      return getRandomImage(event);
    // 随机抽一首歌
    case "getRandomSong":
      return getRandomSong(event);
    // 文章页根据 real_id 获取文章内容
    case "getArticleById":
      return getArticleById(event);
    // 获取缓存版本
    case "getVersion":
      return getVersion(event);
    // 用户授权 userInfo 后更新 user 表
    case "updateUserInfo":
      return updateUserInfo(event);
    // 添加评论
    case "addComment":
      return addComment(event);
    // 上传日志
    case "uploadLogs":
      return uploadLogs(event);
    // 通知列表
    case "getNoticeList":
      return getNoticeList(event);
    // 更新用户已读通知的时间戳
    case "updateUserNotice":
      return updateUserNotice(event);
    default:
      return Promise.reject("empty function");
  }
};
