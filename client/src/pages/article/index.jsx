import Taro from "@tarojs/taro";
import { View, Text, RichText, Button } from "@tarojs/components";
import { observer, inject } from "@tarojs/mobx";
import { AtIcon, AtFloatLayout, AtTextarea, AtMessage } from "taro-ui";
import { observable, computed, action } from "mobx";

import { getArticleById, toggleLike, addComment, getArticleComments } from "../../api";
import { getAuthSetting, getAndSaveUserInfo } from '../../api/auth'
import { formatTime } from "../../utils/weapp";

import BaseComponent from '../../components/Base.jsx'

import "./index.less";

@inject("cacheStore", "userStore")
@observer
export default class Index extends BaseComponent {
  componentWillMount() { }
  componentDidMount() {
    let { _id, real_id } = this.$router.params;
    this.id = _id;
    this.realId = real_id;
    getArticleById(_id)
      .then(articleData => {
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
        this.title = title;
        this.author = author;
        this.html = html;
        this.time = formatTime(timestamp);
        this.likeIds = like_id;
        this.liked = like_id.includes(this.props.userStore.openId);
        this.view = view;
        Taro.setNavigationBarTitle({ title })
      })
      .catch(({ errMsg }) => {
        this.$error(errMsg);
      });
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
  @observable comments = [];
  @observable isModalVisible = false;
  @observable commentInput = "";
  // auth
  @observable isTipVisible = false;

  @computed get commentHeaderText() {
    return this.hasLoadComments ? `评论 (${this.comments.length})` : '显示评论'
  }

  // 点赞/取消赞
  @action handleToggleLike() {
    toggleLike({
      id: this.id,
      like: !this.liked
    })
      .then(() => {
        this.liked = !this.liked;
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
    if (this.hasLoadComments) return
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
    this.hasLoadComments = true
    try {
      const articleCommentList = await getArticleComments(this.realId)
      this.comments = articleCommentList
      if (updateStore) {
        // 找到刚才发表的
        const oldIds = this.props.userStore.commentList.map(e => e.id)
        let newUserComment = null
        for (const comment of articleCommentList) {
          const { id, articleId, realId, content, title, timestamp } = comment
          comment.time = formatTime(timestamp)
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
        // 添加到 userStore
        this.props.userStore.updateComments(newUserComment)
        // 更新 commentLimit
      }
    } catch (err) {
      this.$error(err)
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
        {/* info */}
        <View className='title'>{this.title}</View>
        <View className='info'>
          {this.author} {this.time}
          <Text style='float:right;margin-right:40rpx'>
            {this.liked ? "已赞" : "点赞"}
          </Text>
          <AtIcon
            className='info__liked'
            onClick={this.handleToggleLike.bind(this)}
            value={this.liked ? "heart-2" : "heart"}
            size='18'
            color='rgb(7,193,96)'
          ></AtIcon>
          <Text
            className='info__liked'
          >
            {this.view}
          </Text>
          <AtIcon
            className='info__liked'
            value='eye'
            size='18'
            color='rgb(7,193,96)'
          ></AtIcon>
        </View>

        {/* content */}
        <View className='content'>
          <RichText nodes={this.html} style='word-wrap:break-word;word-break:break-all;'></RichText>
        </View>
        <View className='split'></View>

        {/* comments */}
        <View className='comments'>
          <View className='comments__header'>
            <Text onClick={this.loadComments.bind(this)} className={`${this.hasLoadComments ? '' : 'text_link'}`}>{this.commentHeaderText}</Text>
            {
              hasAuth ?
                <Text
                  className='comments__add text_link'
                  onClick={this.handleOpenForm.bind(this)}
                >
                  发表评论
                  </Text>
                : <Button
                  className='button_text text_link'
                  openType='getUserInfo'
                  onGetUserInfo={this.handleUserInfo.bind(this)}
                >登录后可评论</Button>
            }
          </View>
          {this.hasLoadComments && this.comments.length === 0 ? (
            <View className='comments_empty'>暂无评论</View>
          ) : (
              this.comments.map(item => (
                <View className='comments__item' key={item.ID}>
                  <View className='comment__info'>
                    <Text className='comment__info__user'>{item.nickName}</Text>
                    <Text className='comment__info__time'>{item.time}</Text>
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
          <AtTextarea value={this.commentInput} onChange={this.handleInputChange.bind(this)}></AtTextarea>
          <Button onClick={this.handleSubmitComment.bind(this)}>提交</Button>
        </AtFloatLayout>
      </View>
    );
  }
}
