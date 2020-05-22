// 获取字符串占空间大小
export function getUtf8StringKb(str, fix = 2) {
  return (getUtf8StringBytes(str) / 1024).toFixed(fix);
}

// https://gist.github.com/lovasoa/11357947
// 小程序不支持 Blob，不然可以用 https://stackoverflow.com/a/52254083
export function getUtf8StringBytes(str) {
  // returns the byte length of an utf8 string
  let s = str.length;
  for (let i = str.length - 1; i >= 0; i--) {
    const code = str.charCodeAt(i);
    if (code > 0x7f && code <= 0x7ff) s++;
    else if (code > 0x7ff && code <= 0xffff) s += 2;
    if (code >= 0xdc00 && code <= 0xdfff) i--; // trail surrogate
  }
  return s
}