import Taro from "@tarojs/taro";
import callFunction from "./request";

export function login(params) {
  return callFunction("base", {
    fn: "login",
    params
  });
}

// 不是小程序的 userInfo，而是数据库里保存的 userData
export function getUserData() {
  return callFunction("base", {
    fn: "getUserData",
  });
}

// 获取用户授权情况
export function getAuthSetting() {
  return Taro.getSetting();
}

// 保存 userInfo 到书库
export function saveUserInfo(data) {
  return callFunction("base", {
    fn: "saveUserInfo",
    data
  });
}

// 用户授权 userInfo 后更新数据库（无论是否新用户）
// https://developers.weixin.qq.com/community/develop/doc/000aee01f98fc0cbd4b6ce43b56c01
// 初次授权必须使用 button，然后可以用 Taro.getUserInfo()
export function getAndSaveUserInfo() {
  return new Promise((resolve, reject) => {
    Taro.getUserInfo()
      .then((res) => {
        const { userInfo } = res
        saveUserInfo(userInfo)
          .then(resolve)
          .catch(reject)
      })
      .catch(err => {
        // const { errMsg } = err
        reject(err.errMsg)
      })
  })
}
