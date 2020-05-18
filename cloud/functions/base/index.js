const cloud = require("wx-server-sdk");

const PROCESS_ENV = "dev";
const N10 = "1302052182";
const DEV_ENV = {
  N4: "7369",
  CLOUD_ENV: "sitar-dev",
};
const PROD_ENV = {
  N4: "",
  CLOUD_ENV: "",
};
const COLLECTIONS = {
  COMMENT: "comment",
  USER: "user",
  FILE: "file",
  ARTICLE: "article",
  BOOK: "book",
  BACKUP: "backup",
  SETTING: "setting",
  LOG: "log",
  // raw
  MATERIAL_RAW: "wx_material",
  VOICE_RAW: "wx_voice",
  IMAGE_RAW: "wx_image",
  VIDEO_RAW: "wx_video",
  NEWS_RAW: "wx_news",
};
const ENV = {
  N10: N10,
  N4: PROCESS_ENV === "dev" ? DEV_ENV.N4 : PROD_ENV.N4,
  CLOUD_ENV: PROCESS_ENV === "dev" ? DEV_ENV.CLOUD_ENV : PROD_ENV.CLOUD_ENV,
};
const { CLOUD_ENV } = ENV;

// TIPS:
// __dirname 是 /var/usr

cloud.init();
const db = cloud.database({
  env: CLOUD_ENV,
});
const _ = db.command;

// ===== user =====
// 登录，不是授权
// 这个接口需要返回用户封禁信息，在请求结束前会阻塞渲染
// 所以不要查询太多数据拖慢接口
function login(event) {
  return new Promise(async (resolve, reject) => {
    try {
      // 获取 WX Context (微信调用上下文)，包括 OPENID、APPID、及 UNIONID（需满足 UNIONID 获取条件）
      const wxContext = cloud.getWXContext();
      const wxContextSample = {
        CLIENTIP: "",
        CLIENTIPV6: "",
        APPID: "",
        OPENID: "",
        ENV: "",
        SOURCE: "",
      };
      const { openId } = event.userInfo;
      const user = await findUser(event);
      const banned = user ? user.banned : false
      // 新用户
      if (!user) {
        // 1. 初始化用户，相应的表中添加一条记录
        await createUser(openId);
      }
      // 更新登录记录
      const { params } = event
      await saveLog(openId, 'login', { context: wxContext, params })
      resolve(banned);
    } catch (err) {
      reject(err);
    }
  });
}

function findUser(event) {
  const { openId } = event.userInfo;
  return new Promise((resolve, reject) => {
    db.collection(COLLECTIONS.USER)
      .where({
        open_id: openId
      })
      .field({
        banned: true
      })
      .get()
      .then(({ data }) => {
        if (data.length) resolve(data[0])
        else resolve(null)
      })
      .catch(reject)
  })
}

// 用户信息+赞过的列表+评论列表
// 注意，如果返回 userInfo 授权后才有的字段
// 需要在前端控制如何展示
function getUserData(event) {
  const { openId } = event.userInfo;
  return new Promise((resolve, reject) => {
    db.collection(COLLECTIONS.USER).aggregate()
      .match({
        open_id: openId
      })
      .lookup({
        from: COLLECTIONS.ARTICLE,
        localField: 'open_id',
        foreignField: 'like_id',
        as: 'like_list',
      })
      .lookup({
        from: COLLECTIONS.COMMENT,
        localField: 'open_id',
        foreignField: 'open_id',
        as: 'comment_list',
      })
      .end()
      .then(({ list }) => {
        // 前端会在 login 结束后再 getUserData
        // 所以即使是初次进入的用户，也一定有记录
        const { banned, comment_list, like_list } = list[0]
        const realIds = new Set() // 用来再查一次获取文章标题
        // 评论过的
        const now = new Date().getTime();
        const oneDay = 24 * 60 * 60 * 1000;
        let commentLimit = 5
        const commentList = []
        comment_list.forEach(c => {
          if (c.timestamp > now - oneDay) commentLimit -= 1
          if (c.show) {
            realIds.add(c.article_id)
            // 查询结果时间正序，这里改成倒序
            commentList.unshift({
              id: c._id,
              timestamp: c.timestamp,
              content: c.content,
              realId: c.article_id
            })
          }
        })
        // 赞过的
        const likeList = []
        like_list.forEach(l => {
          if (l.show) {
            likeList.push({
              id: l._id,
              realId: l.real_id,
              timestamp: l.timestamp,
              // 点赞数不能及时更新，显示出来意义不大
              // like: l.like_id.length,
              title: l.title
            })
          }
        })
        db.collection(COLLECTIONS.ARTICLE)
          .field(createFieldObj('_id', 'real_id', 'title'))
          .where({
            real_id: _.in(Array.from(realIds))
          })
          .get()
          .then(({ data }) => {
            commentList.forEach(comment => {
              const { realId } = comment
              const article = data.find(d => d.real_id === realId)
              comment.title = article.title
              comment.articleId = article._id
            })
            resolve({
              // 用户信息
              openId,
              banned,
              // 赞过的
              likeList,
              // 评论
              commentList,
              commentLimit: commentLimit > 0 ? commentLimit : 0
            })
          })
          .catch(reject);
      })
      .catch(reject);
  });
}

