import Taro from "@tarojs/taro";
import { View, Image } from "@tarojs/components";
import { observer, inject } from "@tarojs/mobx";
import {
  AtList,
  AtListItem,
  AtMessage,
  AtTabs,
  AtTabsPane,
  AtDrawer
} from "taro-ui";
import { computed, observable, action, observe } from "mobx";

import "taro-ui/dist/style/components/tabs.scss";
import "taro-ui/dist/style/components/drawer.scss";

import { getMenuData } from "../../api";
import { setMenuCache, setCleanCache } from "../../utils/cache";
import { formatTime, genCloudFileURL } from "../../utils/weapp";
import { isActive } from '../../config'

import BaseComponent from "../../components/Base.jsx";

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
      this.requestMenuData();
    } else if (isDirty) {
      console.log("[menu] cache is dirty");
      this.requestMenuData();
    } else {
      console.log("[menu] cache is available");
    }

    observe(cacheStore, ({ name, type, oldValue, newValue }) => {
      if (name !== "version") return;
      // init
      if (!oldValue && newValue) {
        //
      }
      // update
      else {
        console.log("[menu] version update");
        this.requestMenuData();
      }
    });
  }

  config = {
    navigationBarTitleText: "目录"
  };

  // 标签页
  tabList = isActive ? [{ title: "其他" }, { title: "书籍" }] : [{ title: "其他" }];
  @observable currentTabIndex = isActive ? 1 : 0;
  @action handleClickTab(index) {
    this.currentTabIndex = index;
  }

  // book 和 booklet 数据
  @computed get bookList() {
    return this.props.cacheStore.booksData;
  }
  @computed get nonBookList() {
    const otherList = [];
    if (this.props.cacheStore.othersData.length) {
      otherList.push({
        id: "",
        title: "其他",
        articles: this.props.cacheStore.othersData
      });
    }
    return this.props.cacheStore.bookletsData.concat(otherList);
  }
  @action requestMenuData() {
    console.log("[menu] send request");
    getMenuData()
      .then(data => {
        console.log(data);
        const { cacheStore } = this.props;
        cacheStore.setMenuData(data);
        cacheStore.setClean("menu");
        setMenuCache(data);
        setCleanCache("menu");
      })
      .catch(this.$error);
  }

  // menu
  @observable selectedBookId = '';
  @observable isShowDrawer = false;
  @computed get menuItems() {
    return this.selectedBookId ? this.bookList.find(b => b.id === this.selectedBookId).articles : []
  }
  @action handleClickBook(id) {
    this.selectedBookId = id
    this.isShowDrawer = true
  }
  @action handleCloseDrawer() {
    this.isShowDrawer = false
  }

  render() {
    return (
      <View className='page-menu'>
        <AtMessage />

        <AtTabs
          current={this.currentTabIndex}
          tabList={this.tabList}
          onClick={this.handleClickTab.bind(this)}
        >
        {/* BOOKLETS & OTHERS */}
        <AtTabsPane current={this.currentTabIndex} index={0}>
          <View className='non-book-list'>
            {this.nonBookList.map(item => {
              const { id, title, articles } = item;
              return (
                <View key={id} className='non-book-wrapper'>
                  <View className='non-book__title'>{title}</View>
                  <View className='non-book__articles'>
                    <AtList hasBorder={false}>
                      {articles.map(article => (
                        <AtListItem
                          key={article.realId}
                          title={article.title}
                          note={formatTime(article.timestamp)}
                          onClick={() =>
                            this.navigateToArticle(article.id, article.realId)
                          }
                        />
                      ))}
                    </AtList>
                  </View>
                </View>
              );
            })}
          </View>
        </AtTabsPane>
          {/* BOOKS */}
          {
            isActive && (
              <AtTabsPane current={this.currentTabIndex} index={1}>
                <View className='book-list'>
                  {this.bookList.map(book => {
                    const {
                      id,
                      coverId,
                      intro,
                      title,
                      author,
                    } = book;
                    return (
                      <View key={id} className='book-wrapper' onClick={this.handleClickBook.bind(this, id)}>
                        <View className='book__info'>
                          <View className='info_left'>
                            <Image
                              className='book__cover'
                              src={genCloudFileURL(coverId)}
                              mode='aspectFit'
                            ></Image>
                          </View>
                          <View className='info_right'>
                            <View className='book__title'>{title}</View>
                            <View className='book__author'>{author}</View>
                            <View className='book__intro'>{intro}</View>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </AtTabsPane>
            )
          }
        </AtTabs>

        {/* 目录 */}
        <AtDrawer
          show={this.isShowDrawer}
          mask
          width='80%'
          onClose={this.handleCloseDrawer.bind(this)}
        >
          <AtList hasBorder={false}>
            {this.menuItems.map(article => (
              <AtListItem
                key={article.realId}
                title={article.title}
                note={formatTime(article.timestamp)}
                onClick={() => this.navigateToArticle(article.id, article.realId)}
              />
            ))}
          </AtList>
        </AtDrawer>
      </View>
    );
  }
}
