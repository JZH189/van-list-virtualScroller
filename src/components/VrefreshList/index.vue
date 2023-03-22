<template>
  <div ref="scrollerWrap" class="scrollerWrap" @scroll="onScroll">
    <div class="scroller">
      <van-pull-refresh
        :style="{
          transform: listData.isVirtaulScroll
            ? `translate3d(0, ${listData.scrollTop}px, 0)`
            : 'none',
        }"
        v-model="refreshing"
        @refresh="onRefresh"
      >
        <van-list
          v-model:error="listData.error"
          v-model:loading="listData.loading"
          :loading-text="props.loadingText"
          :immediate-check="props.immediateCheck"
          :finished="listData.finished"
          :finished-text="props.finishedText"
          :disabled="props.disabled"
          :error-text="props.errorText"
          :direction="props.direction"
          :offset="props.offset"
          @load="onLoad"
        >
          <div
            ref="virtualList"
            :style="{ width: '100%', height: `${listData.totalHeight}px` }"
          >
            <slot
              v-for="(item, index) in listData.renderedRecords"
              :key="index"
              :item="item"
            ></slot>
          </div>
        </van-list>
      </van-pull-refresh>
      <div class="noData" v-show="showNoList">{{ props.emptyTxt }}</div>
    </div>
  </div>
</template>
<script lang="ts">
export default {
  inheritAttrs: false,
};
</script>
<script lang="ts" setup>
import { ref, watch } from "vue";
import useList from "./composables/useList";
import type { ListDirection } from "vant";
import type { AsyncRequestFunction, IlistData } from "./interface";
//定义props类型
interface IVListProps {
  requestFunc: AsyncRequestFunction; //加载list的方法
  emptyTxt?: string; //无数据时展示的文字
  maxScroller?: number; //超过设定的list长度自动开启虚拟滚动
  itemGap?: number; //默认每项之间的间距
  itemSize?: number; //默认每项的高度
  offset?: string | number;
  disabled?: boolean;
  direction?: ListDirection;
  immediateCheck?: boolean;
  errorText?: string | undefined;
  loadingText?: string | undefined;
  finishedText?: string | undefined;
}
const initItemHeight: number = 60; //默认子项的高度为60px
const scrollerWrap = ref();
const virtualList = ref();
//定义props
const props = withDefaults(defineProps<IVListProps>(), {
  immediateCheck: true,
  finishedText: "到底了！",
  errorText: "请求失败，点击重新加载",
  offset: 50,
  maxScroller: 200,
  itemGap: 0,
  emptyTxt: "暂无商品信息",
});

function updateRender(): void {
  listData.renderedRecords = listData.records;
  if (listData.isVirtaulScroll) {
    //动态计算渲染元素
    updateVisiable(listData);
  } else {
    listData.renderedRecords = listData.records;
  }
}
//计算容器高度
function setContentHeight(): void {
  listData.contentHeight = scrollerWrap.value.parentNode.offsetHeight;
}
const { listData, refreshing, showNoList, onLoad, onRefresh, resetList } =
  useList(props, updateRender);
//判断是否应该开启虚拟滚动
function autoStartVirtaulScroll(listLength: number): void {
  //超过指定list数量自动开启虚拟滚动
  if (listLength >= props.maxScroller) {
    //计算容器高度
    setContentHeight();
    listData.isVirtaulScroll = true;
    //初始化虚拟滚动数据
    initVitualData(listData);
    updateVisiable(listData);
    // startVirtaulListObserver(virtualList.value);
  } else {
    listData.isVirtaulScroll = false;
  }
}
//依据prop初始化组件数据
watch(
  () => listData.records.length,
  (listRecordsLength) => {
    console.log("listRecordsLength: ", listRecordsLength);
    //自动开启虚拟滚动
    autoStartVirtaulScroll(listRecordsLength);
  }
);
//暴露出去的方法
defineExpose({
  onRefresh,
  onLoad,
  resetList,
});

