import Taro from "@tarojs/taro";
import { View } from "@tarojs/components";
import { observer, inject } from "@tarojs/mobx";
import { AtMessage, AtDivider } from "taro-ui";

import { formatTime } from "../../../utils/weapp";

import BaseComponent from "../../../components/Base.jsx";

import "./index.less";

@inject("userStore")
@observer
export default class Index extends BaseComponent {
  
  config = {
    navigationBarTitleText: "我赞过的"
  };

  render() {
    return (
      <View className='page-user-like'>
        <AtMessage />
        {this.props.userStore.likeList.length === 0 && (
          <AtDivider content='还没点过赞' fontColor='#aaa' />
        )}
        <View className='like-list'>
          {this.props.userStore.likeList.map(article => {
            const { id, realId, timestamp, title } = article;
            return (
              <View
                className='article'
                key={id}
                onClick={() => this.navigateToArticle(id, realId)}
              >
                <View className='left'>
                  <View className='title'>{title}</View>
                  <View className='time'>{formatTime(timestamp)}</View>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  }
}
