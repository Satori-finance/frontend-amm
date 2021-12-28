<template>
  <div class="info-card">
    <div class="info-card-title">
      <div class="title-left">
        <slot name="title-left">{{ title }}</slot>
      </div>
      <div class="title-right">
        <slot name="title-right"></slot>
      </div>
    </div>
    <div class="info-card-value">
      <div class="value-left">
        <slot name="value-left"></slot>
      </div>
      <div class="value-right">
        <slot name="value-right">{{ value }}</slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class InfoCard extends Vue {
  @Prop( { default: '' }) title !: string
  @Prop( { default: '' }) value !: any

}
</script>

<style lang="scss" scoped>
.info-card {
  border-radius: 12px;
  width: 100%;
  min-height: 77px;
  background-color: var(--mc-background-color);
  padding: 16px;

  .info-card-title {
    display: flex;
    justify-content: space-between;

    .title-left {
      font-size: 12px;
      font-weight: 400;
      color: var(--mc-text-color);
    }
    .title-right {}
  }

  .info-card-value {
    display: flex;
    justify-content: space-between;
    margin-top: 8px;

    .value-left {}
    .value-right {
      font-size: 20px;
      font-weight: 700;
      color: var(--mc-text-color-white);
    }
  }
}
</style>
