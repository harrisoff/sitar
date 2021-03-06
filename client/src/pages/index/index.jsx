import Taro from "@tarojs/taro";
import { View, Swiper, SwiperItem, Text, Image } from "@tarojs/components";
import { observer, inject } from "@tarojs/mobx";
import {
  AtCurtain,
  AtMessage,
  AtSearchBar,
  AtActivityIndicator,
  AtGrid,
  AtNoticebar
} from "taro-ui";
import { computed, observable, action, observe } from "mobx";
import "taro-ui/dist/style/components/grid.scss";
import "taro-ui/dist/style/components/noticebar.scss"

import {
  getHomepageData,
  getRandomArticle,
  getRandomImage,
  getRandomSong
} from "../../api";
import {
  setHomepageCache,
  setCleanCache,
  getRandomLimit,
  setRandomRecord
} from "../../utils/cache";
import { genCloudFileURL } from "../../utils/weapp";
import { ROUTES, isActive } from "../../config";
import { MESSAGES } from "../../constants/message";

import BaseComponent from "../../components/Base.jsx";

import "./index.less";

@inject("cacheStore", "userStore")
@observer
export default class Index extends BaseComponent {

  componentDidMount() {
    // 初始化
    const { cacheStore } = this.props;
    const isDirty = cacheStore.dirty.homepage;
    // 初次加载
    if (cacheStore.version === 0) {
      console.log("[homepage] no cache");
      this.requestHomepageData();
    }
    // 缓存过期
    else if (isDirty) {
      console.log("[homepage] cache is dirty");
      this.requestHomepageData();
    }
    // 缓存没有过期
    else {
      console.log("[homepage] cache is available");
      // computed
    }

    observe(cacheStore, ({ name, type, oldValue, newValue }) => {
      if (name !== "version") return;
      // init
      if (!oldValue && newValue) {
        //
      }
      // update
      else {
        console.log("[homepage] version update");
        this.requestHomepageData();
      }
    });
  }
  onShareAppMessage(res) {
    const { from } = res;
    // 页面内转发按钮
    if (from === "button") {
    }
    // 右上角菜单
    else if (from === "menu") {
    }
    return {
      title: "西塔尔之声",
      path: ROUTES.INDEX
      // imageUrl: ''
    };
  }

  config = {
    navigationBarTitleText: "首页"
  };

  // 文章数据
  @computed get latestList() {
    const { list, top } = this.props.cacheStore.homepageData;
    return top.concat(list);
  }
  @computed get carousel() {
    return this.props.cacheStore.homepageData.carousel;
  }
  @action requestHomepageData() {
    console.log("[homepage] send request");
    getHomepageData()
      .then(data => {
        const { cacheStore } = this.props;
        cacheStore.setHomepageData(data);
        cacheStore.setClean("homepage");
        setHomepageCache(data);
        setCleanCache("homepage");
      })
      .catch(this.$error);
  }

  // 搜索
  @observable keyword = "";
  @action handleKeywordChange(value) {
    this.keyword = value;
  }
  @action handleSearch() {
    if (!this.keyword) return;
    Taro.navigateTo({
      url: `${ROUTES.SEARCH}?keyword=${this.keyword}`
    });
  }

