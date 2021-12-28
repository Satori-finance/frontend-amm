<template>
  <div class="lang-selector">
    <div class="back-btn">
      <svg class="svg-icon" aria-hidden="true" @click="close">
        <use xlink:href="#icon-vector-stroke"></use>
      </svg>
    </div>
    <div class="lang-select-content">
      <div
        class="lang-item"
        v-for="(item, keys) in langMessages"
        :key="keys"
        :class="{'selected': lang === keys}"
        @click.stop="switchLang(keys)"
      >
        <span class="lang-name">{{item._type}}</span>
        <i v-if="lang === keys" class="iconfont icon-select"></i>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Vue } from 'vue-property-decorator'
import LangMixin from '@/template/components/Setting/LangMixin'
import { COMMON_EVENT, VUE_EVENT_BUS } from '@/event'

@Component
export default class LangSelector extends Mixins(LangMixin) {
  private switchLang(lang: any) {
    VUE_EVENT_BUS.emit(COMMON_EVENT.LANGUAGE_CHANGED, lang)
    this.$emit('close')
  }

  private close() {
    this.$emit('close')
  }
}
</script>

<style lang="scss" scoped>
.lang-selector {
  .back-btn {
    margin-bottom: 16px;
    height: 16px;
    display: flex;
    align-items: center;

    .svg-icon {
      cursor: pointer;
      display: inline-block;
      height: 16px;
      width: 16px;
      transform: rotate(180deg);
      opacity: 0.5;

      &:hover {
        opacity: 0.75;
      }
    }
  }
  .lang-select-content {
    .lang-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;

      &:not(:last-of-type) {
        margin-bottom: 16px;
      }

      .lang-name {
        font-size: 14px;
        line-height: 20px;
      }

      .iconfont {
        font-size: 16px;
      }
    }
  }
}
</style>

<style scoped lang="scss">
@import "~@mcdex/style/element-fantasy/common/var";

.lang-selector {
  .lang-item {
    .lang-name {
      color: rgba($--mc-text-color-white, 0.75);
    }

    .iconfont {
      color: rgba($--mc-text-color-white, 0.5);
    }

    &:hover, &.selected {
      .lang-name {
        color: $--mc-text-color-white;
      }

      .iconfont {
        color: rgba($--mc-text-color-white, 0.75);
      }
    }
  }
}
</style>
