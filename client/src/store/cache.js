import { observable, action } from "mobx";

class CacheStore {
  @observable homepageData = {
    carousel: [],
    list: [],
    top: []
  };
  @observable booksData = [];
  @observable bookletsData = [];
  @observable othersData = [];
  @observable version = 0;
  @observable dirty = {
    menu: false,
    homepage: false
  };

  // 非严格模式下，不加 @action 也可以
  @action setHomepageData(data) {
    this.homepageData = data;
  }
  @action setMenuData({ books, booklets, others }) {
    this.booksData = books;
    this.bookletsData = booklets
    this.othersData = others
  }
  // 只有 version 变化时
  @action setVersion(version) {
    this.version = version;
  }
  // dirty/clean
  @action setDirty(...keys) {
    keys.forEach(key => (this.dirty[key] = true));
  }
  @action setClean(keys) {
    if (!Array.isArray(keys)) keys = [keys];
    keys.forEach(key => (this.dirty[key] = false));
  }
}

export default new CacheStore();
