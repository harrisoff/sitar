import { observable, computed, action } from "mobx";

class UserStore {
  // @observable unionId = "";
  @observable openId = "";
  @observable banned = false;
  @observable commentList = [];
  @observable likeList = [];
  @observable commentLimit = 0;
  @observable authSetting = {};

  @computed get hasAuth() {
    return this.authSetting['scope.userInfo']
  }

  @action setAuthSetting(authSetting) {
    this.authSetting = authSetting;
  }
  @action setUserData(data) {
    const { openId, commentList, likeList, commentLimit, banned } = data;
    this.openId = openId;
    this.commentList = commentList;
    this.likeList = likeList;
    this.commentLimit = commentLimit;
    this.banned = banned;
  }
  @action updateComments(comment) {
    // 时间降序排列
    this.commentList.unshift(comment)
    this.commentLimit -= 1
  }
  @action updateLike(article, like) {
    if (like) {
      this.likeList.push(article)
    } else {
      for (let i = 0; i < this.likeList.length; i += 1) {
        if (this.likeList[i].id === article.id) {
          this.likeList.splice(i, 1)
          break
        }
      }
    }
  }
}

export default new UserStore();
