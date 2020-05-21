import callFunction from "./request";
import { formatTime } from "../utils/weapp";

// ===== homepage =====

export function getHomepageData() {
  return new Promise((resolve, reject) => {
    callFunction("base", {
      fn: "getHomepage"
    })
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
  return callFunction("base", {
    fn: "getRandomArticle"
  })
}

export function getRandomImage() {
  return callFunction("base", {
    fn: "getRandomImage"
  })
}

export function getRandomSong() {
  return callFunction("base", {
    fn: "getRandomSong"
  })
}

export function searchArticleByKeyword(keyword) {
  return callFunction("base", {
    fn: "searchArticleByKeyword",
    keyword
  })
}

// ===== menu =====

export function getMenuData() {
  return callFunction("base", {
    fn: "getMenuData"
  })
}

// ===== article =====

export function getArticleById(id, if_modified_since) {
  return new Promise((resolve, reject) => {
    callFunction("base", {
      fn: "getArticleById",
      id,
      if_modified_since
    })
      .then((data) => {
        if (data) resolve(data)
        else reject({ errMsg: "没有找到文章!" });
      })
      .catch(reject);
  });
}

export function getArticleComments(realId) {
  return callFunction("base", {
    fn: "getArticleComments",
    realId
  })
}

// ===== comments =====

export function addComment({ realId, content, replyId }) {
  return callFunction("base", {
    fn: "addComment",
    commentData: { realId, content, replyId }
  })
}

export function toggleLike({ id, like }) {
  return callFunction("base", {
    fn: "toggleLike",
    id,
    like
  });
}

// ===== ?? =====

export function getVersion() {
  return new Promise((resolve, reject) => {
    callFunction("base", {
      fn: "getVersion"
    })
      .then(version => {
        resolve(parseInt(version));
      })
      .catch(reject);
  });
}
