import Taro from "@tarojs/taro";
import { View } from "@tarojs/components";
import { AtList, AtListItem, AtAvatar, AtButton, AtMessage } from "taro-ui";
import { observer, inject } from "@tarojs/mobx";
import { action } from "mobx";

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

  config = {
    navigationBarTitleText: "我的"
  };

  @action handleGetUserInfo(res) {
    this.onGetUserInfo(res)
      .then(authSetting => {
        this.props.userStore.setAuthSetting(authSetting);
      })
      .catch(this.$error)
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
                <AtListItem title='赞过的' arrow='right' onClick={this.navigateTo.bind(this, ROUTES.USER_LIKE)} />
                <AtListItem title='我的评论' arrow='right' onClick={this.navigateTo.bind(this, ROUTES.USER_COMMENT)} />
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
          <View>
            <AtButton
              className='button__auth'
              openType='getUserInfo'
              onGetUserInfo={this.handleGetUserInfo.bind(this)}
            >
              登录解锁全部功能
            </AtButton >
          </View>
        }
      </View>
    );
  }
}
