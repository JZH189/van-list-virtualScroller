import { ref } from "vue";
import { IVListProps, IlistData, RequestRes } from "../interface";

export default function (
  listData: IlistData,
  props: IVListProps,
  updateRender: Function
) {
  const showNoList = ref(false);
  //pull-refresh是否处于加载中状态
  const refreshing = ref(false);
  //判断是否应该开启虚拟滚动
  function autoStartVirtaulScroll(listLength: number): void {
    //超过指定list数量自动开启虚拟滚动
    if (listLength >= (props as any).vscrollCount) {
      listData.isVirtaulScroll = true;
    } else {
      listData.isVirtaulScroll = false;
    }
  }
  //list加载的方法
  async function onLoad(): Promise<void> {
    try {
      if (typeof props.requestFunc === "function") {
        //每次请求后手动重置loading
        listData.loading = true;
        const result: RequestRes = await props.requestFunc();
        //每次请求后手动重置loading
        listData.loading = false;
        //请求过后自动更新页码
        listData.current++;
        //保存数据
        listData.records.push(...result.rows);
        //如果超过total证明所有数据加载完成
        if (listData.records.length >= result.total) {
          listData.finished = true;
        }
        listData.records.length
          ? (showNoList.value = false)
          : (showNoList.value = true);
        //自动开启虚拟滚动
        autoStartVirtaulScroll(listData.records.length);
        updateRender();
      }
    } catch (error) {
      listData.loading = false;
      listData.error = true;
      console.log("error: ", error);
    }
  }
  //触发刷新的方法
  async function onRefresh(): Promise<void> {
    //刷新需要重新初始化数据
    refreshing.value = true;
    listData.finished = false;
    listData.error = false;
    listData.current = 1;
    listData.records = [];
    await onLoad();
    refreshing.value = false;
  }
  //重置数据状态
  async function resetList(): Promise<void> {
    listData.finished = false;
    listData.error = false;
    listData.current = 1;
    listData.records = [];
    await onLoad();
  }
  return {
    refreshing,
    showNoList,
    onLoad,
    onRefresh,
    resetList,
  };
}
