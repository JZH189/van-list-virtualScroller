// 定义请求APi返回的res
interface RequestRes {
  // 列表数据
  rows: any[];
  // 总条目数
  total: number;
  [key: string]: any;
}
//定义请求函数
type AsyncRequestFunction = () => Promise<RequestRes>;
interface IVListProps {
  requestFunc: AsyncRequestFunction; //加载list的方法
  emptyTxt?: string; //无数据时展示的文字
  maxScroller?: number; //超过设定的list长度自动开启虚拟滚动
  itemGap?: number; //默认每项之间的间距
  itemSize?: number; //默认每项的高度
  offset?: string | number; //距离底部多少开始触发上拉加载更多
  disabled?: boolean; //是否禁用滚动加载
  direction?: string; //滚动触发加载的方向('down')，可选值为 ‘up’
  immediateCheck?: boolean; //是否立即滚动位置检查
  errorText?: string | undefined; //加载出错后的文字提示，点击可以继续触发加载
  loadingText?: string | undefined; //加载中的文字提示
  finishedText?: string | undefined; //所有数据加载完成后的提示
}
interface IlistData {
  renderedRecords: any[]; //显示在可视区的数据
  records: any[]; //已经保存的list总条数
  finished: boolean;
  loading: boolean;
  error: boolean;
  total: number;
  current: number;
  size: number; //每页展示多少条记录
  isVirtaulScroll: boolean; //是否开启虚拟滚动
  contentHeight: number; //list盒子元素的高度
  totalHeight: number; //list的总高度
  scrollTop: number; //记录list偏移量
  pageCount: number; //可视区可以显示多少个项目
  scrollToBottom: number; //计算list上拉到低的scrollTop值
  itemHeightCache: any[]; //缓存子项的高度信息
  cacheItemTop: number[]; //缓存每一项至顶部的距离
  startIndex: number; // 截取数组的起始索引
  endIndex: number; // 截取数组的结束索引
  bufferItemCount: number; //缓冲区的item个数
}
export { RequestRes, AsyncRequestFunction, IVListProps, IlistData };
