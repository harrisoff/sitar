import Taro from "@tarojs/taro";
import { observer } from "@tarojs/mobx";
import { View } from "@tarojs/components";
import { AtMessage, AtDivider, AtActivityIndicator } from "taro-ui";
import { observable } from 'mobx'

import { searchArticleByKeyword } from '../../api'
import { formatTime } from '../../utils/weapp'

import BaseComponent from '../../components/Base.jsx'

import "./index.less";

@observer
export default class Index extends BaseComponent {
  componentDidMount() {
    const { keyword } = this.$router.params
    this.log('user', 'search', {
      keyword
    })
    Taro.setNavigationBarTitle({ title: `搜索结果: ${keyword}` })
    searchArticleByKeyword(keyword)
      .then(({ data }) => {
        this.searchResults = data
      })
      .catch(this.$error)
      .then(_ => {
        this.hasResponse = true
      })
  }

  config = {
    navigationBarTitleText: ""
  };

  @observable hasResponse = false
  @observable searchResults = []

  handleClickResult(articleId, realId) {
    this.navigateToArticle(articleId, realId, this.$router.params.keyword)
  }

  render() {
    return (
      <View className='page-search'>
        <AtMessage />
        {
          this.hasResponse
            ?
            this.searchResults.length === 0
              ?
              <AtDivider content='莫得结果' fontColor='#aaa' />
              :
              this.searchResults.map(result => {
                const { _id, url, timestamp, title, real_id, book_title, book_id } = result
                return <View key={_id} className='search-item' onClick={this.handleClickResult.bind(this, _id, real_id)}>
                  <View className='book-title'>{book_title}</View>
                  <View className='article-title'>{title}</View>
                  <View className='time'>{formatTime(timestamp)} </View>
                </View>
              })
            :
            <AtActivityIndicator mode='center' content='搜索中...'></AtActivityIndicator>
        }
      </View>
    );
  }
}
