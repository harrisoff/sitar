const N10 = '1302052182'
const DEV_ENV = {
  N4: '7369',
  CLOUD_ENV: 'sitar-dev'
}
const PROD_ENV = {
  N4: '',
  CLOUD_ENV: ''
}
const PROCESS_ENV = 'dev'
export const ENV = {
  N10: N10,
  N4: PROCESS_ENV === 'dev' ? DEV_ENV.N4 : PROD_ENV.N4,
  CLOUD_ENV: PROCESS_ENV === 'dev' ? DEV_ENV.CLOUD_ENV : PROD_ENV.CLOUD_ENV
}

export const COLLECTIONS = {
  TYPES: 'types',
  SERIES: 'series',
  ARTICLES: 'articles'
}

// local storage
export const CACHE = {
  VERSION: 'cache-version',
  BOOKS: 'cache-books',
  HOMEPAGE: 'cache-homepage',
  DIRTY: 'cache-need-refresh',
  BANNED: 'cache-user-banned',
  RANDOM: 'cache-random'
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
  COMMENT_PER_DAY: 5 // 每天限制评论 5 次
}
