<template>
  <div ref="scrollerWrap" class="scrollerWrap" @scroll="onScroll">
    <div class="scroller" :style="{width: '100%', height: `${listData.totalHeight}px`}">
      <van-pull-refresh
        :style="{transform: `translate3d(0, ${listData.translateY}px, 0)`}"
        v-model="refreshing" 
        @refresh="onRefresh">
        <van-list
          v-bind="$attrs"
          :immediate-check="listData.immediateCheck"
          :finished="listData.finished"
          :loading="listData.loading"
          v-model:error="listData.error"
          @load="onLoad"
        >
          <UserSlots :key="key" />
        </van-list>
      </van-pull-refresh>
      <div class="noData" v-show="showNoList">{{ props.emptyTxt }}</div>
    </div>
  </div>
</template>
<script lang="ts">
export default {
  inheritAttrs: false,
}
</script>
<script lang="ts" setup>
import { useSlots, ref, computed, watch, reactive, onMounted } from 'vue'
import { showToast } from 'vant';
interface IVListProps {
  itemGap?: number  //默认每项之间的间距 
  itemSize?: number  //默认每项的高度 
  emptyTxt?: string  //无数据时展示的文字
  listField?: string //接口返回的list字段名称比如：result.records
  loading?: boolean //是否加载中
  error?: boolean   //是否加载出错？
  errorText?: string    //加载出错后的文字提示，点击可以继续触发加载
  finished?: boolean //是否加载完成？
  offset?: string | number //距离底部多少开始触发上拉加载更多
  loadingText?: string   //加载中的文字提示
  finishedText?: string  //所有数据加载完成后的提示
  immediateCheck?: boolean  //是否立即滚动位置检查
  direction?: string  //滚动触发加载的方向('down')，可选值为 ‘up’
  disabled?: boolean //是否禁用滚动加载
  requestParam?: any //加载list的请求参数
  requestFunc: (params: any) => Promise<any> //加载list的方法
}
interface IlistData {
  renderedRecords: any[]  //显示在可视区的数据
  records: any[]  //已经保存的list总条数
  immediateCheck: boolean
  finished: boolean
  loading: boolean
  error: boolean
  total: number
  current: number 
  size: number  //每页展示多少条记录
  isVirtaulScroll: boolean //是否开启虚拟滚动
  contentHeight: number  //list盒子元素的高度
  totalHeight: number //list的总高度
  translateY: number  //记录list偏移量
  pageCount: number  //可视区可以显示多少个项目
  scrollToBottom: number //计算list上拉到低的scrollTop值
}
//定义emit
const emit = defineEmits<{
  (
    e: 'dataCallback',
    val: {
      renderedRecords: any[]
    },
  ): void
}>()
//定义props
const props = withDefaults(defineProps<IVListProps>(), {
  itemGap: 10,
  itemSize: 60,
  emptyTxt: '暂无商品信息',
  immediateCheck: false, //是否在初始化时立即执行滚动位置检查
  listField: 'records', //默认list的字段为 records
  finishedText: '到底了！',
  errorText: '请求失败，点击重新加载',
  offset: '50px',
})
//pull-refresh是否处于加载中状态
const refreshing = ref(false)
const listData: IlistData = reactive({
  renderedRecords: [], //已经显示在可视区的数据
  records: [], //已经保存的list总条数
  immediateCheck: false,
  finished: false, //数据是否加载完
  loading: false, //list是否正在加载
  error: false, //设置为true，可以点击错误提示继续触发onload
  total: 0, //总条数
  current: 1, //默认展示第一页
  size: 50, //每页50条
  isVirtaulScroll: false,
  contentHeight: 0,
  totalHeight: 0,
  translateY: 0,   
  pageCount: 0,
  scrollToBottom: 0,                  
})
let requestFunc: (params: any) => Promise<any>
//依据prop初始化组件数据
watch(
  () => props,
  (newProps) => {
    //获取加载方法
    requestFunc = newProps.requestFunc
    //初始化数据
    listData.immediateCheck = newProps?.immediateCheck || false
    listData.finished = newProps?.finished || false
    listData.loading = newProps?.loading || false
    listData.error = newProps?.error || false
  },
  {
    immediate: true,
    deep: true,
  },
)
const scrollerWrap = ref()
//动态设置list总高度和到达列表底部的scrollTop
watch(
  () => listData.records.length,
  (listRecordsLength) => {
    //设置list总高度
    listData.totalHeight = listRecordsLength * (props.itemSize + props.itemGap)
    //设置list上拉到底部的scrollTop
    listData.scrollToBottom = listData.totalHeight - listData.contentHeight
  }
)
//onLoad获取请求参数
const pageParams = computed(() => ({
  current: listData.current,
  param: {
    ...props.requestParam,
  },
  size: listData.size,
}))
const showNoList = ref(false)
//获取分页的total
function getListTotal(result: Object, path: string[], field = 'total'): number{
  let res = 0
  if (path.length === 1) {
    //@ts-ignore
    return (res = result[field])
  }
  let obj = result
  for (let index in path) {
    //@ts-ignore
    obj = obj[path[index]]
    //@ts-ignore
    if (obj?.[field]) {
      //@ts-ignore
      res = obj[field]
    }
  }
  return res
}
//获取分页的list
function getListData(result: Object, path: string[]): any[]{
  let res: any[]
  if (path.length === 1) {
    //@ts-ignore
    return (res = result[path[0]])
  }
  let obj = result
  for (let index in path) {
    //@ts-ignore
    obj = obj[path[index]]
  }
  //@ts-ignore
  return (res = obj)
}
//list加载的方法
async function onLoad(): Promise<void> {
  try {
    //每次请求后手动重置loading
    listData.loading = true
    if (typeof requestFunc === 'function') {
      const { code, message, result } = await requestFunc(pageParams.value)
      //请求过后自动更新页码
      listData.current++
      if (code === '0') {
        //请求成功的处理
        const path = props.listField.split('.') //['page', 'records']
        //将命名空间分割成数组格式进行对象属性操作得到最终的数据
        const dataList = getListData(result, path)
        const total = getListTotal(result, path, 'total')
        listData.records.push(...dataList)
        //如果超过总条数证明所有数据加载完成
        if (listData.records.length >= total) {
          listData.finished = true
        }
        listData.records.length
          ? (showNoList.value = false)
          : (showNoList.value = true)
      } else {
        //请求失败的处理
        showToast(`请求出错，${message}`)
      }
      //自动开启虚拟滚动
      autoStartVirtaulScroll(listData.records.length)
      lazyUpdate()
    }
    //每次请求后手动重置loading
    listData.loading = false
  } catch (error) {
    //加载失败了可以点击错误提示重新加载
    listData.error = true
    console.log('error: ', error)
  }
}
//判断是否应该开启虚拟滚动
function autoStartVirtaulScroll(listLength: number): void {
  //默认200条数据后开启虚拟滚动
  if (listLength >= 200) {
    listData.isVirtaulScroll = true
  } else {
    listData.isVirtaulScroll = false
  }
}
function onScroll(e: any) {
  listData.translateY = e?.target?.scrollTop || 0
  lazyUpdate()
}
function updateRender(): void{
  //动态计算渲染元素
  updateRenderedRecords()
  //发送数据到父组件
  emitDataList()
}
//根据滚动条位置计算需要渲染的list
function updateRenderedRecords(): void {
  const startIndex = Math.floor(listData.translateY / (props.itemSize + props.itemGap))
  //多加20个元素是为了防止页面白屏
  const endIndex = startIndex + listData.pageCount + 20
  listData.renderedRecords = listData.records.slice(startIndex, endIndex)
}
//更新数据条目至父组件
function emitDataList(): void {
  emit('dataCallback', {
    //如果是虚拟滚动则需要通过计算并返回应该渲染的list，否则直接返回已经加载的数据
    renderedRecords: listData.isVirtaulScroll? listData.renderedRecords : listData.records,
  })
}
//触发刷新的方法
async function onRefresh(): Promise<void>{
  //刷新需要重新初始化数据
  refreshing.value = true
  listData.finished = false
  listData.error = false
  listData.current = 1
  listData.records = []
  await onLoad()
  refreshing.value = false
}
//重置数据状态
async function resetList(): Promise<void>{
  listData.finished = false
  listData.error = false
  listData.current = 1
  listData.records = []
  await onLoad()
}
//计算盒子高度，计算可视区能展示多少个项目
function setContentHeightAndPageCount(): void {
  listData.contentHeight = scrollerWrap.value.parentNode.offsetHeight;
  listData.pageCount = Math.floor(listData.contentHeight / (props.itemSize + props.itemGap))
}
function throttle(func: Function, wait: number = 30): Function {
    let previous = 0;
    return (...args: any[]) => {
      let now = Date.now();
        // @ts-ignore
        let context = this;
        if (now - previous > wait) {
            func.apply(context, args);
            previous = now;
        }
    }
}
const lazyUpdate = throttle(updateRender)
const userSlots = useSlots()
//最终被呈现的slots
const renderSlots = computed(() => (userSlots as any).default())
//强制刷新slots
const key = ref(0)
watch(renderSlots, () => (key.value += 1))
const UserSlots = () => [renderSlots.value]
onMounted(() => {
  setContentHeightAndPageCount()
})
//暴露出去的数据和方法
defineExpose({
  listData,
  onRefresh,
  onLoad,
  resetList,
})
</script>

<style scoped>
.scrollerWrap {
  position: relative;
  width: 100%;
  height: 100%;
  border: 1px solid red;
  box-sizing: border-box;
  overflow: auto;
}
.noData {
  position: absolute;
  text-align: center;
  font-size: 28px;
  font-weight: 400;
  color: #111314;
  width: 300px;
  height: 300px;
  line-height: 600px;
  top: 50%;
  left: 50%;
  margin: -150px 0px 0px -150px;
  background-image: url('@/assets/nodata.png');
  background-size: 100%;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 1;
}
</style>
