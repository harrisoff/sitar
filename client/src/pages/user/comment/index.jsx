import Taro from "@tarojs/taro";
import { View } from "@tarojs/components";
import { observer, inject } from "@tarojs/mobx";
import { AtMessage, AtDivider } from "taro-ui";

import {formatTime} from '../../../utils/weapp'

import BaseComponent from '../../../components/Base.jsx'

import "./index.less";

@inject('userStore')
@observer
export default class Index extends BaseComponent {
  componentWillMount() { }
  componentDidMount() {
    console.log(this.props.userStore.commentList)
    console.log(this.props.userStore.likeList)
  }
  componentDidShow() { }
  componentDidHide() { }
  componentDidCatchError() { }

  config = {
    navigationBarTitleText: "我的评论"
  };

  render() {
    return (
      <View className='page-user-comment'>
        <AtMessage />
        {this.props.userStore.commentList.length === 0 && <AtDivider content='还没评论过' fontColor='#aaa' />}
        <View className='comment-list'>
          {
            this.props.userStore.commentList.map(comment => {
              const { id, content, articleId, realId, timestamp, title } = comment
              return <View className='comment' key={id} onClick={() => this.navigateToArticle(articleId, realId)}>
                <View className='comment__article'>{title}</View>
                <View className='comment__content'>{content}</View>
                <View className='comment__time'>{formatTime(timestamp)}</View>
              </View>
            })
          }
        </View>
      </View>
    );
  }
}
