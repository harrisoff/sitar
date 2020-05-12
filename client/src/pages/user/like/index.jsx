import Taro from "@tarojs/taro";
import { View } from "@tarojs/components";
import { observer, inject } from "@tarojs/mobx";
import { AtMessage, AtIcon, AtDivider } from "taro-ui";

import { formatTime } from '../../../utils/weapp'

import BaseComponent from '../../../components/Base.jsx'

import "./index.less";

@inject('userStore')
@observer
export default class Index extends BaseComponent {
  componentWillMount() { }
  componentDidMount() { }
  componentDidShow() { }
  componentDidHide() { }
  componentDidCatchError() { }

  config = {
    navigationBarTitleText: "我赞过的"
  };

  render() {
    return (
      <View className='page-user-like'>
        <AtMessage />
        {this.props.userStore.likeList.length === 0 && <AtDivider content='还没点过赞' fontColor='#aaa' />}
        <View className='like-list'>
          {
            this.props.userStore.likeList.map(article => {
              const { id, realId, timestamp, title, like } = article
              return <View className='article' key={id} onClick={this.navigateToArticle.bind(this, id, realId)}>
                <View className='left'>
                  <View className='title'>{title}</View>
                  <View className='time'>{formatTime(timestamp)}</View>
                </View>
                <View className='right'>
                  <AtIcon
                    className='info__liked'
                    value='heart'
                    size='18'
                    color='rgb(7,193,96)'
                  ></AtIcon>
                  {like}
                </View>
              </View>
            })
          }
        </View>
      </View>
    );
  }
}
