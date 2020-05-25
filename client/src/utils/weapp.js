import Taro from '@tarojs/taro'
import dayjs from "dayjs";

import logger from '../utils/Logger'

// 2.3.0 开始支持以 cloudId 作为 image src，但是，傻逼
// https://developers.weixin.qq.com/community/develop/doc/000208079d83e8b8236adfef35b000
export function genCloudFileURL(cloudId) {
  // N4/N10/CLOUD_ENV 定义在 /config
  const splitter = `cloud://${CLOUD_ENV}.${N4}-${CLOUD_ENV}-${N10}/`;
  const filePath = cloudId.split(splitter)[1];
  return encodeURI(
    `https://${N4}-${CLOUD_ENV}-${N10}.tcb.qcloud.la/${filePath}`
  );
}

export function formatTime(t, dropSecond) {
  const format = dropSecond ? "YYYY-MM-DD HH:mm" : "YYYY-MM-DD HH:mm:ss";
  return dayjs(t).format(format);
}

// https://developers.weixin.qq.com/community/develop/doc/000a8cd25f4240c4b428957d254c00
export function setStorageSync(key, value) {
  try {
    Taro.setStorageSync(key, value)
  } catch (err) {
    logger.error('miniApi', 'setStorageSync', err)
    throw err.type
  }
}

export function getStorageSync(key) {
  try {
    return Taro.getStorageSync(key)
  } catch (err) {
    logger.error('miniApi', 'getStorageSync', err)
    throw err.type
  }
}