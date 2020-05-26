import callFunction from "./request";

// ===== homepage =====

export function getHomepageData() {
  return new Promise((resolve, reject) => {
    callFunction("getHomepage")
      .then(({ data, errMsg }) => {
        const r = {
          carousel: [],
          top: [],
          list: []
        };
        data.forEach(item => {
          if (item.carousel) r.carousel.push(item);
          // top 和 list 可能重复，top 优先级更高
          if (item.top) r.top.push(item);
          if (item.list && !item.top) {
            r.list.push(item);
          }
        });
        resolve(r);
      })
      .catch(reject);
  });
}

export function getRandomArticle() {
  return callFunction("getRandomArticle");
}

export function getRandomImage() {
  return callFunction("getRandomImage");
}

export function getRandomSong() {
  return callFunction("getRandomSong");
}

export function searchArticleByKeyword(keyword) {
  return callFunction("searchArticleByKeyword", { keyword });
}

// ===== menu =====

export function getMenuData() {
  return callFunction("getMenuData");
}

// ===== article =====

export function getArticleById(id, if_modified_since) {
  return new Promise((resolve, reject) => {
    callFunction("getArticleById", { id, if_modified_since })
      .then(data => {
        if (data) resolve(data);
        else reject("没有找到文章!");
      })
      .catch(reject);
  });
}

export function getArticleComments(realId) {
  return callFunction("getArticleComments", { realId });
}

// ===== comments =====

export function addComment({ realId, content, replyId }) {
  return callFunction("addComment", {
    commentData: { realId, content, replyId }
  });
}

export function toggleLike({ id, like }) {
  return callFunction("toggleLike", { id, like });
}

// ===== notices =====

export function getNoticeList() {
  return callFunction("getNoticeList");
}

// ===== user =====

export function getUserLikeList() {
  return callFunction("getUserLikeList");
}

export function getUserCommentList() {
  return callFunction("getUserCommentList");
}

// ===== ?? =====

export function getVersion() {
  return new Promise((resolve, reject) => {
    callFunction("getVersion")
      .then(version => {
        resolve(parseInt(version));
      })
      .catch(reject);
  });
}

export function uploadLogs(data) {
  return callFunction("uploadLogs", { data });
}
