import Taro from "@tarojs/taro";
import { View, Text, RichText, Button } from "@tarojs/components";
import { observer, inject } from "@tarojs/mobx";
import { AtIcon, AtFloatLayout, AtTextarea, AtMessage } from "taro-ui";
import { observable, computed, action } from "mobx";
import "taro-ui/dist/style/components/article.scss";

import { getArticleById, toggleLike, addComment, getArticleComments } from "../../api";
import { getAuthSetting, getAndSaveUserInfo } from '../../api/auth'
import { formatTime } from "../../utils/weapp";
import { getArticleCache, setArticleCache, updateArticleCacheTime, garbageCollect } from '../../utils/cache'

import BaseComponent from '../../components/Base.jsx'

import "./index.less";

@inject("cacheStore", "userStore")
@observer
export default class Index extends BaseComponent {
  componentWillMount() { }
  componentDidMount() {
    let { _id, real_id, keyword } = this.$router.params;
    this.id = _id;
    this.realId = real_id;
    this.keyword = keyword
    // 找缓存
    const articleCache = getArticleCache(real_id)
    let lastModified = ''
    // 如果有缓存，先显示本地缓存
    if (articleCache) {
      console.log('[article] use cache')
      lastModified = articleCache.last_modified
      this.applyArticleData(articleCache, true)
      updateArticleCacheTime(real_id)
    }
    getArticleById(_id, lastModified)
      .then(articleData => {
        // 缓存未过期时，只返回点赞/点击数
        if (!articleData.html) {
          this.applyArticleData(articleData, false)
        }
        // 缓存过期，或本地无缓存
        else {
          this.applyArticleData(articleData, true)
          setArticleCache(articleData)

          if (lastModified) {
            console.log('[article] update cache')
          } else {
            console.log('[article] add cache')
          }
          // 计算当前缓存大小，判断是否需要清理
          garbageCollect()
        }
      })
      .catch(this.$error);
  }
  componentDidShow() { }
  componentDidHide() { }
  componentDidCatchError() { }

  config = {
    navigationBarTitleText: ""
  };

  // article
  @observable id = ""; // _id
  @observable realId = ""; // real_id
  @observable title = "";
  @observable author = "";
  @observable time = "";
  @observable html = "";
  @observable likeIds = [];
  @observable liked = false; // 是否已赞
  @observable view = 0; // 阅读量
  // comment
  @observable hasLoadComments = false; // 默认不显示评论
  @observable isLoadingComments = false;
  @observable comments = [];
  @observable isModalVisible = false;
  @observable commentInput = "";
  // auth
  @observable isTipVisible = false;

  @computed get commentHeaderText() {
    if (this.isLoadingComments) {
      return '加载中...'
    }
    return this.hasLoadComments ? `评论 (${this.comments.length})` : '显示评论'
  }

  @action applyArticleData(articleData, isFull) {
    const {
      title,
      author,
      timestamp,
      like_id,
      url, // 公众号 url
      view,
      html
      // need update
    } = articleData;
    this.likeIds = like_id;
    this.liked = like_id.includes(this.props.userStore.openId);
    this.view = view;
    if (isFull) {
      this.title = title;
      this.author = author;
      this.html = this.keyword ? this.highlightKeyword(html, this.keyword) : html;
      this.time = formatTime(timestamp);
      Taro.setNavigationBarTitle({ title })
    }
  }
  // 点赞/取消赞
  @action handleToggleLike() {
    toggleLike({
      id: this.id,
      like: !this.liked
    })
      .then(() => {
        this.liked = !this.liked;
        // 更新用户页已赞数据
        this.props.userStore.updateLike({
          id: this.id,
          title: this.title,
          timestamp: this.timestamp,
          realId: this.realId
        }, this.liked)
      })
      .catch(this.$error);
  }
  // 授权 userInfo
  @action handleUserInfo(res) {
    if (res.detail.errMsg === 'getUserInfo:fail auth deny') {
      // 拒绝了就不刷新 authSetting 了
    }
    else {
      // 更新授权状态
      getAuthSetting()
        .then(({ authSetting }) => {
          this.props.userStore.setAuthSetting(authSetting);
        })
        .catch(this.$error)
      // 更新 user 信息
      getAndSaveUserInfo()
        .then(console.log)
        .catch(this.$error)
    }
  }
  // 评论
  @action loadComments() {
    if (this.isLoadingComments || this.hasLoadComments) return
    this.isLoadingComments = true
    this.updateComments(false)
  }
  @action handleOpenForm() {
    if (!this.props.userStore.hasAuth) {
      this.isTipVisible = true
      return
    }
    this.isModalVisible = true;
  }
  @action handleCloseForm() {
    this.isModalVisible = false;
  }
  @action handleInputChange(value) {
    this.commentInput = value
  }
  @action handleSubmitComment() {
    if (this.commentInput === '') {
      return
    }
    // 这里有一个问题
    // 如果用户被封禁，不会请求 getUserData 接口
    // 所以 commentLimit 是初始值 0
    // 评论的时候的提示不是用户被封禁，而是评论次数不足
    if (this.props.userStore.commentLimit <= 0) {
      this.$warn('每天最多可以评论 5 次')
      return
    }
    const data = { realId: this.realId, content: this.commentInput, replyId: '' }
    addComment(data)
      .then(() => {
        this.isModalVisible = false
        this.commentInput = ''
        this.$success('评论成功')
        this.updateComments(true)
      })
      .catch(this.$error)
  }
  // 更新当前文章的/userStore 的评论列表
  @action async updateComments(updateStore) {
    try {
      const articleCommentList = await getArticleComments(this.realId)
      this.comments = articleCommentList
      this.hasLoadComments = true
      if (updateStore) {
        // 找到刚才发表的
        const oldIds = this.props.userStore.commentList.map(e => e.id)
        let newUserComment = null
        for (const comment of articleCommentList) {
          const { id, articleId, realId, content, title, timestamp } = comment
          if (!oldIds.includes(id)) {
            newUserComment = {
              id,
              articleId,
              content,
              timestamp,
              realId,
              title
            }
            break
          }
        }
        // 添加到 userStore，更新 commentLimit
        this.props.userStore.updateComments(newUserComment)
      }
    } catch (err) {
      this.$error(err)
    } finally {
      this.isLoadingComments = false
    }
  }

