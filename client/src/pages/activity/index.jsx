import Taro from "@tarojs/taro";
import { View, Image } from "@tarojs/components";
import { AtMessage } from "taro-ui";

import { CDN } from '../../config'

import BaseComponent from "../../components/Base.jsx";

import "./index.less";

export default class Index extends BaseComponent {

  config = {
    navigationBarTitleText: "✨"
  };

  render() {
    return (
      <View className='page-activity'>
        <AtMessage />
        <View style='text-align: center'>
          <Image src={`${CDN.PREFIX1}/activity-ringo.jpg`} mode='aspectFit' />
        </View>
        <View style='padding: 10rpx 20rpx'>
          其实只需要三个页面。
        </View>
        <View style='padding: 10rpx 20rpx'>
          但是一家人就是要整整齐齐的。
        </View>
      </View>
    );
  }
}
