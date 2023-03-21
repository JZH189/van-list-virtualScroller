<template>
  <div ref="scrollerWrap" class="scrollerWrap" @scroll="onScroll">
    <div
      class="scroller"
      :style="{ width: '100%', height: `${listData.totalHeight}px` }"
    >
      <van-pull-refresh
        :style="{
          transform: listData.isVirtaulScroll
            ? `translate3d(0, ${listData.translateY}px, 0)`
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
          <div id="virtualList">
            <div class="virtualItem" v-for="(item, index) in listData.renderedRecords" :key="index">
              <slot :item="item"></slot>
            </div>
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
import { ref, watch, onMounted } from "vue";
import useList from "./composables/useList";
import type { ListDirection } from "vant";
import type { AsyncRequestFunction, IlistData, RequestRes } from "./interface";
//定义props类型
interface IVListProps {
  requestFunc: AsyncRequestFunction; //加载list的方法
  emptyTxt?: string; //无数据时展示的文字
  vscrollCount?: number; //超过设定的list长度自动开启虚拟滚动
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
//定义props
const props = withDefaults(defineProps<IVListProps>(), {
  immediateCheck: true,
  finishedText: "到底了！",
  errorText: "请求失败，点击重新加载",
  offset: 50,
  vscrollCount: 300,
  itemGap: 10,
  itemSize: 60,
  emptyTxt: "暂无商品信息",
});
//计算滚动条高度
function setTotalHeight(): void {
  if (props.itemSize) {
    //如果是定高则直接计算总高度
    listData.totalHeight = listData.records.length * (props.itemSize + props.itemGap);
    //设置滚动条的最大行程值
    listData.scrollToBottom = listData.totalHeight - listData.contentHeight;
  } else {
    listData.totalHeight = listData.records.length * (props.itemSize + props.itemGap);
    //!todo
  }
}
//根据滚动条位置计算需要渲染的list
function updateRenderedRecords(): void {
  const startIndex = Math.floor(
    listData.translateY / ((props as any).itemSize + props.itemGap)
  );
  //多加20个元素是为了防止页面白屏
  const endIndex = startIndex + listData.pageCount + 20;
  listData.renderedRecords = listData.records.slice(startIndex, endIndex);
}
function updateRender(): void {
  if (listData.isVirtaulScroll) {
    //动态计算渲染元素
    updateRenderedRecords();
  } else {
    listData.renderedRecords = listData.records
  }
}
//计算盒子高度
function setContentHeightAndPageCount(): void {
  listData.contentHeight = scrollerWrap.value.parentNode.offsetHeight;
}
//计算可视区能展示多少个项目
function setContentItem(): void {
  if (props.itemSize) {
    listData.pageCount = Math.floor(
      listData.contentHeight / ((props as any).itemSize + props.itemGap)
    );
  } else {
    listData.pageCount = Math.floor(
      listData.contentHeight / ((props as any).itemSize + props.itemGap)
    );
  }
}
function onScroll(e: any) {
  const scrollTop = e?.target?.scrollTop || 0;
  //!设置最大滚动值，否则滚动条会出现反复跳动
  listData.translateY =
    scrollTop >= listData.scrollToBottom ? listData.scrollToBottom : scrollTop;
  updateRender();
  // updateRenderItem(listData)
}
const { listData, refreshing, showNoList, onLoad, onRefresh, resetList } = useList(props, updateRender);
//依据prop初始化组件数据
watch(
  () => listData.records.length,
  (listRecordsLength) => {
    setTotalHeight()
    // getTotalHeight(listData)
    // console.log('listData: ', listData);
  },
  {
    immediate: true,
  }
);
//暴露出去的方法
defineExpose({
  onRefresh,
  onLoad,
  resetList,
});

onMounted(() => {
  setContentHeightAndPageCount();
  setContentItem()
});

function updateItemHeight({ index, height }) {
  // 每次创建的时候都会抛出事件，因为没有处理异步的情况，所以必须每次高度变化都需要更新
  // dom元素加载后得到实际高度 重新赋值回去
  this.itemHeightCache[index] = { isEstimated: false, height: height }
  this.updateContentHeight()
  // 重新确定列表的实际总高度
  this.scrollBarHeight = this.itemHeightCache.reduce((pre, current) => {
    return pre + current.height
  }, 0)
  // 更新itemTopCache
  const newItemTopCache = [0]
  for (let i = 1, l = this.itemHeightCache.length; i < l; i++) {
    // 虚拟每项距顶部高度 + 实际每项高度
    newItemTopCache[i] = this.itemTopCache[i - 1] + this.itemHeightCache[i - 1].height
  }
  // 获得每一项距顶部的实际高度
  this.itemTopCache = newItemTopCache
  this.update()
}
function updateContentHeight() {
  if (this.isFixContainerHeight || this.scrollTop !== 0) {
    return
  }
  if (this.itemHeightCache.every((item) => item.isEstimated === false)) {
    const itemTotalHeight = this.itemHeightCache.reduce((pre, value) => pre + value.height, 0)
    if (itemTotalHeight < this.contentHeight) {
      this.contentHeight = itemTotalHeight
    }
    // console.log('itemTotalHeight:', itemTotalHeight)
  }
}
function getTotalHeight(listData: IlistData): void {
  listData.totalHeight = listData.records.reduce((pre, current, index) => {
    // 给每一项设置虚拟高度
    listData.itemHeightCache[index] = {
      isEstimated: true,
      height: initItemHeight, //默认子项的高度为60px
    };
    // 给每一项设置距顶部的虚拟高度
    listData.cacheItemTop[index] = index === 0 ? 0 : listData.cacheItemTop[index - 1] + initItemHeight;
    return pre + initItemHeight;
  }, 0);
}
// 获取渲染项起始索引
function getStartIndex(listData: IlistData): number {
  const scrollTop = listData.translateY;
  //每项距离顶部的距离组成的数组
  const cacheItemTopArray = listData.cacheItemTop;
  let index = -1,
      start = 0,
      end = cacheItemTopArray.length - 1,
      mid = Math.floor((start + end) / 2);
  while (end - start > 1) {
    if (scrollTop < cacheItemTopArray[mid]) {
      end = mid
      mid = Math.floor((start + end) / 2)
    } else if (scrollTop > cacheItemTopArray[mid]) {
      start = mid
      mid = Math.floor((start + end) / 2)
    } else {
      index = mid
    }
  }
  listData.startIndex = index>0? index : 0
  return index;
}
function getEndIndex(listData: IlistData): number {
  const gap = listData.translateY - listData.cacheItemTop[listData.startIndex] // 出现留白的高度
  let itemHeightTotal = 0
  let endIndex = 0
  for (let i = listData.startIndex; i < listData.records.length; i++) {
    // 留白偏差处理 + gap
    if (itemHeightTotal < listData.contentHeight + gap) {
      itemHeightTotal += listData.itemHeightCache[i].height
      endIndex = i
    } else {
      break
    }
  }
  endIndex = endIndex + listData.bufferItemCount // 加上预渲染数
  listData.endIndex = endIndex
  return endIndex
}
function updateRenderItem(listData: IlistData) {
  const startIndex = getStartIndex(listData)
  // 如果是奇数开始，就取其前一位偶数
  if (startIndex % 2 !== 0) {
    listData.startIndex = startIndex - 1
  } else {
    listData.startIndex = startIndex
  }
  listData.endIndex = getEndIndex(listData)
  console.log('listData: ', listData);
  listData.renderedRecords = listData.records.slice(listData.startIndex, listData.endIndex)
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