// like 不需要授权
function getUserLike() { }

// comment 需要授权
function getUserComment() { }

function createUser(openId) {
  return db.collection(COLLECTIONS.USER)
    .add({
      data: {
        open_id: openId,
        banned: false, // 是否封禁
        first_login: new Date().getTime()
      },
    })
}

function saveLog(openId, type, data) {
  return db.collection(COLLECTIONS.LOG).add({
    data: {
      open_id: openId,
      type,
      ...data,
      timestamp: new Date().getTime(),
    },
  });
}

// 用户授权 userInfo 后更新 user 表
// 不管是首次授权还是多次授权
function saveUserInfo(event) {
  const { userInfo, data } = event;
  const { openId } = userInfo;
  return db.collection(COLLECTIONS.USER)
    .where({
      open_id: openId
    })
    .update({
      data: {
        ...data // 就是 userInfo，不过跟这里的 userInfo 重名
      }
    })
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
      _
        .or([
          {
            carousel: true,
          },
          {
            top: true,
          },
          {
            list: true,
          },
        ])
        .and({
          show: true,
        })
    )
    .orderBy('timestamp', 'desc')
    .get();
}

// ===== 目录 =====

// 书籍列表
function getBookList(event) {
  return new Promise((resolve, reject) => {
    db.collection(COLLECTIONS.ARTICLE).aggregate()
      .project({
        html: false,
        text: false
      })
      .lookup({
        from: COLLECTIONS.BOOK,
        localField: 'book_id',
        foreignField: '_id',
        as: 'itsBook',
      })
      .limit(999)
      .end()
      .then(({ list }) => {
        const books = []
        const booklets = []
        const otherArticles = []

        list.forEach(article => {
          const { book_id, _id, real_id, like_id, view, show, title, timestamp, url, itsBook } = article
          if (show) {
            // article
            const a = {
              id: _id,
              realId: real_id,
              likeId: like_id,
              view,
              title,
              timestamp,
              url
            }
            const book = itsBook[0]
            // book & booklet
            if (book) {
              const { _id, author, cover_id, intro, title, type } = book
              if (type === 'book') {
                const b = books.find(e => e.id === _id)
                if (b) {
                  b.articles.push(a)
                } else {
                  books.push({
                    id: _id,
                    author,
                    coverId: cover_id,
                    intro,
                    title,
                    articles: [a]
                  })
                }
              }
              // booklets
              else if (type === 'booklet') {
                const b = booklets.find(e => e.id === _id)
                if (b) {
                  b.articles.push(a)
                } else {
                  booklets.push({
                    id: _id,
                    title,
                    articles: [a]
                  })
                }
              }
            }
            // 未分类
            else {
              otherArticles.push(a)
            }
          }
        })
        resolve({
          books,
          booklets,
          others: otherArticles
        })
      })
      .catch(reject)
  })
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
          "last_modified"
        )
      )
      .get()
      .then((res) => {
        const data = res.data
        if (!data.length) {
          resolve(null)
        } else {
          const article = data[0]
          const { last_modified } = article
          // 无缓存/缓存过期时返回完整数据
          if (!if_modified_since || last_modified > if_modified_since) {
            resolve(article)
          }
          // 缓存未过期时，只返回点赞/点击数据
          else {
            resolve({
              like_id: article.like_id,
              view: article.view
            })
          }
        }
      })
      .catch(reject)
  })
}

