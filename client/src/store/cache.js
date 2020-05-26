import { observable, action } from "mobx";

class CacheStore {
  @observable homepageData = {
    carousel: [],
    list: [],
    top: []
  };
  // 非严格模式下，不加 @action 也可以
  @action setHomepageData(data) {
    this.homepageData = data;
  }

  @observable booksData = [];
  @observable bookletsData = [];
  @observable othersData = [];
  @action setMenuData({ books, booklets, others }) {
    this.booksData = books;
    this.bookletsData = booklets;
    this.othersData = others;
  }

  @observable version = 0;
  // 只有 version 变化时
  @action setVersion(version) {
    this.version = version;
  }
  
  @observable dirty = {
    menu: false,
    homepage: false
  };
  // dirty/clean
  @action setDirty(...keys) {
    keys.forEach(key => (this.dirty[key] = true));
  }
  @action setClean(keys) {
    if (!Array.isArray(keys)) keys = [keys];
    keys.forEach(key => (this.dirty[key] = false));
  }

  // 封禁用户删除数据
  @action deleteBannedData() {
    this.homepageData.carousel = [];
    this.homepageData.list = [];
    this.homepageData.top = [];
    this.booksData = [];
    this.bookletsData = [];
    this.othersData = [];
  }
}

export default new CacheStore();
