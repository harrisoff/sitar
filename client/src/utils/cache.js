import Taro from "@tarojs/taro";

import logger from '../utils/Logger'
import { getUtf8StringKb } from '../utils/index'
import { CACHE, SETTINGS } from "../config";

const { MENU, HOMEPAGE, VERSION, DIRTY, BANNED, RANDOM, RANDOM_SONG, ARTICLE } = CACHE;

// 首页缓存
export function setHomepageCache(data) {
  Taro.setStorageSync(HOMEPAGE, data);
}
export function getHomepageCache() {
  const dft = {
    list: [],
    top: [],
    carousel: []
  };
  return Taro.getStorageSync(HOMEPAGE) || dft;
}

// 目录页缓存，这里会占 50kB+
export function setMenuCache(data) {
  Taro.setStorageSync(MENU, data);
}
export function getMenuCache() {
  const dft = {
    books: [],
    booklets: [],
    others: []
  }
  return Taro.getStorageSync(MENU) || dft;
}

// 版本信息
export function setVersionCache(data) {
  Taro.setStorageSync(VERSION, data);
}
export function getVersionCache() {
  return Taro.getStorageSync(VERSION) || 0;
}

// 首页和目录页的缓存状态
export function setDirtyCache(...keys) {
  let cache = getCacheStatus();
  keys.forEach(key => (cache[key] = true));
  Taro.setStorageSync(DIRTY, cache);
}
export function setCleanCache(...keys) {
  const cache = getCacheStatus();
  keys.forEach(key => (cache[key] = false));
  Taro.setStorageSync(DIRTY, cache);
}
export function getCacheStatus() {
  const cache = Taro.getStorageSync(DIRTY);
  if (cache) {
    return cache;
  }
  // 初次使用，没有 cache
  else {
    const dft = {
      homepage: true,
      menu: true
    };
    Taro.setStorageSync(DIRTY, dft);
    return dft;
  }
}

// 封禁状态
export function setBanned(banned) {
  Taro.setStorageSync(BANNED, banned);
}
export function getBanned() {
  return Taro.getStorageSync(BANNED)
}
// 封禁后，除了 cache-user-banned 其他缓存全部删除
export function deleteBannedCache() {
  Object.keys(CACHE).forEach(key => {
    if (CACHE[key] !== BANNED) Taro.removeStorageSync(CACHE[key])
  })
}

// 文章缓存
export function setArticleCache(article) {
  const articleCaches = Taro.getStorageSync(ARTICLE) || {}
  const { real_id, last_modified } = article
  articleCaches[real_id] = {
    last_modified,
    article,
    last_visit: new Date().getTime() // 最后一次访问的时间
  }
  Taro.setStorageSync(ARTICLE, articleCaches);
}
export function getArticleCaches() {
  return Taro.getStorageSync(ARTICLE) || {}
}
export function getArticleCache(realId) {
  const articleCaches = Taro.getStorageSync(ARTICLE)
  if (!articleCaches) return null
  const articleCache = articleCaches[realId]
  return articleCache ? articleCache.article : null
}
export function updateArticleCacheTime(realId) {
  const articleCaches = Taro.getStorageSync(ARTICLE)
  const articleCache = articleCaches[realId]
  articleCache.last_visit = new Date().getTime()
  Taro.setStorageSync(ARTICLE, articleCaches);
}
// 计算文章缓存大小，判断是否需要清理
export function garbageCollect() {
  const articleCaches = Taro.getStorageSync(ARTICLE)
  const cacheString = JSON.stringify(articleCaches)
  const kbSize = getUtf8StringKb(cacheString)
  if (kbSize >= SETTINGS.ARTICLE_CACHE_LIMIT) {
    console.log('clean article cache')
    logger.log('auto', 'cache', {
      action: 'auto delete',
      size: kbSize + 'kb'
    })
    const realIds = Object.keys(articleCaches)
    const times = realIds.map(realId => {
      return {
        realId,
        last_visit: articleCaches[realId].last_visit
      }
    })
    times.sort((a, b) => a.last_visit - b.last_visit)
    // 删除最久未被访问的两项
    times.splice(0, 2).forEach(i => {
      console.log(articleCaches[i.realId].article.title)
      delete articleCaches[i.realId]
    })
    Taro.setStorageSync(ARTICLE, articleCaches);
  }
}
export function deleteArticleCache(realId) {
  const articleCaches = Taro.getStorageSync(ARTICLE)
  if (articleCaches[realId]) delete articleCaches[realId]
  Taro.setStorageSync(ARTICLE, articleCaches);
}

// 随机图片/文章/歌曲次数控制
// 图片/文章共享限制次数，歌曲单独限制次数
export function setRandomRecord(type) {
  const key = type === 'song' ? RANDOM_SONG : RANDOM
  const randomRecord = Taro.getStorageSync(key) || []
  // 对于 50 条记录总大小在 10kB 以下
  randomRecord.push(new Date().getTime())
  Taro.setStorageSync(key, randomRecord)
}
export function getRandomLimit(type) {
  const key = type === 'song' ? RANDOM_SONG : RANDOM
  const limit = type === 'song' ? SETTINGS.RANDOM_SONG_PER_DAY : SETTINGS.RANDOM_PER_DAY
  const oneDay = 24 * 60 * 60 * 1000;
  const now = new Date().getTime()
  let randomRecord = Taro.getStorageSync(key) || []
  // 删除一天以前的记录
  randomRecord = randomRecord.filter(r => r > now - oneDay)
  // 一天内的使用次数
  const used = randomRecord.length
  return limit - used
}