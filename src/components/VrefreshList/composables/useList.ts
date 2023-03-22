import { ref, reactive } from "vue";
import { IVListProps, IlistData, RequestRes } from "../interface";

export default function (props: IVListProps, updateRender: Function) {
  const showNoList = ref(false);
  //pull-refresh是否处于加载中状态
  const refreshing = ref(false);
  //定义数据
  const listData: IlistData = reactive({
    renderedRecords: [], //已经显示在可视区的数据
    records: [], //已经保存的list总条数
    finished: false, //数据是否加载完
    loading: false, //list是否正在加载
    error: false, //设置为true，可以点击错误提示继续触发onload
    total: 0, //总条数
    current: 1, //默认展示第一页
    size: 50, //每页50条
    isVirtaulScroll: false,
    contentHeight: 0, //list容器的高度
    totalHeight: 0,
    translateY: 0,
    pageCount: 0,
    scrollToBottom: 0,
  });
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
    listData,
    onLoad,
    onRefresh,
    resetList,
  };
}
