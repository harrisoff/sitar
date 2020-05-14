import Taro from "@tarojs/taro";
import { Provider } from "@tarojs/mobx";

import "taro-ui/dist/style/index.scss";
import "taro-ui/dist/style/components/icon.scss";
import "taro-ui/dist/style/components/button.scss"
import "taro-ui/dist/style/components/message.scss";

import store from "./store";

import Index from "./pages/index";
import { login, getAuthSetting, getUserData } from "./api/auth";
import { getVersion } from "./api";
import {
  getDirtyCache,
  getBooksCache,
  getHomepageCache,
  getVersionCache,
  setVersionCache,
  setDirtyCache,
  setBanned
} from "./utils/cache";
import { MESSAGES } from './constants/message'

import BaseComponent from './components/Base.jsx'

import './styles/shared.less'
import "./app.less";

// 如果需要在 h5 环境中开启 React Devtools
// 取消以下注释：
// if (process.env.NODE_ENV !== 'production' && process.env.TARO_ENV === 'h5')  {
//   require('nerv-devtools')
// }

class App extends BaseComponent {
  componentWillMount() {
    // 这里 async/await 无效
  }
  async componentDidMount() {
    if (process.env.TARO_ENV === "weapp") {
      Taro.cloud.init();
    }

    const { cacheStore, userStore } = store;
    // init dirty list
    const dirty = getDirtyCache();
    Object.keys(dirty).forEach(key => {
      if (dirty[key]) cacheStore.setDirty(key);
      else cacheStore.setClean(key);
    });
    // init homepage/menu data
    cacheStore.setHomepageData(getHomepageCache());
    cacheStore.setBooksData(getBooksCache());
    cacheStore.setVersion(getVersionCache());

    // await 不能阻塞子组件的渲染
    // 所以那些需要在子组件渲染前执行的同步代码
    // 需要写在 await 前面
    try {
      const { authSetting } = await getAuthSetting();
      userStore.setAuthSetting(authSetting);

      if (userStore.hasAuth) {
        // TODO: 这里应该干啥
        const res = await Taro.getUserInfo();
      }
      else {
        // 没授权过 undefined，或拒绝 false
      }

      const { params } = this.$router
      const banned = await login(params);
      setBanned(banned)
      if (banned) throw MESSAGES.BANNED

      getUserData()
        .then(userData => {
          console.log(userData)
          userStore.setUserData(userData)
        })
        .catch(this.$error)

      // get version api
      getVersion()
        .then(newVersion => {
          if (newVersion !== cacheStore.version) {
            console.log("find new version");
            cacheStore.setVersion(newVersion);
            setVersionCache(newVersion);
            cacheStore.setDirty("homepage", "books");
            setDirtyCache("homepage", "books");
          }
        })
        .catch(err => {
          this.$error(err);
          // 请求失败时认为需要刷新数据
          const t = new Date().getTime();
          cacheStore.setVersion(t);
          setVersionCache(t);
          cacheStore.setDirty("homepage", "books");
          setDirtyCache("homepage", "books");
        });
    } catch (err) {
      this.$error(err);
    }
  }
  componentWillUnmount() { }
  componentDidShow() { }
  componentDidHide() { }
  componentDidCatchError() { }

  config = {
    pages: [
      "pages/index/index",
      "pages/menu/index",
      "pages/user/index",
      "pages/user/like/index",
      "pages/user/comment/index",
      "pages/article/index",
      "pages/about/index",
      "pages/search/index",
    ],
    tabBar: {
      list: [
        {
          pagePath: "pages/index/index",
          text: "首页",
          iconPath: "assets/images/home-normal.png",
          selectedIconPath: "assets/images/home-selected.png"
        },
        {
          pagePath: "pages/menu/index",
          text: "目录",
          iconPath: "assets/images/menu-normal.png",
          selectedIconPath: "assets/images/menu-selected.png"
        },
        {
          pagePath: "pages/user/index",
          text: "我的",
          iconPath: "assets/images/user-normal.png",
          selectedIconPath: "assets/images/user-selected.png"
        }
      ]
    },
    window: {
      backgroundTextStyle: "light",
      navigationBarBackgroundColor: "#fff",
      navigationBarTitleText: "WeChat",
      navigationBarTextStyle: "black"
    },
    usingComponents: {}
  };

  // 在 App 类中的 render() 函数没有实际作用
  // 请勿修改此函数
  render() {
    return (
      <Provider store={store}>
        <Index />
      </Provider>
    );
  }
}

Taro.render(<App />, document.getElementById("app"));