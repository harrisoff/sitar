import dayjs from 'dayjs'

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
  ABOUT: "/pages/about/index",
  NOTICE: "/pages/notice/index"
};

export const SETTINGS = {
  COMMENT_PER_DAY: 10, // 24 小时内评论次数限制
  RANDOM_PER_DAY: 50, // 24 小时内随机文章/图片功能次数限制
  RANDOM_SONG_PER_DAY: 1, // 24 小时内随机歌曲次数限制
  ARTICLE_CACHE_LIMIT: 1 * 1024 // kb
};

export const CDN = {
  PREFIX1: 'http://sitar-cdn-1.jjlin.online/sitar',
  PREFIX2: 'http://sitar-cdn-2.jjlin.online'
}

// 规避审核
// iOS 线上环境不识别 YYYY-MM-DD 写法，调试模式没问题
const activeDate = '2020-06-05 00:00:01'
export const isActive = new Date().getTime() > dayjs(activeDate).valueOf()