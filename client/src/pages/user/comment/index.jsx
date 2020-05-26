import Taro from "@tarojs/taro";
import { View } from "@tarojs/components";
import { observer, inject } from "@tarojs/mobx";
import { observable } from "mobx";
import { AtMessage, AtDivider, AtActivityIndicator } from "taro-ui";

import { getUserCommentList } from '../../../api';
import { formatTime } from "../../../utils/weapp";

import BaseComponent from "../../../components/Base.jsx";

import "./index.less";

@inject("userStore")
@observer
export default class Index extends BaseComponent {

  componentDidMount() {
    if (!this.props.userStore.hasCommentList) {
      this.isPending = true
      getUserCommentList()
        .then(data => {
          this.props.userStore.setUserComment(data)
        })
        .catch(this.$error)
        .then(_ => {
          this.isPending = false
        })
    }
  }

  @observable isPending = false

  config = {
    navigationBarTitleText: "我的评论"
  };

  render() {
    const { commentList } = this.props.userStore
    return (
      <View className='page-user-comment'>
        <AtMessage />
        {this.isPending
          ? <AtActivityIndicator mode='center' content='加载中'></AtActivityIndicator>
          : commentList.length === 0
            ? <AtDivider content='还没评论过' fontColor='#aaa' />
            : <View className='comment-list'>
              {commentList.map(comment => {
                const {
                  id,
                  content,
                  articleId,
                  realId,
                  timestamp,
                  title
                } = comment;
                return (
                  <View
                    className='comment'
                    key={id}
                    onClick={() => this.navigateToArticle(articleId, realId)}
                  >
                    <View className='comment__article'>{title}</View>
                    <View className='comment__content'>{content}</View>
                    <View className='comment__time'>{formatTime(timestamp)}</View>
                  </View>
                );
              })}
            </View>
        }
      </View>
    );
  }
}
