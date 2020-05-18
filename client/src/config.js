export const COLLECTIONS = {
  TYPES: 'types',
  SERIES: 'series',
  ARTICLES: 'articles'
}

// local storage
export const CACHE = {
  VERSION: 'cache-version',
  MENU: 'cache-menu',
  HOMEPAGE: 'cache-homepage',
  DIRTY: 'cache-need-refresh',
  BANNED: 'cache-user-banned',
  RANDOM: 'cache-random',
  ARTICLE: 'cache-articles'
}

export const ROUTES = {
  INDEX: '/pages/index/index',
  MENU: '/pages/menu/index',
  ARTICLE: '/pages/article/index',
  SEARCH: "/pages/search/index",
  USER: '/pages/user/index',
  USER_COMMENT: '/pages/user/comment/index',
  USER_LIKE: '/pages/user/like/index',
  ABOUT: '/pages/about/index',
}

export const SETTINGS = {
  COMMENT_PER_DAY: 5, // 每天限制评论 5 次
  ARTICLE_CACHE_LIMIT: 5 // mb
}
