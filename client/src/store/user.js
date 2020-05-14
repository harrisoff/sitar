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
}

export default new UserStore();
