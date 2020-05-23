import dayjs from "dayjs";

// 2.3.0 开始支持以 cloudId 作为 image src，但是，傻逼
// https://developers.weixin.qq.com/community/develop/doc/000208079d83e8b8236adfef35b000
export function genCloudFileURL(cloudId) {
  // N4/N10/CLOUD_ENV 定义在 /config
  const splitter = `cloud://${CLOUD_ENV}.${N4}-${CLOUD_ENV}-${N10}/`;
  const filePath = cloudId.split(splitter)[1];
  return encodeURI(
    `https://${N4}-${CLOUD_ENV}-${N10}.tcb.qcloud.la/${filePath}`
  );
}

export function formatTime(t, dropSecond) {
  const format = dropSecond ? "YYYY-MM-DD HH:mm" : "YYYY-MM-DD HH:mm:ss"
  return dayjs(t).format(format);
}