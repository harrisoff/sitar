import Taro from "@tarojs/taro";
import { getBanned } from "../utils/cache";
import { MESSAGES } from "../constants/message";
import logger from "../utils/Logger";

const cloudFn = CLOUD_FN // 定义在 /config

// interceptor
export default function callFunction(fn, data = {}, mainFn = cloudFn) {
  data.fn = fn
  const banned = getBanned();
  const benchmark = `[benchmark] ${fn}`
  console.time(benchmark)
  return new Promise((resolve, reject) => {
    // 被禁时只允许请求 login 接口
    if (banned && fn !== "login") return reject(MESSAGES.BANNED);
    Taro.cloud
      .callFunction({
        name: mainFn,
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
          // 先不记录了，太多了
          // if (fn !== 'uploadLogs') logger.log('callFunction', fn)
          resolve(result);
        } else {
          logger.error("callFunction", fn, response);
          reject(errMsg);
        }
      })
      .catch(error => {
        logger.error("callFunction", fn, error);
        // const { errCode, errMsg, requestID } = error;
        console.error(error);
        reject(error.errMsg);
      })
      .then(_ => {
        console.timeEnd(benchmark)
      })
  });
}