function searchArticleByKeyword(event) {
  const { keyword } = event
  return db.collection(COLLECTIONS.ARTICLE)
    .field(createFieldObj('_id', 'book_id', 'book_title', 'real_id', 'title', 'timestamp', 'url'))
    .where(
      {
        show: true,
        text: db.RegExp({
          regexp: `.*${keyword}`,
          options: 'i',
        })
      }
    )
    .get()
}

function getRandomArticle(event) {
  return new Promise((resolve, reject) => {
    db.collection(COLLECTIONS.ARTICLE)
      .aggregate()
      .match({
        show: true
      })
      .sample({
        size: 1
      })
      .end()
      .then(({ list }) => {
        const { _id, real_id } = list[0]
        resolve({
          id: _id,
          realId: real_id
        })
      }).catch(reject)
  })
}

function getRandomImage(event) {
  return new Promise((resolve, reject) => {
    db.collection(COLLECTIONS.IMAGE_RAW)
      .aggregate()
      .sample({
        size: 1
      })
      .end()
      .then(({ list }) => {
        resolve(list[0].url)
      }).catch(reject)
  })
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
        localField: 'open_id',
        foreignField: 'open_id',
        as: 'user',
      })
      .lookup({
        from: COLLECTIONS.ARTICLE,
        localField: 'article_id',
        foreignField: 'real_id',
        as: 'article',
      })
      .sort({
        timestamp: -1
      })
      .end()
      .then(({ list }) => {
        resolve(list.map(e => {
          const user = e.user[0]
          let article = e.article[0]
          article = article.show ? article : null
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
            realId: article && article.real_id
          }
        }))
      })
      .catch(reject)
  })
}

// 点赞/取消赞
function toggleLike(event) {
  const { id, userInfo, like } = event;
  const { openId } = userInfo;
  const data = {
    like_id: like ? _.addToSet(openId) : _.pull(openId)
  }
  return db
    .collection(COLLECTIONS.ARTICLE)
    .doc(id).update({
      data,
    });
}

function addComment(event) {
  const { userInfo, commentData } = event;
  const { openId } = userInfo;
  const { content, realId, replyId } = commentData
  return db.collection(COLLECTIONS.COMMENT).add({
    data: {
      open_id: openId,
      timestamp: new Date().getTime(),
      show: true,
      content,
      article_id: realId,
      reply_id: replyId
    },
  });
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
        if (data.length === 0) reject({ errMsg: "数据库未设置缓存版本信息" });
        else {
          resolve(data[0].version);
        }
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
    // 文章点赞/取消赞
    case "toggleLike":
      return toggleLike(event);
    // 获取文章评论
    case "getArticleComments":
      return getArticleComments(event);
    // 关键字搜索文章
    case 'searchArticleByKeyword':
      return searchArticleByKeyword(event);
    // 获取首页轮播/指定/最近更新文章
    case "getHomepage":
      return getHomepage(event);
    // 目录页获取书籍及下属文章
    case "getBookList":
      return getBookList(event);
    // 随机抽一篇文章
    case "getRandomArticle":
      return getRandomArticle(event);
    // 随机抽一张图片图片
    case "getRandomImage":
      return getRandomImage(event);
    // 文章页根据 real_id 获取文章内容
    case "getArticleById":
      return getArticleById(event);
    // 获取缓存版本
    case "getVersion":
      return getVersion(event);
    // 用户授权 userInfo 后更新 user 表
    case "saveUserInfo":
      return saveUserInfo(event);
    // 添加评论
    case "addComment":
      return addComment(event);
    default:
      return Promise.reject("empty function");
  }
};
