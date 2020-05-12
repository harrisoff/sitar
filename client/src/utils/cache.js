import Taro from "@tarojs/taro";

import { CACHE } from "../config";

const { BOOKS, HOMEPAGE, VERSION, DIRTY, BANNED, RANDOM } = CACHE;

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

// books

export function setBooksCache(data) {
  Taro.setStorageSync(BOOKS, data);
}

export function getBooksCache() {
  return Taro.getStorageSync(BOOKS) || [];
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
  let cache = getDirtyCache();
  keys.forEach(key => (cache[key] = true));
  Taro.setStorageSync(DIRTY, cache);
}

export function setCleanCache(...keys) {
  const cache = getDirtyCache();
  keys.forEach(key => (cache[key] = false));
  Taro.setStorageSync(DIRTY, cache);
}

export function getDirtyCache() {
  const cache = Taro.getStorageSync(DIRTY);
  if (cache) {
    return cache;
  }
  // 初次使用，没有 cache
  else {
    const dft = {
      homepage: true,
      books: true
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