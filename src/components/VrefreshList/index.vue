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
};
</script>
<script lang="ts" setup>
import { ref, watch, reactive, onMounted } from "vue";
import useList from "./composables/useList";
import type { ListDirection } from 'vant';
import type { IlistData } from "./interface";
//定义props类型
interface IVListProps {
  listField: string; //接口返回的list字段名称比如：result.records
  requestParam: any; //加载list的请求参数
  requestFunc: (params: any) => Promise<any>; //加载list的方法
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
//定义emit
const emit = defineEmits<{
  (
    e: "dataCallback",
    val: {
      renderedRecords: any[];
    }
  ): void;
}>();
//定义props
const props = withDefaults(defineProps<IVListProps>(), {
  finishedText: "到底了！",
  errorText: "请求失败，点击重新加载",
  offset: 50,
  vscrollCount: 200,
  itemGap: 10,
  itemSize: 60,
  emptyTxt: "暂无商品信息",
  listField: "records",
});
//定义数据
const listData: IlistData = reactive({
  requestFunc: undefined,
  renderedRecords: [], //已经显示在可视区的数据
  records: [], //已经保存的list总条数
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
});
//依据prop初始化组件数据
watch(
  () => [props, listData.records.length],
  ([newProps, listRecordsLength]) => {
    //获取加载方法
    listData.requestFunc = (newProps as any).requestFunc;
    //设置list总高度
    listData.totalHeight = (listRecordsLength as number) * (props.itemSize + props.itemGap);
    //设置list上拉到底部的scrollTop
    listData.scrollToBottom = listData.totalHeight - listData.contentHeight;
  },
  {
    immediate: true,
    deep: true,
  }
);
//根据滚动条位置计算需要渲染的list
function updateRenderedRecords(): void {
  const startIndex = Math.floor(
    listData.translateY / ((props as any).itemSize + props.itemGap)
  );
  //多加20个元素是为了防止页面白屏
  const endIndex = startIndex + listData.pageCount + 20;
  listData.renderedRecords = listData.records.slice(startIndex, endIndex);
}
//更新数据条目至父组件
function emitDataList(): void {
  emit("dataCallback", {
    //如果是虚拟滚动则需要通过计算并返回应该渲染的list，否则直接返回已经加载的数据
    renderedRecords: listData.isVirtaulScroll
      ? listData.renderedRecords
      : listData.records,
  });
}
function updateRender(): void {
  if (listData.isVirtaulScroll) {
    //动态计算渲染元素
    updateRenderedRecords();
  }
  //发送数据到父组件
  emitDataList();
}
const scrollerWrap = ref();
//计算盒子高度，计算可视区能展示多少个项目
function setContentHeightAndPageCount(): void {
  listData.contentHeight = scrollerWrap.value.parentNode.offsetHeight;
  listData.pageCount = Math.floor(
    listData.contentHeight / ((props as any).itemSize + props.itemGap)
  );
}
function onScroll(e: any) {
  const scrollTop = e?.target?.scrollTop || 0;
  //!设置最大滚动值，否则滚动条会出现反复跳动
  listData.translateY =
    scrollTop >= listData.scrollToBottom ? listData.scrollToBottom : scrollTop;
  updateRender();
}
const { UserSlots, key, refreshing, showNoList, onLoad, onRefresh, resetList } =
  useList(listData, props, updateRender);
onMounted(() => {
  setContentHeightAndPageCount();
});
//暴露出去的方法
defineExpose({
  onRefresh,
  onLoad,
  resetList,
});
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
  background-image: url("@/assets/nodata.png");
  background-size: 100%;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 1;
}
</style>
