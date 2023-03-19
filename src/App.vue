<template>
  <div class="content">
    <VrefreshList ref="vrefreshList" list-field="records" :request-func="getDataList" @data-callback="ondataCallback">
      <div class="item" v-for="(item, index) in data.list" :key="index">{{ item.name }}</div>
    </VrefreshList>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import VrefreshList from './components/VrefreshList.vue'
interface Idata {
  list: any[]
  itemHeight: number
  dataLength: number
}
const data: Idata = reactive({
  list: [],
  itemHeight: 60, //listItem的默认高度
  dataLength: 200,
})

async function getDataList(): Promise<{
  [key: string]: any
}>{
  return new Promise((resolve) => {
    setTimeout(() => {
      const records = [...Array(data.dataLength).keys()].map(
      (item, i) => ({
        brandId: i + 1,
        name: `第${i + 1}项`,
        // height: Math.max(data.itemHeight, (Math.random() * 180).toFixed(0)),
        height: data.itemHeight,
        }))
      //模拟后端接口数据返回
      return resolve({
        code: '0',
        message: 'success',
        result: {
          records,
          total: records.length
        }, //数据列表
      })
    }, 300)
  })
}

function ondataCallback(val: {renderedRecords: any[]}) {
  data.list = val.renderedRecords
}
const vrefreshList = ref()
onMounted(() => {
  vrefreshList.value.resetList()
})
</script>

<style>
.content{
  width: 300px;
  height: 80vh;
  border: 1px solid black;
  overflow: hidden;
}
.item{
  width: 200px;
  height: 60px;
  line-height: 60px;
  text-align: center;
  border: 1px solid silver;
  margin-bottom: 10px;
  box-sizing: border-box;
}
</style>
