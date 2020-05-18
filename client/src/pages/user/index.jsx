import Taro from "@tarojs/taro";
import { View } from "@tarojs/components";
import { AtList, AtListItem, AtAvatar, AtButton, AtMessage } from "taro-ui";
import { observer, inject } from "@tarojs/mobx";
import { action } from "mobx";

import { getAuthSetting, getAndSaveUserInfo } from '../../api/auth'
import { ROUTES } from '../../config'

import BaseComponent from '../../components/Base.jsx'

import "./index.less";

// 如果需要在 h5 环境中开启 React Devtools
// 取消以下注释：
// if (process.env.NODE_ENV !== 'production' && process.env.TARO_ENV === 'h5')  {
//   require('nerv-devtools')
// }

@inject("userStore")
@observer
export default class Index extends BaseComponent {
  componentDidMount() { }
  componentDidShow() { }
  componentDidHide() { }
  componentDidCatchError() { }

  config = {
    navigationBarTitleText: "我的"
  };

  @action handleUserInfo(res) {
    if (res.detail.errMsg === 'getUserInfo:fail auth deny') {
      // reject
    }
    else {
      // 更新授权状态
      getAuthSetting()
        .then(({ authSetting }) => {
          this.props.userStore.setAuthSetting(authSetting);
        })
        .catch(this.$error)
      // 更新 user 信息
      getAndSaveUserInfo()
        .then(console.log)
        .catch(this.$error)
    }
  }

  render() {
    // 为啥直接写的时候渲染有问题呢？
    const hasAuth = this.props.userStore.hasAuth
    return (
      <View className='page-user'>
        <AtMessage />

        <View className='profile'>
          <AtAvatar
            openData={{ type: "userAvatarUrl" }}
            circle
            className='profile__image'
          ></AtAvatar>
          <View className='profile__nickname'>
            <open-data type='userNickName'></open-data>
          </View>
        </View>

        {hasAuth ?
          <View className='list'>
            <View className='list__item'>
              <AtList>
                <AtListItem title='赞过的' arrow='right' extraText={this.props.userStore.likeList.length + ''} onClick={this.navigateTo.bind(this, ROUTES.USER_LIKE)} />
                <AtListItem title='我的评论' arrow='right' extraText={this.props.userStore.commentList.length + ''} onClick={this.navigateTo.bind(this, ROUTES.USER_COMMENT)} />
              </AtList>
            </View>
            <View className='list__item'>
              <AtList>
                <AtListItem title='文章缓存' onClick={this.navigateTo.bind(this, ROUTES.CACHE)} />
                <AtListItem title='关于' onClick={this.navigateTo.bind(this, ROUTES.ABOUT)} />
              </AtList>
            </View>
          </View>
          :
          <View className='list'>
            <AtButton
              openType='getUserInfo'
              onGetUserInfo={this.handleUserInfo.bind(this)}
            >
              点击授权
            </AtButton >
          </View>
        }
      </View>
    );
  }
}
