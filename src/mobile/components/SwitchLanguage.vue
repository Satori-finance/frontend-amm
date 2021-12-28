<template>
  <div class='switch-language scroll-container'>
    <BackNavBar :title="$t('footer.language')"></BackNavBar>

    <div class="lang-select-content page-container">
      <div
        class="lang-item"
        v-for="(item, keys) in langMessages"
        :key="keys"
        @click.stop="switchLang(keys)"
      >
        <span class="lang-name">{{item._type}}</span>
        <i v-if="lang === keys" class="check-sign iconfont icon-radio-selected"></i>
      </div>
    </div>
  </div>
</template>

<script lang='ts'>
import { Component, Mixins } from 'vue-property-decorator'
import BackNavBar from '@/mobile/template/Header/BackNavBar.vue'
import LangMixin from '@/template/components/Setting/LangMixin'
import { COMMON_EVENT, VUE_EVENT_BUS } from '@/event'
@Component({
  components: {
    BackNavBar
  },
})
export default class SwitchLanguage extends Mixins(LangMixin){

  private switchLang(lang: any) {
    VUE_EVENT_BUS.emit(COMMON_EVENT.LANGUAGE_CHANGED, lang)
    this.close()
  }

  private close() {
    this.$router.back()
  }
}
</script>

<style scoped lang='scss'>
  .switch-language {
    height: 100%;
    background-color: var(--mc-background-color);

    .back-nav-bar ::v-deep.van-nav-bar {
      background-color: var(--mc-background-color);
    }

    .lang-select-content {
      padding: 0 16px;
      .item {
        img {
          width: 0.2rem;
          height: 0.2rem;
        }

        .selected {
          border-radius: 2px;
        }
      }

      .lang-item {
        width: 100%;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: space-between;

        .lang-name {
          font-size: 16px;
          color: var(--mc-text-color-white);
        }

        .check-sign {
          font-size: 0.14rem;
          color: var(--mc-color-primary);
        }
      }
    }
  }

</style>
