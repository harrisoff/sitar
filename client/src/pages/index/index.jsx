import Taro from "@tarojs/taro";
import { View, Swiper, SwiperItem, Text, Image } from "@tarojs/components";
import { observer, inject } from "@tarojs/mobx";
import { AtCurtain, AtMessage, AtSearchBar, AtActivityIndicator } from "taro-ui"
import { computed, observable, action, observe } from "mobx";

import { getHomepageData, getRandomArticle, getRandomImage } from "../../api";
import { setHomepageCache, setCleanCache, getRandomLimit, setRandomRecord } from "../../utils/cache";
import { ROUTES } from '../../config'
import { MESSAGES } from '../../constants/message'

import BaseComponent from '../../components/Base.jsx'

import "./index.less";

@inject("cacheStore")
@observer
export default class Index extends BaseComponent {
  // life cycle

  componentWillMount() { }
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
      if (name !== 'version') return
      // init
      if (!oldValue && newValue) {
        //
      }
      // update
      else {
        console.log('[homepage] version update')
        this.requestHomepageData();
      }
    })
  }
  componentWillUnmount() { }
  componentDidShow() { }
  componentDidHide() { }

  // data

  randomItems = [
    {
      type: 'article',
      icon: 'file-generic',
      title: '随机文章'
    },
    {
      type: 'image',
      icon: 'image',
      title: '随机图片'
    }
  ]

  config = {
    navigationBarTitleText: "首页"
  };

  // reactive data

  // search
  @observable keyword = '';
  // random image
  @observable randomUrl = ''
  @observable isRandomImageVisible = false;
  @observable isGettingRandom = false;

  // computed data

  @computed get latestList() {
    const { list, top } = this.props.cacheStore.homepageData;
    return top.concat(list);
  }
  @computed get carousel() {
    return this.props.cacheStore.homepageData.carousel;
  }

  // actions

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
  @action handleKeywordChange(value) {
    this.keyword = value
  }
  @action handleSearch() {
    if (!this.keyword) return
    Taro.navigateTo({
      url: `${ROUTES.SEARCH}?keyword=${this.keyword}`
    })
  }
  @action handleRandomClose() {
    this.isRandomImageVisible = false
  }

  handleGetRandom(id) {
    // 并不能完全防止多次触发
    if (this.isGettingRandom) return
    const limit = getRandomLimit()
    if (!limit) return this.$info(MESSAGES.RANDOM_LIMIT)
    setRandomRecord()
    this.isGettingRandom = true;
    if (id === 'article') {
      getRandomArticle()
        .then((res) => {
          this.navigateToArticle(res.id, res.realId)
        })
        .catch(this.$error)
        .then(_ => {
          this.isGettingRandom = false
        })
    } else if (id === 'image') {
      getRandomImage()
        .then(url => {
          this.randomUrl = url
          this.isRandomImageVisible = true
        })
        .catch(this.$error)
        .then(_ => {
          this.isGettingRandom = false
        })
    }
  }

  onShareAppMessage(res) {
    const { from } = res
    // 页面内转发按钮
    if (from === 'button') {
    }
    // 右上角菜单
    else if (from === 'menu') {
    }
    return {
      title: '西塔尔之声',
      path: ROUTES.INDEX,
      // imageUrl: ''
    }
  }

  render() {
    return (
      <View className='page-homepage'>
        <AtMessage />
        <AtActivityIndicator isOpened={this.isGettingRandom} mode='center' size={48}></AtActivityIndicator>

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
                <View style={{ backgroundImage: `url(${item.thumb_url})` }} className='swiper-item__image'></View>
                <Text className='swiper-item__title'>{item.title}</Text>
              </SwiperItem>
            ))}
          </Swiper>
        </View>

        {/* random */}
        <View className='section random'>
          <View className='section__title'>
            随机阅读
          </View>
          <View className='section__body random__wrapper'>
            {
              this.randomItems.map(data => {
                const { type, icon, title } = data
                return <View key={type}
                  className='random__item'
                  hover-class='random__item_hover'
                  onClick={this.handleGetRandom.bind(this, type)}
                >
                  <View className='random__item__icon'>
                    <View className={`at-icon at-icon-${icon}`}></View>
                  </View>
                  <View className='random__item__text'>
                    <View>{title}</View>
                  </View>
                </View>
              })
            }
          </View>
        </View>

        {/* list */}
        <View className='section list'>
          <View className='section__title'>
            最近更新
        </View>
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

        {/* 随机图片 */}
        <View className='random-image'>
          <AtCurtain
            isOpened={this.isRandomImageVisible}
            onClose={this.handleRandomClose.bind(this)}
          >
            <View
              className='random-image__image'
              style={{
                backgroundImage: `url("${this.randomUrl}")`,
              }}
            ></View>
          </AtCurtain>
        </View>
      </View>
    );
  }
}
