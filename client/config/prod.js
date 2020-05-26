module.exports = {
  env: {
    NODE_ENV: '"production"'
  },
  defineConstants: {
    N4: 7369,
    CLOUD_ENV: 'sitar-prod',
    CLOUD_FN: 'prod'
  },
  mini: {},
  uglify: {
    enable: true,
    config: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  h5: {
    /**
     * 如果h5端编译后体积过大，可以使用webpack-bundle-analyzer插件对打包体积进行分析。
     * 参考代码如下：
     * webpackChain (chain) {
     *   chain.plugin('analyzer')
     *     .use(require('webpack-bundle-analyzer').BundleAnalyzerPlugin, [])
     * }
     */
  }
}
