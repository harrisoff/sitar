# SITAR

## TODO

- [ ] 随机歌曲添加次数限制
- [ ] 持续集成，参考 https://juejin.im/post/5ec527dff265da770a61520d
- [ ] 封装日志类，onHide 触发时一次性上传日志
- [ ] 分享设置图片
- [ ] 目录的数据可以提前请求，但是注意不能写在 /index 里
- [ ] 小程序内关注公众号
- [ ] getMenuData 接口好像有点慢

### 有空再搞

- [ ] 如果从分享的文章页面进入
   - [ ] 数据加载是怎么个情况？
   - [ ] 用户封禁好像也会失效
- [ ] 打开评论 modal 时 autofocus
- [ ] 基准颜色
- [ ] 用户页里，赞过的和评论过的分开
- [ ] 时区
- [ ] 目录页每篇文章右侧添加一个 info 键点击显示 digest 和 thumb，需要替换 List 组件

### 搞不定

- [ ] 小程序不支持链接

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