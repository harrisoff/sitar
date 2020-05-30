# SITAR

![](https://github.com/harrisoff/sitar/workflows/build/badge.svg)

## TODO

- [ ] 修改 login 接口，告诉前端是否新用户
- [ ] 公众号组件，第一次进入的用户才显示

### 有空再搞

- [ ] 小程序后台设置最低基础库版本（设置-基本信息-功能设置
- [ ] 分解 getMenuData 接口，那缓存逻辑也要改一下
- [ ] 如果从分享的文章页面进入
   - [ ] 数据加载是怎么个情况？
   - [ ] 用户封禁好像也会失效
- [ ] 目录页每篇文章右侧添加一个 info 键点击显示 digest 和 thumb，需要替换 List 组件
- [ ] eslint
- [ ] 目录的数据可以提前请求，但是注意不能写在 /index 里
- [ ] 删除评论功能
- [ ] assets 上传到 cdn
- [ ] AppServiceSdkKnownError/APP-SERVICE-SDK:setStorageSync:fail write DB data fail，要改异步的话太麻烦了
   - https://developers.weixin.qq.com/community/develop/doc/000a8cd25f4240c4b428957d254c00
   - https://developers.weixin.qq.com/community/develop/doc/0006cceda9419843871afff7353400

### 搞不定

- [ ] 小程序不支持链接
- [ ] 路由拦截器，貌似不能实现类似 vue-router 的导航守卫功能

### 完成

- [x] 小程序每页的标题
- [x] get()/end() 时只获取 show 为 true 的
- [x] 继承 Base 组件
- [x] user 页授权后没有刷新页面
- [x] 提示 error
- [x] 封禁用户处理
- [x] 评论发送后更新 userStore 的 commentList
- [x] 首页 cache 加载晚于 index 页读取
- [x] login 接口拆分
- [x] 检查一下时间
- [x] sitemap.json
- [x] 整理类名，要不就别用 BEM 了。。
- [x] 搜索功能
- [x] 搜索无结果提示
- [x] 默认不显示评论，点击后加载
- [x] 【需要后台重新同步】文章页有图片宽度超出屏幕的情况，setAttribute
- [x] 发出评论后，用户页的评论记录数据更新错误
- [x] loading 动画 && 防止重复触发请求
- [x] 文章页中，未登录时评论区有一个文本编辑框
- [x] 点赞/取消赞后更新用户页数据
- [x] 搜索打开文章页时关键词高亮
- [x] 目录页添加标签，显示非书籍类的文章
- [x] 目录列表显示换行显示
- [x] 缓存过期更新逻辑有问题
- [x] 文章内容保存到 localStorage
   - [x] 可能需要搭配 LRU 算法，并为每篇文章添加 last_modified 字段
   - [x] sort() 好像错了
   - [x] 手动删除缓存功能
- [x] 目录排序有问题
- [x] 封禁用户清空本地缓存
- [x] 随机文章/图片接口限制调用次数
- [x] 随机歌曲
- [x] request 并未覆盖所有请求，还有一些是微信 API
- [x] 日志上报功能
- [x] 随机歌曲添加次数限制
- [x] 歌曲上传到七牛云，不需要 API，直接用七牛云后台
- [x] 分享设置图片
- [x] beatles 风格 UI
- [x] 时区，貌似没问题
- [x] 滑动删除的交互
- [x] 云函数补充索引
- [x] 目录页样式
- [x] 全面屏适配
- [x] 分享打开文章页时，添加一个进入首页的入口 - 小程序自带
- [x] 评论输入框边框颜色
- [x] 日志重复上传
- [x] setStorage 增加异常捕捉
- [x] 缓存页增加说明
- [x] 基准颜色，taro-ui 的蓝色
- [x] 目录改为抽屉
- [x] 组件的变量根据用途分类而不是类型
- [x] 持续集成，参考 https://juejin.im/post/5ec527dff265da770a61520d
- [x] 内容安全
   - [x] API 文档 https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/sec-check/security.msgSecCheck.html
   - [x] 后台【用户生成内容场景信息安全声明】（设置-基本设置-用户生成内容场景信息安全声明
- [x] getVersion
- [x] 目录按时间正序
- [x] 分解 getUserData 接口
- [x] 云函数环境变量
- [x] 压缩云函数代码，生产环境根据环境变量自动使用压缩后的
- [x] getUserData 接口需要返回可评论次数
- [x] 区分开发环境和生产环境
- [x] store 变量分类
- [x] 活动页面
- [x] 关于页面
- [x] 通知功能
   - [x] 基础功能
   - [x] 在用户页添加一个入口，没必要，算了

## NOTES

1. 当一个 fixed 在底部的 view 中套一个 input 的时候，input focus 时软键盘弹出，会覆盖 input 下方的部分，除非显式设置了 input 的 margin-bottom。

## DEPLOY

### 数据库

1. 建表
2. 建索引
3. 后台添加数据

### 云函数

1. 创建
2. 环境变量
3. 上传前压缩

### CDN

1. 上传文件
2. 修改云函数 cdn 前缀