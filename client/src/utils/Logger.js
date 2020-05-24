import { uploadLogs } from '../api'

class Logger {
  constructor() {
    this._logs = []
    this._isUploading = false
    this._maxLen = 20
    this._timer = null
    this._delay = 3000
  }

  // private methods

  // 超过一定长度自动上传一波
  _judge() {
    console.log(this._logs)
    if (this._logs.length >= this._maxLen) {
      this._upload()
    }
  }
  _upload() {
    if (this._isUploading || this._timer || !this._logs.length) return
    // 记录回滚位置
    const currentLen = this._logs.length
    this._isUploading = true
    uploadLogs(this._logs)
      .then(_ => {
        // 上传成功后删除
        this._logs = this._logs.splice(0, currentLen)
      })
      .catch(err => {
        console.error(err)
        // 如果上传失败，暂时阻止上传
        // _delay 后恢复
        this._timer = setTimeout(() => {
          this._timer = null
        }, this._delay);
        this.addError('logger', err)
      })
      .then(_ => {
        this._isUploading = false
      })
  }
  _add(level, type, subType, data = {}) {
    this._logs.push({
      level,
      type,
      sub_type: subType,
      data,
      timestamp: new Date().getTime()
    })
    this._judge()
  }

  // public methods

  debug(type, subType, data) {
    this._add('debug', type, subType, data)
  }
  log(type, subType, data) {
    this._add('log', type, subType, data)
  }
  error(type, subType, data) {
    this._add('error', type, subType, data)
  }
  // 上传
  upload() {
    // 主动触发上传时，不受 _timer 影响
    this._timer = null
    this._upload()
  }
}

export default new Logger()