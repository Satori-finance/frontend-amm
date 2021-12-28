<template>
  <div class="icon-header">
    <div class="icon-title">
      <div class="icons">
        <img class="token-icon" :src="image1" alt="">
        <img class="token-icon" v-if="showImage2" :src="image2" alt="">
      </div>
      <span class="right-title">
        <slot name="title">{{ title }}</slot>
      </span>
    </div>
    <div class="sub-title">
      <slot name="subTitle">{{ subTitle }}</slot>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component
export default class IconHeader extends Vue {
  @Prop({ required: true }) image1 !: string
  @Prop({ default: false }) showImage2 !: boolean
  @Prop({ default: () => null }) image2 !: string | null
  @Prop({ default: '' }) title !: string
  @Prop({ default: '' }) subTitle !: string

}
</script>

<style scoped lang="scss">
.icon-header {
  text-align: center;

  .icon-title {
    display: flex;
    align-items: center;
    justify-content: center;

    .icons {
      display: flex;
      align-items: center;
      margin-right: 4px;

      img {
        height: 24px;
        width: 24px;
        border-radius: 50%;
        background-color: var(--mc-text-color-white);

        &:first-of-type {
          height: 24px;
          width: 24px;
          z-index: 1;
        }

        &:last-of-type {
          margin-left: -10px;
        }
      }
    }

    .right-title {
      font-size: 20px;
      font-weight: 700;
      color: var(--mc-text-color-white);
    }
  }

  .sub-title {
    margin-top: 8px;
    font-size: 12px;
    color: var(--mc-text-color);
  }
}
</style>
