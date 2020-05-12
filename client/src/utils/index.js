export function genUrl(url, params) {
  if (Object.keys(params).length === 0) return url
  url += '?'
  Object.keys(params).forEach(key => {
    url += key + '=' + params[key] + '&'
  })
  return url.substr(0, url.length - 1)
}