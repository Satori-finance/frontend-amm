<template>
  <div class="no-data">
    <img src="@/assets/img/noData.svg" alt="" />
    <div class="label mc-font-p14">{{ label || $t('base.noData') }}</div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class NoData extends Vue {
  @Prop({ default: true }) showLabel!: boolean
  @Prop({ default: undefined }) label?: string
}
</script>

<style lang="scss" scoped>
.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  .label {
    margin-top: 10px;
    color: var(--mc-text-color);
  }
}
</style>
