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
  vscrollCount?: number; //超过设定的list长度自动开启虚拟滚动
  itemGap?: number; //默认每项之间的间距
  itemSize?: number; //默认每项的高度
  emptyTxt?: string; //无数据时展示的文字
  loading?: boolean; //是否加载中
  error?: boolean; //是否加载出错？
  errorText?: string; //加载出错后的文字提示，点击可以继续触发加载
  finished?: boolean; //是否加载完成？
  offset?: string | number; //距离底部多少开始触发上拉加载更多
  loadingText?: string; //加载中的文字提示
  finishedText?: string; //所有数据加载完成后的提示
  immediateCheck?: boolean; //是否立即滚动位置检查
  direction?: string; //滚动触发加载的方向('down')，可选值为 ‘up’
  disabled?: boolean; //是否禁用滚动加载
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
  translateY: number; //记录list偏移量
  pageCount: number; //可视区可以显示多少个项目
  scrollToBottom: number; //计算list上拉到低的scrollTop值
}
export { RequestRes, AsyncRequestFunction, IVListProps, IlistData };
