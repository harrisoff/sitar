import { observable, computed, action } from "mobx";

class UserStore {
  // @observable unionId = "";
  @observable openId = "";
  @observable banned = false;
  
  @observable commentList = [];
  @observable commentLimit = 0;
  @observable hasCommentList = false;

  @observable likeList = [];
  @observable hasLikeList = false;

  @observable authSetting = {};
  
  @observable notice = null;

  @computed get hasAuth() {
    return this.authSetting["scope.userInfo"];
  }

  @action setAuthSetting(authSetting) {
    this.authSetting = authSetting;
  }
  @action setUserData(data) {
    const { openId, banned, notice } = data;
    this.openId = openId;
    this.banned = banned;
    if (notice) this.notice = notice
  }
  @action setUserLike(data) {
    this.likeList = data
    this.hasLikeList = true
  }
  @action setUserComment(data) {
    const { commentList, commentLimit } = data
    this.commentList = commentList;
    this.commentLimit = commentLimit;
    this.hasCommentList = true;
  }
  @action updateComments(comment) {
    // 时间降序排列
    this.commentList.unshift(comment);
    this.commentLimit -= 1;
  }
  @action updateLike(article, like) {
    if (like) {
      this.likeList.push(article);
    } else {
      for (let i = 0; i < this.likeList.length; i += 1) {
        if (this.likeList[i].id === article.id) {
          this.likeList.splice(i, 1);
          break;
        }
      }
    }
  }
  // 封禁用户删除数据
  @action deleteBannedData() {
    this.commentList = [];
    this.likeList = [];
  }
  // 通知已读
  @action deleteNotice() {
    this.notice = null
  }
}

export default new UserStore();
