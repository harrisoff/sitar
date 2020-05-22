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
  getCacheStatus,
  getMenuCache,
  getHomepageCache,
  getVersionCache,
  setVersionCache,
  setDirtyCache,
  setBanned,
  deleteBannedCache
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
    Taro.cloud.init();

    const { cacheStore, userStore } = store;

    // 使用 local storage 初始化 store 数据
    // 1. 缓存状态
    console.log('[store] init cache status')
    const cacheStatus = getCacheStatus();
    Object.keys(cacheStatus).forEach(key => {
      if (cacheStatus[key]) cacheStore.setDirty(key);
      else cacheStore.setClean(key);
    });
    // 2. 首页/目录页数据
    console.log('[store] init homepage/menu data')
    cacheStore.setHomepageData(getHomepageCache());
    cacheStore.setMenuData(getMenuCache());
    // 3. 版本号
    console.log('[store] init version')
    cacheStore.setVersion(getVersionCache());

    // await 不能阻塞子组件的渲染
    // 所以那些需要在子组件渲染前执行的同步代码
    // 需要写在 await 前面
    try {
      const authSetting = await getAuthSetting();
      userStore.setAuthSetting(authSetting);

      if (userStore.hasAuth) {
        // TODO: 这里应该干啥
        // const res = await Taro.getUserInfo();
      }
      else {
        // 没授权过 undefined，或拒绝 false
      }

      const { params } = this.$router
      // FIXME: 这里不会阻塞首页渲染
      // 当用户解封时，login 和 getHomepageData 基本同时发送
      // 后者会因为 localStorage 的 banned 仍然为 true 而请求失败
      const banned = await login(params);
      this.log('user', 'login', { authSetting, params, systemInfo: Taro.getSystemInfoSync() })
      setBanned(banned)
      if (banned) {
        deleteBannedCache()
        cacheStore.deleteBannedData()
        userStore.deleteBannedData()
        throw MESSAGES.BANNED
      }

      getUserData()
        .then(userData => {
          console.log(userData)
          userStore.setUserData(userData)
        })
        .catch(this.$error)

      // get version api
      getVersion()
        .then(newVersion => {
          const oldVersion = cacheStore.version
          if (newVersion !== oldVersion) {
            // TODO: 这里依赖子组件的 observe
            // 但是如果 version 变化时子组件尚未挂载 observe
            // 就会导致无法重新请求数据
            // 比如从一个非首页/目录页的分享页面打开时？？
            console.log("find new version");
            cacheStore.setVersion(newVersion);
            setVersionCache(newVersion);
            // 初次进入 oldVersion === 0
            // 避免子组件请求成功后又被这里设置成 dirty
            if (!oldVersion) {
              console.log("no local version");
            } else {
              cacheStore.setDirty("homepage", "menu");
              setDirtyCache("homepage", "menu");
            }
          }
        })
        .catch(err => {
          this.$error(err);
          // 请求失败时认为需要刷新数据
          const t = new Date().getTime();
          cacheStore.setVersion(t);
          setVersionCache(t);
          cacheStore.setDirty("homepage", "menu");
          setDirtyCache("homepage", "menu");
        });
    } catch (err) {
      this.$error(err);
    }
  }
  componentWillUnmount() { }
  componentDidShow() {
    console.log('[app] did show')
  }
  componentDidHide() {
    this.logger.upload()
    console.log('[app] did hide')
  }
  componentDidCatchError() { }

  config = {
    pages: [
      "pages/index/index",
      "pages/menu/index",
      "pages/user/index",
      "pages/user/like/index",
      "pages/user/comment/index",
      "pages/article/index",
      "pages/cache/index",
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
    requiredBackgroundModes: ['audio'],
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
