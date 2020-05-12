import Taro from '@tarojs/taro'
import { getBanned } from '../utils/cache'
import { MESSAGES } from '../constants/message';

// interceptor
export default function callFunction(name, data) {
  const banned = getBanned()
  return new Promise((resolve, reject) => {
    // 被禁时只允许请求 login 接口
    if (banned && data.fn !== 'login') return reject(MESSAGES.BANNED)
    Taro.cloud
      .callFunction({
        name,
        // 传递给云函数的event参数
        data
      })
      .then(response => {
        const {
          // requestID,
          errMsg,
          result
        } = response;
        if (errMsg === "cloud.callFunction:ok") {
          resolve(result);
        } else {
          reject(response);
        }
      })
      .catch(error => {
        // const { errCode, errMsg, requestID } = error;
        console.error(error);
        reject(error.errMsg);
      });
  });
}
