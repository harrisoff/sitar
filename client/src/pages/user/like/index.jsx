import Taro from "@tarojs/taro";
import { View } from "@tarojs/components";
import { observer, inject } from "@tarojs/mobx";
import { observable } from "mobx";
import { AtMessage, AtDivider, AtActivityIndicator } from "taro-ui";

import { getUserLikeList } from '../../../api';
import { formatTime } from "../../../utils/weapp";

import BaseComponent from "../../../components/Base.jsx";

import "./index.less";

@inject("userStore")
@observer
export default class Index extends BaseComponent {

  componentDidMount() {
    if (!this.props.userStore.hasLikeList) {
      this.isPending = true
      getUserLikeList()
        .then(data => {
          this.props.userStore.setUserLike(data)
        })
        .catch(this.$error)
        .then(_ => {
          this.isPending = false
        })
    }
  }

  @observable isPending = false

  config = {
    navigationBarTitleText: "我赞过的"
  };

  render() {
    const { likeList } = this.props.userStore
    return (
      <View className='page-user-like'>
        <AtMessage />
        {this.isPending
          ? <AtActivityIndicator mode='center' content='加载中'></AtActivityIndicator>
          : likeList.length === 0
            ? <AtDivider content='还没点过赞' fontColor='#aaa' />
            : <View className='like-list'>
              {likeList.map(article => {
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
        }
      </View>
    );
  }
}
