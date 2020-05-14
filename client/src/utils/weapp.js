import dayjs from "dayjs";
import { ENV } from "../config";

const { CLOUD_ENV, N4, N10 } = ENV;

// 2.3.0 开始支持以 cloudId 作为 image src
// 保险起见还是转成 url 好了
export function genFileURL(fileId) {
  const splitter = `cloud://${CLOUD_ENV}.${N4}-${CLOUD_ENV}-${N10}/`;
  const filePath = fileId.split(splitter)[1];
  return encodeURI(
    `https://${N4}-${CLOUD_ENV}-${N10}.tcb.qcloud.la/${filePath}`
  );
}

export function formatTime(t) {
  return dayjs(t).format("YYYY-MM-DD HH:mm:ss");
}