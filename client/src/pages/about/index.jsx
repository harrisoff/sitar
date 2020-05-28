import Taro from "@tarojs/taro";
import { observer, inject } from "@tarojs/mobx";
import { View, Image } from "@tarojs/components";
import { AtMessage } from "taro-ui";

import { formatTime } from "../../utils/weapp";
import { CDN } from '../../config'

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
        <View style='text-align: center'>
          <Image src={`${CDN.PREFIX1}/welcome.jpg`} style='height: 200rpx' mode='aspectFit' />
        </View>
        <View className='section intro'>
          <View className='section__title'>简介</View>
          <View className='section__content'>
            <View className='intro__content__p'>
              1. 文章、图片均来自同名公众号【西塔尔之声】
            </View>
            <View className='intro__content__p'>
              2. 小程序不修改内容，仅提供分类、搜索、评论等功能
            </View>
            <View className='intro__content__p'>
              3. 不能保证展示效果与公众号完全一致，比如小程序中无法使用超链接
            </View>
          </View>
        </View>
        <View className='section last-update'>
          内容最后更新于{formatTime(this.props.cacheStore.version, true)}
        </View>
      </View>
    );
  }
}
