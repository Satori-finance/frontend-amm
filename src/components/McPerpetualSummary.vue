<template>
  <div class="mc-perpetual-summary">
    <McTokenPairView :size="36" :collateralAddress="collateralAddress" :underlyingSymbol="underlyingSymbol">
    </McTokenPairView>
    <div class="summary">
      <div class="name">{{ name }}</div>
      <div class="symbol">
        <span>{{ symbol }}</span>
        <span class="inverse-card" v-if="isInverse">{{ $t('base.inverse') }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import McTokenPairView from './McTokenPairView.vue'

@Component({
  components: {
    McTokenPairView,
  },
})
export default class McPerpetualSummary extends Vue {
  @Prop({ required: true }) collateralAddress!: string
  @Prop({ required: true }) underlyingSymbol!: string
  @Prop({ required: true }) name!: string
  @Prop({ required: true }) symbol!: string
  @Prop({ required: true }) isInverse!: string
}
</script>

<style lang="scss" scoped>
.mc-perpetual-summary {
  display: inline-flex;
  align-items: center;
  height: 44px;

  .summary {
    margin-left: 8px;

    .name {
      height: 22px;
      font-size: 12px;
      line-height: 22px;
    }

    .symbol {
      height: 22px;
      font-size: 12px;
      line-height: 22px;
      display: flex;
      align-items: center;
    }
  }
}
</style>

<style lang="scss" scoped>
.satori-fantasy {
  .mc-perpetual-summary {
    .summary {
      .symbol {
        color: var(--mc-text-color);
      }
    }
  }
}
</style>
