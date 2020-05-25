import Taro from "@tarojs/taro";
import { View } from "@tarojs/components";
import { observable, action } from "mobx";
import { observer } from "@tarojs/mobx";
import {
  AtMessage,
  AtDivider,
  AtSwipeAction,
  AtList,
  AtListItem,
  AtActivityIndicator
} from "taro-ui";

import "taro-ui/dist/style/components/swipe-action.scss";

import { getArticleCaches, deleteArticleCache } from "../../utils/cache";
import { getUtf8StringKb } from "../../utils";
import {SETTINGS} from '../../config'

import BaseComponent from "../../components/Base.jsx";

import "./index.less";

@observer
export default class Index extends BaseComponent {
  componentWillMount() {}
  componentDidMount() {
    this.initCacheData();
  }
  componentDidShow() {}
  componentDidHide() {}
  componentDidCatchError() {}

  swipeOption = [
    {
      text: "删除",
      style: {
        backgroundColor: "#FF4949"
      }
    }
  ];
  @observable isPending = true;
  @observable cacheList = [];
  @observable cacheCount = 0;
  @observable totalSize = 0;

  @action handleOpen(item) {
    item.swiped = true;
  }
  @action handleDelete(item) {
    const { real_id, title } = item;
    this.log("user", "cache", {
      action: "delete",
      real_id,
      title
    });
    deleteArticleCache(real_id);
    this.initCacheData();
  }
  @action initCacheData() {
    this.isPending = true;
    const caches = getArticleCaches();
    const realIds = Object.keys(caches);
    this.cacheCount = realIds.length;
    if (this.cacheCount) {
      this.totalSize = getUtf8StringKb(JSON.stringify(caches));
      const cacheList = realIds.map(realId => {
        const item = caches[realId];
        const size = getUtf8StringKb(JSON.stringify(item));
        const { last_visit, article } = item;
        const { title, _id, real_id } = article;
        return {
          last_visit,
          title,
          _id,
          real_id,
          size,
          swiped: false
        };
      });
      cacheList.sort((a, b) => b.last_visit - a.last_visit);
      this.cacheList = cacheList;
    }
    this.isPending = false;
  }
  @action handleClickItem(item) {
    if (item.swiped) {
      item.swiped = false;
    } else {
      const { real_id, _id } = item;
      this.navigateToArticle(_id, real_id);
    }
  }

  config = {
    navigationBarTitleText: "文章缓存"
  };

  render() {
    return (
      <View className='page-user-cache'>
        <AtMessage />
        {this.isPending ? (
          <AtActivityIndicator
            mode='center'
            content='计算中...'
          ></AtActivityIndicator>
        ) : this.cacheCount === 0 ? (
          <AtDivider content='没有缓存' fontColor='#aaa' />
        ) : (
          <View>
            <View style='margin: 20rpx'>
              <View>
                {this.cacheCount}条缓存，共{this.totalSize}kB
              </View>
              <View>达到 {SETTINGS.ARTICLE_CACHE_LIMIT}kB 时自动删除最近未访问的缓存</View>
              <View>滑动以删除</View>
            </View>
            <View>
              <AtList>
                {this.cacheList.map(cacheItem => {
                  const { title, real_id, size } = cacheItem;
                  return (
                    <AtSwipeAction
                      key={real_id}
                      options={this.swipeOption}
                      autoClose
                      isOpened={cacheItem.swiped}
                      onClick={this.handleDelete.bind(this, cacheItem)}
                      onOpened={this.handleOpen.bind(this, cacheItem)}
                    >
                      <AtListItem
                        title={title}
                        extraText={size + "kB"}
                        onClick={this.handleClickItem.bind(this, cacheItem)}
                      />
                    </AtSwipeAction>
                  );
                })}
              </AtList>
            </View>
          </View>
        )}
      </View>
    );
  }
}