function onScroll(e: any) {
  const scrollTop = e?.target?.scrollTop || 0;
  listData.scrollTop = scrollTop;
  if (listData.isVirtaulScroll) {
    //更新可视区列表元素
    updateVisiable(listData);
  }
}
function startVirtaulListObserver(node: Element): MutationObserver {
  const mutationObserver = new MutationObserver((mutations) => {
    //观察到添加子节点
    //@ts-ignore
    startItemResizeObserver(node.children);
  });
  mutationObserver.observe(node, {
    childList: true, // 观察目标子节点的变化，是否有添加或者删除
    attributes: false, // 观察属性变动, 默认为 false
    subtree: false, // 观察后代节点，默认为 false
  });
  return mutationObserver;
}
function startItemResizeObserver(nodes: Element[]): void {
  const resizeObserver = new ResizeObserver((entries) => {
    for (let index in entries) {
      //@ts-ignore
      updateItemHeight({ index, height: entries[index].target.offsetHeight });
    }
  });
  for (let node of nodes) {
    resizeObserver.observe(node);
  }
}
function getIndexByArray(start: number, end: number, array: any[]): any[] {
  let indexArr = [];
  for (let i = start; i <= end; i++) {
    indexArr.push({
      order: i,
      val: array[i],
    });
  }
  if (indexArr.length <= 2) {
    return indexArr;
  }
  return [];
}
//获取可视区起始项目索引
function getStartIndex(listData: IlistData): number {
  const scrollTop = listData.scrollTop;
  if (scrollTop <= 0) return 0;
  //每项距离顶部的距离组成的数组
  const cacheItemTopArray = listData.cacheItemTop;
  let start = 0,
    end = cacheItemTopArray.length - 1,
    mid = Math.floor((start + end) / 2);
  while (end - start > 1) {
    if (scrollTop < cacheItemTopArray[mid]) {
      end = mid;
      mid = Math.floor((start + end) / 2);
    } else if (scrollTop > cacheItemTopArray[mid]) {
      start = mid;
      mid = Math.floor((start + end) / 2);
    }
  }
  const result = getIndexByArray(start, end, cacheItemTopArray);
  if (result.length === 2) {
    const order = result[result.length - 1].order;
    listData.startIndex = order;
    return order;
  }
  return 0;
}
//获取可视区结束项目的索引
function getEndIndex(listData: IlistData): number {
  let endIndex = 0;
  // if (props.itemSize) {
  //   //定高的情况可以直接计算可视区的展示个数
  //   listData.pageCount = Math.ceil(
  //     listData.contentHeight / ((props as any).itemSize + props.itemGap)
  //   );
  //   endIndex =
  //     listData.startIndex + listData.pageCount + listData.bufferItemCount;
  //   listData.endIndex = endIndex;
  //   return endIndex;
  // }
  let itemHeightTotal = 0;
  for (let i = listData.startIndex; i < listData.records.length; i++) {
    itemHeightTotal += listData.records[i].height + props.itemGap;
    if (itemHeightTotal >= listData.contentHeight) {
      endIndex = i;
      break;
    }
  }
  endIndex = endIndex + listData.bufferItemCount; // 加上预渲染数
  return (listData.endIndex = endIndex);
}
//初始化数据
function initVitualData(listData: IlistData): void {
  let preTOP = 0;
  listData.records.forEach((item, index) => {
    //初始化虚拟高度
    listData.itemHeightCache[index] = {
      index,
      isEstimated: true,
      height: initItemHeight, //默认子项的高度为60px
    };
    //初始化cacheTop
    listData.cacheItemTop[index] = preTOP;
    preTOP = initItemHeight * index + props.itemGap;
  });
  //初始化滚动条高度
  listData.totalHeight =
    listData.records.length * (initItemHeight + props.itemGap);
}
//更新数据
function updateVitualData(listData: IlistData): void {
  //更新总高度
  let preTOP = 0;
  listData.totalHeight = listData.itemHeightCache.reduce(
    (pre, current, index) => {
      //更新cacheTop
      listData.cacheItemTop[index] = preTOP;
      preTOP = pre + current.height + props.itemGap;
      return pre + current.height + props.itemGap;
    },
    0
  );
  // console.log("更新总高度: ", listData);
}
//子项目高度更新
function updateItemHeight({ index = 0, height = 0 }) {
  listData.itemHeightCache[index] = {
    index,
    isEstimated: false,
    height: height > 0 ? height : initItemHeight,
  };
  //修正子项真实高度和scrollTop
  updateVitualData(listData);
}
function updateVisiable(listData: IlistData) {
  const start = getStartIndex(listData);
  const end = getEndIndex(listData);
  console.log("start: ", start);
  console.log("end: ", end);
  console.log("listData: ", listData);
  const renderedRecords = listData.records.slice(start, end);
  listData.renderedRecords = renderedRecords;
}
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
  start: 50%;
  margin: -150px 0px 0px -150px;
  background-image: url("@/assets/nodata.png");
  background-size: 100%;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 1;
}
</style>
