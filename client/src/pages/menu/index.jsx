import Taro from "@tarojs/taro";
import { View, Image } from "@tarojs/components";
import { observer, inject } from "@tarojs/mobx";
import { AtAccordion, AtList, AtListItem, AtMessage, AtTabs, AtTabsPane } from "taro-ui";
import { computed, observable, action, observe } from "mobx";

import "taro-ui/dist/style/components/tabs.scss"

import { getBookList } from "../../api";
import { setMenuCache, setCleanCache } from "../../utils/cache";
import { formatTime } from '../../utils/weapp'

import BaseComponent from '../../components/Base.jsx'

import "./index.less";

// 如果需要在 h5 环境中开启 React Devtools
// 取消以下注释：
// if (process.env.NODE_ENV !== 'production' && process.env.TARO_ENV === 'h5')  {
//   require('nerv-devtools')
// }

@inject("cacheStore")
@observer
export default class Index extends BaseComponent {
  componentDidMount() {
    const { cacheStore } = this.props;
    const isDirty = cacheStore.dirty.menu;
    if (cacheStore.version === 0) {
      console.log("[menu] no cache");
      this.requestBooksData();
    } else if (isDirty) {
      console.log("[menu] cache is dirty");
      this.requestBooksData();
    } else {
      console.log("[menu] cache is available");
    }
    this.initBooksAccordion();


    observe(cacheStore, ({ name, type, oldValue, newValue }) => {
      if (name !== 'version') return
      // init
      if (!oldValue && newValue) {
        //
      }
      // update
      else {
        console.log('[menu] version update')
        this.requestBooksData();
      }
    })
  }
  componentDidShow() { }
  componentDidHide() { }
  componentDidCatchError() { }

  config = {
    navigationBarTitleText: "目录"
  };

  // tab
  tabList = [
    { title: '书籍' },
    { title: '其他' },
  ]
  @observable currentTabIndex = 0;
  // accordion
  @observable booksAccordion = {}
  @observable bookletsAccordion = {}

  @computed get bookList() {
    return this.props.cacheStore.booksData;
  }
  // booklets & others
  @computed get nonBookList() {
    const others = {
      id: '',
      title: '其他',
      articles: this.props.cacheStore.othersData
    }
    return this.props.cacheStore.bookletsData.concat(others)
  }
  @action toggleAccordion(bookId) {
    const booksAccordion = { ...this.booksAccordion };
    booksAccordion[bookId] = !booksAccordion[bookId];
    this.booksAccordion = booksAccordion
  }
  @action initBooksAccordion() {
    const booksAccordion = {};
    this.props.cacheStore.booksData.forEach(book => {
      booksAccordion[book._id] = false;
    });
    this.booksAccordion = booksAccordion
  }
  @action requestBooksData() {
    console.log("[menu] send request");
    getBookList()
      .then((data) => {
        console.log(data)
        const { cacheStore } = this.props;
        cacheStore.setMenuData(data);
        cacheStore.setClean("menu");
        setMenuCache(data);
        setCleanCache("menu");
        this.initBooksAccordion();
      })
      .catch(this.$error);
  }
  @action handleClickTab(index) {
    this.currentTabIndex = index
  }

  render() {
    return (
      <View className='page-menu'>
        <AtMessage />

        <AtTabs current={this.currentTabIndex} tabList={this.tabList} onClick={this.handleClickTab.bind(this)}>
          {/* BOOKS */}
          <AtTabsPane current={this.currentTabIndex} index={0} >
            <View className='book-list'>
              {this.bookList.map(book => {
                const {
                  id,
                  url,
                  coverId,
                  intro,
                  title,
                  author,
                  articles
                } = book;
                return (
                  <View key={id} className='book-wrapper'>
                    <View className='book__info'>
                      {/* 2.3.0 开始支持以 cloudId 作为 image src */}
                      <Image
                        className='book__cover'
                        src={coverId}
                        mode='aspectFit'
                      ></Image>
                      <View className='book__title'>{title}</View>
                      <View className='book__author'>{author}</View>
                      <View className='book__intro'>{intro}</View>
                    </View>
                    <View className='book__menu'>
                      <AtAccordion
                        open={this.booksAccordion[id]}
                        onClick={this.toggleAccordion.bind(this, id)}
                        title='目录'
                      >
                        <AtList hasBorder={false}>
                          {articles.map(article => (
                            <AtListItem
                              key={article.realId}
                              title={article.title}
                              note={formatTime(article.timestamp)}
                              onClick={() => this.navigateToArticle(article.id, article.realId)}
                            />)

                          )}
                        </AtList>
                      </AtAccordion>
                    </View>
                  </View>
                );
              })}
            </View>
          </AtTabsPane>
          {/* BOOKLETS & OTHERS */}
          <AtTabsPane current={this.currentTabIndex} index={1}>
            <View className='non-book-list'>
              {
                this.nonBookList.map(item => {
                  const { id, title, articles } = item
                  return <View key={id} className='non-book-wrapper'>
                    <View className='non-book__title'>{title}</View>
                    <View className='non-book__articles'>
                      <AtList hasBorder={false}>
                        {articles.map(article => (
                          <AtListItem
                            key={article.realId}
                            title={article.title}
                            note={formatTime(article.timestamp)}
                            onClick={() => this.navigateToArticle(article.id, article.realId)}
                          />)
                        )}
                      </AtList>
                    </View>
                  </View>
                })
              }
            </View>
          </AtTabsPane>
        </AtTabs>
      </View>
    );
  }
}
