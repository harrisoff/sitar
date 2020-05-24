import Taro from "@tarojs/taro";
import { observer, inject } from "@tarojs/mobx";
import { View } from "@tarojs/components";
import { AtMessage } from "taro-ui";

import BaseComponent from "../../components/Base.jsx";

import "./index.less";

@observer
export default class Index extends BaseComponent {
  componentWillMount() {}
  componentDidMount() {}
  componentDidShow() {}
  componentDidHide() {}
  componentDidCatchError() {}

  config = {
    navigationBarTitleText: "活动"
  };

  render() {
    return (
      <View className='page-activity'>
        <AtMessage />
      </View>
    );
  }
}
