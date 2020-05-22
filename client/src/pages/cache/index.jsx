import Taro from "@tarojs/taro";
import { View } from "@tarojs/components";
import { observable, action } from 'mobx'
import { observer } from "@tarojs/mobx";
import { AtMessage, AtDivider, AtSwipeAction, AtList, AtListItem } from "taro-ui";

import "taro-ui/dist/style/components/swipe-action.scss";

import { getArticleCaches, deleteArticleCache } from '../../utils/cache'
import { getUtf8StringKb } from '../../utils'

import BaseComponent from '../../components/Base.jsx'

import "./index.less";

@observer
export default class Index extends BaseComponent {
  componentWillMount() { }
  componentDidMount() {
    this.initCacheData()
  }
  componentDidShow() { }
  componentDidHide() { }
  componentDidCatchError() { }

  swipeOption = [
    {
      text: '删除',
      style: {
        backgroundColor: '#FF4949'
      }
    }
  ]
  @observable cacheList = [];
  @observable cacheCount = 0;
  @observable totalSize = 0;

  @action handleDelete(realId, title) {
    this.log('cache', {
      sub_type: 'delete',
      auto: false,
      real_id: realId,
      title
    })
    deleteArticleCache(realId)
    this.initCacheData()
  }
  @action initCacheData() {
    const caches = getArticleCaches()
    const realIds = Object.keys(caches)
    this.cacheCount = realIds.length
    if (this.cacheCount) {
      this.totalSize = getUtf8StringKb(JSON.stringify(caches))
      const cacheList = realIds.map(realId => {
        const item = caches[realId]
        const size = getUtf8StringKb(JSON.stringify(item))
        const { last_visit, article } = item
        const { title, _id, real_id } = article
        return {
          last_visit,
          title,
          _id,
          real_id,
          size
        }
      })
      cacheList.sort((a, b) => b.last_visit - a.last_visit)
      this.cacheList = cacheList
    }
  }

  config = {
    navigationBarTitleText: "文章缓存"
  };

  render() {
    return (
      <View className='page-user-cache'>
        <AtMessage />
        {
          this.cacheCount === 0
            ? <AtDivider content='没有缓存' fontColor='#aaa' />
            : <View>
              <View style='margin: 20rpx'>
                <View>{this.cacheCount}条缓存，共{this.totalSize}kB</View>
                <View>滑动以删除</View>
              </View>
              <View>
                <AtList>
                  {
                    this.cacheList.map(cacheItem => {
                      const { title, _id, real_id, size } = cacheItem
                      return (
                        <AtSwipeAction key={real_id} options={this.swipeOption} autoClose onClick={this.handleDelete.bind(this, real_id, title)}>
                          <AtListItem title={title} extraText={size + 'kB'} onClick={() => this.navigateToArticle(_id, real_id)} />
                        </AtSwipeAction>
                      )
                    })
                  }
                </AtList>
              </View>
            </View>
        }
      </View>
    );
  }
}
