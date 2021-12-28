<template>
  <div class="mc-m-loading">
    <slot v-if="!loading"></slot>
    <div class="loading-content" v-else>
      <div class="loading-icon">
        <img class="fantasy-loading" src="@/assets/img/satori-fantasy/loading.svg" alt="">
      </div>
      <div class="loading-text" v-if="showLoadingText">{{ $t('base.loading') }}...</div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component
export default class Loading extends Vue {
  @Prop({ default: false }) loading !: boolean
  @Prop({ default: true }) showLoadingText!: boolean
}
</script>

<style lang="scss" scoped>
.mc-m-loading {

  .loading-content {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-flow: column;

    .loading-icon {
      img {
        display: inline-block;
        animation: rotating 2s linear infinite;
      }
    }

    .loading-text {
      margin-top: 8px;
      font-size: 14px;
      color: var(--mc-text-color);
    }
  }
}
</style>
