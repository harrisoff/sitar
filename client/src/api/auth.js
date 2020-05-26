import Taro from "@tarojs/taro";

import callFunction from "./request";
import logger from "../utils/Logger";

export function login(params) {
  return callFunction("login", { params });
}

// 不是小程序的 userInfo，而是数据库里保存的 userData
export function getUserData() {
  return callFunction("getUserData");
}

// 获取用户授权情况
export function getAuthSetting() {
  return new Promise((resolve, reject) => {
    Taro.getSetting()
      .then(({ authSetting }) => {
        logger.log("miniApi", "authSetting", authSetting);
        resolve(authSetting);
      })
      .catch(err => {
        logger.error("miniApi", "authSetting", err);
        reject(err.errMsg);
      });
  });
}

// 保存 userInfo 到数据库
export function updateUserInfo(data) {
  return callFunction("updateUserInfo", { data });
}

// 用户授权 userInfo 后更新数据库（无论是否新用户）
// https://developers.weixin.qq.com/community/develop/doc/000aee01f98fc0cbd4b6ce43b56c01
// 初次授权必须使用 button，然后可以用 Taro.getUserInfo()
export function getAndUpdateUserInfo() {
  return new Promise((resolve, reject) => {
    Taro.getUserInfo()
      .then(res => {
        logger.log("miniApi", "getUserInfo", res);
        const { userInfo } = res;
        updateUserInfo(userInfo)
          .then(resolve)
          .catch(reject);
      })
      .catch(err => {
        logger.error("miniApi", "getUserInfo", err);
        reject(err.errMsg);
      });
  });
}
