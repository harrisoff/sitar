import Taro from "@tarojs/taro";
import { observer } from "@tarojs/mobx";
import { View } from "@tarojs/components";
import { AtMessage, AtDivider } from "taro-ui";
import { observable } from 'mobx'

import { searchArticleByKeyword } from '../../api'
import { formatTime } from '../../utils/weapp'

import BaseComponent from '../../components/Base.jsx'

import "./index.less";

@observer
export default class Index extends BaseComponent {
  componentWillMount() { }
  componentDidMount() {
    const { keyword } = this.$router.params
    Taro.setNavigationBarTitle({ title: `搜索结果: ${keyword}` })
    searchArticleByKeyword(keyword)
      .then(({ data }) => {
        this.searchResults = data
      })
      .catch(this.$error)
  }
  componentDidShow() { }
  componentDidHide() { }
  componentDidCatchError() { }

  @observable searchResults = []

  config = {
    navigationBarTitleText: ""
  };

  handleClickResult(articleId, realId) {
    this.navigateToArticle(articleId, realId, this.$router.params.keyword)
  }

  render() {
    return (
      <View className='page-search'>
        <AtMessage />
        {this.searchResults.length === 0 && <AtDivider content='莫得结果' fontColor='#aaa' />}
        {this.searchResults.map(result => {
          const { _id, url, timestamp, title, real_id, book_title, book_id } = result
          return <View key={_id} className='search-item' onClick={this.handleClickResult.bind(this, _id, real_id)}>
            <View className='book-title'>{book_title}</View>
            <View className='article-title'>{title}</View>
            <View className='time'>{formatTime(timestamp)} </View>
          </View>
        })}
      </View>
    );
  }
}
