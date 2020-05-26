import { observable, computed, action } from "mobx";

class UserStore {
  // 小程序和公众号关联之后就有 unionId 了
  // @observable unionId = "";
  @observable openId = "";
  @observable banned = false;
  @observable commentLimit = 0;
  @action setUserData(data) {
    const { openId, banned, notice, commentLimit } = data;
    this.openId = openId;
    this.banned = banned;
    this.commentLimit = commentLimit;
    if (notice) this.notice = notice
  }
  
  @observable commentList = [];
  @observable hasCommentList = false;
  @observable likeList = [];
  @observable hasLikeList = false;
  @action setUserLike(data) {
    this.likeList = data
    this.hasLikeList = true
  }
  @action setUserComment(data) {
    this.commentList = data;
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
  
  @observable notice = null;
  // 通知已读
  @action deleteNotice() {
    this.notice = null
  }

  @observable authSetting = {};
  @computed get hasAuth() {
    return this.authSetting["scope.userInfo"];
  }
  @action setAuthSetting(authSetting) {
    this.authSetting = authSetting;
  }
}

export default new UserStore();
