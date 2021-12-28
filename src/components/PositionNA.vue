<template>
  <el-tooltip :content="$t(tooltip)">
    <span>N/A</span>
  </el-tooltip>
</template>

<script lang="ts">
import { Vue, Prop, Component } from 'vue-property-decorator'

@Component
export default class PositionNA extends Vue {
  @Prop({ default: 'hintInfos.positionsAndOrders.unknownValue' }) tooltip !: [String, Object]
}
</script>
