export const COLLECTIONS = {
  TYPES: "types",
  SERIES: "series",
  ARTICLES: "articles"
};

// local storage
export const CACHE = {
  VERSION: "cache-version",
  MENU: "cache-menu",
  HOMEPAGE: "cache-homepage",
  DIRTY: "cache-need-refresh",
  BANNED: "cache-user-banned",
  RANDOM: "cache-random",
  RANDOM_SONG: "cache-random-song",
  ARTICLE: "cache-articles"
};

export const ROUTES = {
  INDEX: "/pages/index/index",
  MENU: "/pages/menu/index",
  ARTICLE: "/pages/article/index",
  SEARCH: "/pages/search/index",
  USER: "/pages/user/index",
  USER_COMMENT: "/pages/user/comment/index",
  USER_LIKE: "/pages/user/like/index",
  CACHE: "/pages/cache/index",
  ABOUT: "/pages/about/index"
};

export const SETTINGS = {
  COMMENT_PER_DAY: 10, // 24 小时内评论次数限制
  RANDOM_PER_DAY: 50, // 24 小时内随机文章/图片功能次数限制
  RANDOM_SONG_PER_DAY: 1, // 24 小时内随机歌曲次数限制
  ARTICLE_CACHE_LIMIT: 1 * 1024 // kb
};
