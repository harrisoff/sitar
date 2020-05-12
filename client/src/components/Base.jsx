import Taro, { Component } from "@tarojs/taro";

import { ROUTES } from '../config'

export default class Index extends Component {
  componentWillMount() { }
  componentDidMount() { }
  componentDidShow() { }
  componentDidHide() { }
  componentDidCatchError() { }

  // message
  $success(message) {
    Taro.atMessage({
      message,
      type: 'success',
    })
  }
  $info(message) {
    Taro.atMessage({
      message,
      type: 'info',
    })
  }
  $warn(message) {
    Taro.atMessage({
      message,
      type: 'warning',
    })
  }
  $error(message) {
    console.error(message)
    Taro.atMessage({
      message,
      type: 'error',
    })
  }
  // navigate
  navigateTo(url) {
    Taro.navigateTo({
      url,
    })
  }
  navigateToArticle(id, realId) {
    Taro.navigateTo({
      url: `${ROUTES.ARTICLE}?_id=${id}&real_id=${realId}`,
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
