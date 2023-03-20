import { useSlots, ref, computed, watch } from "vue";
import { IVListProps, IlistData } from "../interface";
import { showToast } from "vant";
//获取分页的total
function getListTotal(result: Object, path: string[], field = "total"): number {
  let res = 0;
  if (path.length === 1) {
    //@ts-ignore
    return (res = result[field]);
  }
  let obj = result;
  for (let index in path) {
    //@ts-ignore
    obj = obj[path[index]];
    //@ts-ignore
    if (obj?.[field]) {
      //@ts-ignore
      res = obj[field];
    }
  }
  return res;
}
//获取分页的list
function getListData(result: Object, path: string[]): any[] {
  let res: any[];
  if (path.length === 1) {
    //@ts-ignore
    return (res = result[path[0]]);
  }
  let obj = result;
  for (let index in path) {
    //@ts-ignore
    obj = obj[path[index]];
  }
  //@ts-ignore
  return (res = obj);
}
export default function (
  listData: IlistData,
  props: IVListProps,
  updateRender: Function
) {
  const userSlots = useSlots();
  //最终被呈现的slots
  const renderSlots = computed(() => (userSlots as any).default());
  //强制刷新slots
  const key = ref(0);
  watch(renderSlots, () => (key.value += 1));
  //传递插槽
  const UserSlots = () => [renderSlots.value];
  const showNoList = ref(false);
  //pull-refresh是否处于加载中状态
  const refreshing = ref(false);
  //onLoad获取请求参数
  const pageParams = computed(() => ({
    current: listData.current,
    param: {
      ...props.requestParam,
    },
    size: listData.size,
  }));
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
      if (typeof listData.requestFunc === "function") {
        //每次请求后手动重置loading
        listData.loading = true;
        const { code, message, result } = await listData.requestFunc(
          pageParams.value
        );
        //每次请求后手动重置loading
        listData.loading = false;
        //请求过后自动更新页码
        listData.current++;
        if (code === "0") {
          //请求成功的处理
          const path = props.listField.split("."); //page.records => ['page', 'records']
          //将命名空间分割成数组格式进行对象属性操作得到最终的数据
          const dataList = getListData(result, path);
          const total = getListTotal(result, path, "total");
          listData.records.push(...dataList);
          //如果超过总条数证明所有数据加载完成
          if (listData.records.length >= total) {
            listData.finished = true;
          }
          listData.records.length
            ? (showNoList.value = false)
            : (showNoList.value = true);
        } else {
          listData.error = true;
          //请求失败的处理
          showToast(`请求出错，${message}`);
        }
        //自动开启虚拟滚动
        autoStartVirtaulScroll(listData.records.length);
        updateRender();
      }
    } catch (error) {
      //加载失败了可以点击错误提示重新加载
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
    UserSlots,
    key,
    refreshing,
    showNoList,
    onLoad,
    onRefresh,
    resetList,
  };
}
