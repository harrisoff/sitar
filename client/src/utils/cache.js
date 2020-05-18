import Taro from "@tarojs/taro";

import { CACHE } from "../config";

const { MENU, HOMEPAGE, VERSION, DIRTY, BANNED, RANDOM } = CACHE;

// homepage

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

// menu

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

// version

export function setVersionCache(data) {
  Taro.setStorageSync(VERSION, data);
}
export function getVersionCache() {
  return Taro.getStorageSync(VERSION) || 0;
}

// dirty list

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

// user/auth
export function setBanned(banned) {
  Taro.setStorageSync(BANNED, banned);
}
export function getBanned() {
  return Taro.getStorageSync(BANNED)
}

// TODO: random
export function setRandomCount(count) {
  const timestamp = new Date().getTime()
  Taro.setStorageSync(RANDOM, {
    timestamp, // 最后一次使用时间
    count
  });
}
export function getRandomCount() {
  return Taro.getStorageSync(BANNED)
}