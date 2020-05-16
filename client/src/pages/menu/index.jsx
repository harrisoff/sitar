import Taro from "@tarojs/taro";
import { View, Image } from "@tarojs/components";
import { observer, inject } from "@tarojs/mobx";
import { AtAccordion, AtList, AtListItem, AtMessage, AtTabs, AtTabsPane } from "taro-ui";
import { when, computed, observable, action } from "mobx";

import "taro-ui/dist/style/components/tabs.scss"

import { getBookList } from "../../api";
import { setBooksCache, setCleanCache } from "../../utils/cache";
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
    const isDirty = cacheStore.dirty.books;
    if (cacheStore.version === 0) {
      console.log("[books] no cache");
    } else if (isDirty) {
      console.log("[books] cache is dirty");
      this.isRequesting = true;
      this.requestBooksData();
    } else {
      console.log("[books] cache is available");
    }
    this.initTabStatus();

    when(
      () => cacheStore.dirty.books,
      () => {
        if (!this.isRequesting) {
          console.log("[books] cache version was updated");
          this.requestBooksData();
        }
      }
    );
  }
  componentDidShow() { }
  componentDidHide() { }
  componentDidCatchError() { }

  config = {
    navigationBarTitleText: "目录"
  };

  @observable isRequesting = false;
  @observable tabStatus = {}
  // tab
  tabList = [
    { title: '书籍' },
    { title: '其他' },
  ]
  @observable currentTabIndex = 0;

  @computed get bookList() {
    return this.props.cacheStore.booksData;
  }
  @action toggleTab(bookId) {
    const tabStatus = { ...this.tabStatus };
    tabStatus[bookId] = !tabStatus[bookId];
    this.tabStatus = tabStatus
  }
  @action initTabStatus() {
    const tabStatus = {};
    this.props.cacheStore.booksData.forEach(book => {
      tabStatus[book._id] = false;
    });
    this.tabStatus = tabStatus
  }
  @action requestBooksData() {
    console.log("[books] send request");
    getBookList()
      .then((data) => {
        console.log(data)
        const { books, booklets, others } = data;
        books.forEach(book => {
          // 2.3.0 开始支持以 cloudId 作为 image src
          book.coverUrl = book.coverId
          book.articles.forEach(article => {
            article.time = formatTime(article.timestamp);
          });
        });
        this.isRequesting = false;
        const { cacheStore } = this.props;
        cacheStore.setBooksData(books);
        cacheStore.setClean("books");
        setBooksCache(books);
        setCleanCache("books");
        this.initTabStatus();
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
          <AtTabsPane current={this.currentTabIndex} index={0} >
            <View className='book-list'>
              {this.bookList.map(book => {
                const {
                  id,
                  url,
                  coverUrl,
                  intro,
                  title,
                  author,
                  articles
                } = book;
                return (
                  <View key={id} className='book-wrapper'>
                    <View className='book__info'>
                      <Image
                        className='book__cover'
                        src={coverUrl}
                        mode='aspectFit'
                      ></Image>
                      <View className='book__title'>{title}</View>
                      <View className='book__author'>{author}</View>
                      <View className='book__intro'>{intro}</View>
                    </View>
                    <View className='book__menu'>
                      <AtAccordion
                        open={this.tabStatus[id]}
                        onClick={this.toggleTab.bind(this, id)}
                        title='目录'
                      >
                        <AtList hasBorder={false}>
                          {articles.map(article => {
                            const {
                              realId,
                              time,
                            } = article;
                            return (
                              <AtListItem
                                key={realId}
                                title={article.title}
                                note={time}
                                onClick={() => this.navigateToArticle(article.id, realId)}
                              />
                            );
                          })}
                        </AtList>
                      </AtAccordion>
                    </View>
                  </View>
                );
              })}
            </View>
          </AtTabsPane>
          <AtTabsPane current={this.currentTabIndex} index={1}>
            <View style='padding: 100px 50px;background-color: #FAFBFC;text-align: center;'>
            </View>
          </AtTabsPane>
        </AtTabs>
      </View>
    );
  }
}
