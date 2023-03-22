<template>
  <div class="content">
    <VrefreshList :item-size="60" :request-func="getDataList">
      <template #default="{ item }">
        <div
          class="item"
          :style="{
            height: `${item.height}px`,
            lineHeight: `${item.height}px`,
          }"
        >
          {{ item.name }},{{ item.height }}px
        </div>
      </template>
    </VrefreshList>
  </div>
</template>
<script setup lang="ts">
import { reactive } from "vue";
import VrefreshList from "./components/VrefreshList/index.vue";
interface Idata {
  list: any[];
  itemHeight: number;
  dataLength: number;
}
const data: Idata = reactive({
  list: [],
  itemHeight: 60, //listItem的默认高度
  dataLength: 200,
});

async function getDataList(): Promise<{
  rows: any[];
  total: number;
  [key: string]: any;
}> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const records = [...Array(data.dataLength).keys()].map((item, i) => ({
        name: `第${i + 1}项`,
        //@ts-ignore
        // height: Math.max(data.itemHeight, (Math.random() * 180).toFixed(0)),
        height: data.itemHeight,
      }));
      //模拟后端接口数据返回
      return resolve({
        rows: records,
        total: records.length,
      });
    }, 30);
  });
}
</script>

<style>
.content {
  width: 300px;
  height: 80vh;
  border: 1px solid black;
  overflow: hidden;
}
.item {
  width: 200px;
  height: 60px;
  line-height: 60px;
  text-align: center;
  border: 1px solid silver;
  /* margin-bottom: 10px; */
  box-sizing: border-box;
}
</style>
