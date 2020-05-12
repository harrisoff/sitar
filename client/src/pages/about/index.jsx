import Taro from "@tarojs/taro";
import { observer, inject } from "@tarojs/mobx";
import { View } from "@tarojs/components";
import { AtMessage } from "taro-ui"

import BaseComponent from '../../components/Base.jsx'

import "./index.less";

@inject('cacheStore')
@observer
export default class Index extends BaseComponent {
  componentWillMount() { }
  componentDidMount() { }
  componentDidShow() { }
  componentDidHide() { }
  componentDidCatchError() { }

  config = {
    navigationBarTitleText: "关于"
  };

  render() {
    return (
      <View className='page-about'>
        <AtMessage />
        <View>简介</View>
        <View>内容版本号 v{this.props.cacheStore.version}</View>
        <View>小程序版本号 v0.0.1-beta</View>
        <View>更新日志</View>
      </View>
    );
  }
}