  // 随机
  randomItemsFull = [
    {
      type: "article",
      iconInfo: { value: "align-left" },
      value: "随机文章"
    },
    {
      type: "song",
      iconInfo: { value: "sound" },
      value: "每日一披"
    },
    {
      type: "image",
      iconInfo: { value: "image" },
      value: "随机图片"
    }
  ];
  randomItemsForAudit = [
    {
      type: "article",
      iconInfo: { value: "align-left" },
      value: "随机文章"
    }
  ];
  randomItems = isActive ? this.randomItemsFull : this.randomItemsForAudit;
  @observable randomUrl = "";
  @observable isRandomImageVisible = false;
  @observable isGettingRandom = false;
  @observable randomTitle = "";
  @action handleRandomClose() {
    this.isRandomImageVisible = false;
  }
  @action handleGetRandom({ type }) {
    // 并不能完全防止多次触发
    if (this.isGettingRandom) return;
    const limit = getRandomLimit(type);
    if (limit <= 0) {
      const info =
        type === "song" ? MESSAGES.RANDOM_SONG_LIMIT : MESSAGES.RANDOM_LIMIT;
      return this.$info(info);
    }
    this.isGettingRandom = true;
    if (type === "article") {
      getRandomArticle()
        .then(({ id, realId }) => {
          this.navigateToArticle(id, realId);
          setRandomRecord(type);
          this.log("user", "random", { type, real_id: realId });
        })
        .catch(this.$error)
        .then(_ => {
          this.isGettingRandom = false;
        });
    } else if (type === "image") {
      getRandomImage()
        .then(({ url, media_id, errMsg }) => {
          setRandomRecord(type);
          if (errMsg) {
            return this.$warn(errMsg);
          }
          this.randomTitle = "";
          this.randomUrl = url;
          this.isRandomImageVisible = true;
          this.log("user", "random", { type, media_id: media_id });
        })
        .catch(this.$error)
        .then(_ => {
          this.isGettingRandom = false;
        });
    } else {
      // 本地和服务端都记录上次使用时间
      // 一般情况下只需要本地判断，到达使用次数时不会发送请求
      // 但是如果本地缓存被清空，就会发送请求，由服务端判断
      getRandomSong()
        .then(({ song, latest, errMsg }) => {
          // 更新本地记录
          setRandomRecord(type, latest);
          // 留个坑
          // 如果出现版权问题，不需要发布新版本，只改服务端返回值就好了
          if (errMsg) {
            return this.$warn(errMsg);
          }
          // 到达使用次数时，不返回 song 数据
          if (!song) {
            return this.$warn(MESSAGES.RANDOM_SONG_LIMIT);
          }
          const { _id, cover, album, cloudId, cdnUrl, artist } = song;
          // 原 title 像这样：B4. Sun King
          // FIXME: 见云函数 getRandomSong
          const title = song.title.split(". ").pop();
          const url = cdnUrl ? encodeURI(cdnUrl) : genCloudFileURL(cloudId);
          const coverImgUrl = genCloudFileURL(cover);
          const backgroundAudioManager = Taro.getBackgroundAudioManager();
          backgroundAudioManager.onError(err => {
            console.error(err);
            this.error("miniApi", "backgroundAudioManager", err);
            this.$error(err.errCode);
          });
          backgroundAudioManager.onEnded(_ => {
            // 傻逼小程序
            // 这时 play() 没用，貌似是因为 onEnded() 会删除 src
            backgroundAudioManager.src = url;
          });
          backgroundAudioManager.title = title;
          backgroundAudioManager.epname = album;
          backgroundAudioManager.singer = artist;
          backgroundAudioManager.coverImgUrl = coverImgUrl;
          backgroundAudioManager.src = url;
          this.randomUrl = coverImgUrl;
          this.randomTitle = title;
          this.isRandomImageVisible = true;
          this.log("user", "random", { type, _id, title });
        })
        .catch(this.$error)
        .then(_ => {
          this.isGettingRandom = false;
        });
    }
  }

  // 通知
  handleClickNotice() {
    Taro.navigateTo({
      url: ROUTES.NOTICE
    });
  }

  render() {
    const { noticeTitle } = this.props.userStore
    return (
      <View className='page-homepage'>
        <AtMessage />
        <AtActivityIndicator
          isOpened={this.isGettingRandom}
          mode='center'
          size={48}
        ></AtActivityIndicator>
        {
          noticeTitle && <AtNoticebar single showMore onGotoMore={this.handleClickNotice.bind(this)}>{noticeTitle}</AtNoticebar>
        }

        {/* search */}
        <AtSearchBar
          value={this.keyword}
          onChange={this.handleKeywordChange.bind(this)}
          onActionClick={this.handleSearch.bind(this)}
        />

        {/* carousel */}
        <View className='carousel'>
          <Swiper
            indicator-dots={false}
            autoplay
            interval={3000}
            duration={500}
            className='swiper'
          >
            {this.carousel.map(item => (
              <SwiperItem
                key={item.real_id}
                onClick={() => this.navigateToArticle(item._id, item.real_id)}
              >
                <View
                  style={{ backgroundImage: `url(${item.thumb_url})` }}
                  className='swiper-item__image'
                ></View>
                <Text className='swiper-item__title'>{item.title}</Text>
              </SwiperItem>
            ))}
          </Swiper>
        </View>

        {/* random */}
        <View className='section random'>
          <View className='section__title'>手气不错</View>
          <View className='section__body random__wrapper'>
            <AtGrid
              data={this.randomItems}
              onClick={this.handleGetRandom.bind(this)}
            ></AtGrid>
          </View>
        </View>

        {/* list */}
        <View className='section list'>
          <View className='section__title'>最近更新</View>
          <View className='section__body list__wrapper'>
            {this.latestList.map(item => (
              <View
                key={item.real_id}
                className='list__item'
                onClick={() => this.navigateToArticle(item._id, item.real_id)}
              >
                {item.top && <Text className='article_top'>置顶</Text>}
                <Image
                  className='article__image'
                  mode='aspectFill'
                  src={item.thumb_url}
                />
                <View className='article__info'>
                  <View className='info__title'>{item.title}</View>
                  <View className='info__intro'>{item.digest}</View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 随机图片/歌曲封面 */}
        <View className='random-image'>
          <AtCurtain
            isOpened={this.isRandomImageVisible}
            onClose={this.handleRandomClose.bind(this)}
          >
            <View
              className='random-image__image'
              style={{
                backgroundImage: `url("${this.randomUrl}")`
              }}
            ></View>
            {this.randomTitle && (
              <View style='color: white; text-align: center; font-weight: bold'>
                {this.randomTitle}
              </View>
            )}
          </AtCurtain>
        </View>
      </View>
    );
  }
}
