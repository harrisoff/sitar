import Taro from "@tarojs/taro";
import { observable } from "mobx";
import { observer, inject } from "@tarojs/mobx";
import { View } from "@tarojs/components";
import { AtMessage, AtCard } from "taro-ui";

import { getNoticeList } from '../../api'
import { formatTime } from '../../utils/weapp'

import './index.less'

import BaseComponent from "../../components/Base.jsx";

@inject("userStore")
@observer
export default class Index extends BaseComponent {
  componentDidMount() {
    // 从这个页面返回后，首页不再显示通知
    this.props.userStore.deleteNotice()
    // 这个接口会自动更新用户最后一次读通知的时间
    getNoticeList()
      .then(data => {
        this.noticeList = data
      })
      .catch(this.$error)
  }

  config = {
    navigationBarTitleText: "通知"
  };

  @observable noticeList = [];

  render() {
    return (
      <View className='page-notice'>
        <AtMessage />

        {
          this.noticeList.map(notice => {
            const { _id, timestamp, content, title, level } = notice
            return (
              <AtCard key={_id}
                note={formatTime(timestamp, true)}
                title={title}
              >{content}</AtCard>
            )
          })
        }
      </View>
    );
  }
}
