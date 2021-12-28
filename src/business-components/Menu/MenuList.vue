<template>
  <div class="menu-list">
    <!--    <a class="menu-item" target="_blank">-->
    <!--      <div class="label">{{ $t('footer.about') }}</div>-->
    <!--      <div class="icon"><i class="iconfont icon-circle-info"></i></div>-->
    <!--    </a>-->
    <a class="menu-item" target="_blank" href="https://github.com/Satori-finance">
      <div class="label">{{ $t('footer.code') }}</div>
      <div class="icon"><i class="iconfont icon-code"></i></div>
    </a>
    <!-- <a class="menu-item" target="_blank" href="javascript:void(0);">
      <div class="label">{{ $t('footer.docs') }}</div>
      <div class="icon"><i class="iconfont icon-docs"></i></div>
    </a>

    <a class="menu-item" target="_blank" href="javascript:void(0);">
      <div class="label">{{ $t('footer.forum') }}</div>
      <div class="icon"><i class="iconfont icon-forum"></i></div>
    </a>
    <a class="menu-item" target="_blank" href="javascript:void(0);">
      <div class="label">{{ $t('footer.discord') }}</div>
      <div class="icon"><i class="iconfont icon-discord"></i></div>
    </a>
    <a class="menu-item" target="_blank" :href="telegramAddress">
      <div class="label">{{ $t('footer.telegram') }}</div>
      <div class="icon"><i class="iconfont icon-telegram"></i></div>
    </a>
    <a class="menu-item" target="_blank" href="javascript:void(0);">
      <div class="label">{{ $t('footer.medium') }}</div>
      <div class="icon"><i class="iconfont icon-medium"></i></div>
    </a> -->
    <!--    <div class="menu-item" @click="selectLang">-->
    <!--      <div class="label">{{ $t('footer.language') }}</div>-->
    <!--      <div class="icon"><i class="iconfont icon-vector-stroke"></i></div>-->
    <!--    </div>-->
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class MenuList extends Vue {
  get telegramAddress(): string {
    if (this.$i18n.locale === 'zh-CN') {
      return 'javascript:void(0);'
    }
    return 'javascript:void(0);'
  }

  private selectLang() {
    this.$emit('selectLang')
  }
}
</script>

<style lang="scss" scoped>
@import '~@mcdex/style/element-fantasy/common/var';

.menu-list {
  .menu-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;

    &:not(:last-child) {
      margin-bottom: 16px;
    }

    &:hover {
      .label {
        color: var(--mc-text-color-white);
      }
      .icon {
        color: rgba($--mc-text-color-white, 0.75);
      }
    }

    .label {
      color: rgba($--mc-text-color-white, 0.75);
      font-size: 14px;
      line-height: 20px;
    }

    .icon {
      color: rgba($--mc-text-color-white, 0.5);
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}
</style>
