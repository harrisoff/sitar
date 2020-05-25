import Taro, { Component } from "@tarojs/taro";

import { ROUTES } from "../config";
import { getAndUpdateUserInfo, getAuthSetting } from "../api/auth";
import logger from "../utils/Logger";

export default class Index extends Component {

  // auth
  onGetUserInfo(res) {
    return new Promise((resolve, reject) => {
      if (res.detail.errMsg === "getUserInfo:fail auth deny") {
        this.log("miniApi", "getUserInfo", {
          ...res.detail
        });
      } else {
        // 更新授权状态
        getAuthSetting()
          .then(resolve)
          .catch(reject);
        // 更新 user 信息
        getAndUpdateUserInfo()
          .then()
          .catch(this.$error);
      }
    });
  }
  // log
  log(...params) {
    logger.log(...params);
  }
  debug(...params) {
    logger.debug(...params);
  }
  error(...params) {
    logger.error(...params);
  }
  upload() {
    logger.upload();
  }
  // message
  $success(message) {
    Taro.atMessage({
      message,
      type: "success"
    });
  }
  $info(message) {
    Taro.atMessage({
      message,
      type: "info"
    });
  }
  $warn(message) {
    Taro.atMessage({
      message,
      type: "warning"
    });
  }
  $error(message) {
    console.error(message);
    const parsed = typeof message === 'string' ? message : JSON.stringify(message)
    Taro.atMessage({
      message: parsed,
      type: "error"
    });
  }
  // navigate
  navigateTo(url) {
    Taro.navigateTo({
      url
    });
  }
  navigateToArticle(id, realId, keyword) {
    let url = `${ROUTES.ARTICLE}?_id=${id}&real_id=${realId}`;
    if (keyword) url += `&keyword=${keyword}`;
    Taro.navigateTo({
      url,
      events: {
        // 为指定事件添加一个监听器，获取被打开页面传送到当前页面的数据
        // 被打开页面还能向当前页面传送数据？？
        // acceptDataFromOpenedPage: function (data) {
        //   console.log(data)
        // },
        // someEvent: function (data) {
        //   console.log(data)
        // }
      },
      success(res) {
        // 通过eventChannel向被打开页面传送数据
        // TODO: cannot read property emit of undefined
        // res.eventChannel.emit('acceptDataFromOpenerPage', { data: 'test' })
      }
    });
  }
}