  highlightKeyword(html, keyword) {
    const reg = new RegExp(keyword, 'g')
    html = html.replace(reg, `<span style="color:red; font-weight: bold">${keyword}</span>`)
    return html
    // 下面是为每个关键词处添加锚点的实现
    // 参考 https://juejin.im/post/5c48307be51d45067235572d
    // 但是貌似 rich-text 不支持锚点定位
    // const arr = html.split(keyword)
    // let resultArr = []
    // arr.forEach((item, index) => {
    //   if (index !== arr.length - 1) {
    //     const id = `anchor-${index}`
    //     this.anchors.push(id)
    //     item += `<span id='${id}' style="color:red; font-weight: bold">${keyword}</span>`
    //     resultArr.push(item)
    //   } else {
    //     resultArr.push(item)
    //   }
    // })
    // return resultArr.join('')
  }

  onShareAppMessage(res) {
    const { from } = res
    // 页面内转发按钮
    if (from === 'button') {
    }
    // 右上角菜单
    else if (from === 'menu') {
    }
    let { path, params } = this.$router;
    const { _id, real_id } = params
    return {
      title: this.title,
      path: `${path}?_id=${_id}&real_id=${real_id}`,
      // imageUrl: ''
    }
  }

  render() {
    const hasAuth = this.props.userStore.hasAuth
    return (
      <View className='page-article'>
        <AtMessage />

        <View className='at-article'>
          <View className='at-article__h2'>{this.title}</View>
          {/* info */}
          <View className='at-article__info'>
            {this.author} {this.time}
            <View className='at-article__info__action'
              onClick={this.handleToggleLike.bind(this)}
            >
              <AtIcon
                className='at-article__info__action__icon'
                value={this.liked ? "heart-2" : "heart"}
                size='18'
                color='rgb(7,193,96)'
              ></AtIcon>
              <Text style=''>
                {this.liked ? "已赞" : "点赞"}
              </Text>
            </View>
            <View className='at-article__info__action'>
              <AtIcon
                className='at-article__info__action__icon'
                value='eye'
                size='18'
                color='rgb(7,193,96)'
              ></AtIcon>
              <Text>
                {this.view}
              </Text>
            </View>
          </View>
          {/* content */}
          <View className='at-article__content'>
            <View className='at-article__section'>
              <RichText nodes={this.html} style='word-wrap:break-word;word-break:break-all;'></RichText>
            </View>
          </View>
        </View>
        <View className='split'></View>


        {/* comments */}
        <View className='comments'>
          <View className='comments__header'>
            <Text onClick={this.loadComments.bind(this)} className={`${this.hasLoadComments || this.isLoadingComments ? '' : 'text_link'}`}>{this.commentHeaderText}</Text>
            {
              hasAuth ?
                <Text
                  className='comments__add text_link'
                  onClick={this.handleOpenForm.bind(this)}
                >
                  发表评论
                  </Text>
                : <Button
                  className='comments__add button_text text_link'
                  openType='getUserInfo'
                  onGetUserInfo={this.handleUserInfo.bind(this)}
                >点击登录</Button>
            }
          </View>
          {this.hasLoadComments && this.comments.length === 0 ? (
            <View className='comments_empty'>暂无评论</View>
          ) : (
              this.comments.map(item => (
                <View className='comments__item' key={item.ID}>
                  <View className='comment__info'>
                    <Text className='comment__info__user'>{item.nickName}</Text>
                    <Text className='comment__info__time'>{formatTime(item.timestamp)}</Text>
                  </View>
                  <View className='comment__content'>{item.content}</View>
                </View>
              ))
            )}
        </View>

        {/* 评论 */}
        <AtFloatLayout
          isOpened={this.isModalVisible}
          onClose={this.handleCloseForm.bind(this)}
        >
          {/* https://github.com/NervJS/taro-ui/issues/75 */}
          {this.isModalVisible && <AtTextarea placeholder='write something' value={this.commentInput} onChange={this.handleInputChange.bind(this)}></AtTextarea>}
          <Button onClick={this.handleSubmitComment.bind(this)}>提交</Button>
        </AtFloatLayout>
      </View>
    );
  }
}
