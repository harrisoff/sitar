import Taro from "@tarojs/taro";
import { observer, inject } from "@tarojs/mobx";
import { View } from "@tarojs/components";
import { AtMessage } from "taro-ui";

import { formatTime } from "../../utils/weapp";

import BaseComponent from "../../components/Base.jsx";

import "./index.less";

@inject("cacheStore")
@observer
export default class Index extends BaseComponent {

  config = {
    navigationBarTitleText: "关于"
  };

  render() {
    return (
      <View className='page-about'>
        <AtMessage />
        <View>简介</View>
        <View>
          内容最后更新于{formatTime(this.props.cacheStore.version, true)}
        </View>
        <View>小程序版本号 v0.0.1-beta</View>
        <View>更新日志</View>
      </View>
    );
  }
}
