<template>
  <div class="mc-m-tabs" :class="[styleType]">
    <div class="container" :class="{ 'between-flex': equalWidth }">
      <div :class="['tab-item', value===tab.value?'selected':'']" @click="setSelectValue(tab.value)"
           v-for="tab in tabs" :key="tab.value" :value="tab.value"
           :style="{minWidth: `${itemMinWidth}%`, marginRight: !equalWidth ? '0' : `${margin}px`}"
      >
        <router-link :to="tab.link" v-if="tab.link">
          <div>
            <a>{{ tab.label }}</a>
            <div class="select-bar"></div>
          </div>
        </router-link>
        <div v-else>
          <a>{{ tab.label }}</a>
          <div class="select-bar"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'

@Component
export default class McMTabs extends Vue {
  @Prop({ required: true }) value !: string
  @Prop({ required: true, default: () => [] }) tabs !: Array<{ label: string, value: string, link?: any }>
  @Prop({ default: 'default' }) styleType!: 'default' | 'round'
  @Prop({ default: false }) equalWidth !: boolean
  @Prop({ default: 32 }) margin !: number

  get itemMinWidth(): number {
    return this.equalWidth ? 0 : 100/this.tabs.length
  }

  setSelectValue(val: string) {
    this.$emit('input', val)
  }
}
</script>

<style lang="scss" scoped>
.mc-m-tabs {
  .container {
    display: flex;
    justify-content: space-around;
    text-align: center;

    &.between-flex {
      justify-content: left;

      .tab-item:last-child {
        margin-right: 0 !important;
      }
    }

    .tab-item {
      cursor: pointer;
    }
  }
}

.mc-m-tabs.default {
  height: 36px;
  line-height: 36px;

  .container {
    .tab-item {
      font-size: 14px;
      display: inline-block;
      color: var(--mc-text-color);

      a {
        cursor: pointer;
      }

      &:hover {
        color: var(--mc-text-color-white);
      }
    }

    .selected {
      height: 36px;
      color: var(--mc-text-color-white);

      .select-bar {
        background: var(--mc-color-primary-gradient);
        height: 3px;
        border-top: 2px solid var(--mc-color-primary-gradient);
        margin-top: -4px;
      }
    }
  }
}

.mc-m-tabs.round {
  height: 48px;
  padding: 3px;
  background-color: var(--mc-background-color-dark);
  border-radius: var(--mc-border-radius-l);
  border: 1px solid var(--mc-border-color);

  .container {
    height: 100%;
    .tab-item {
      flex: 1;
      border-radius: var(--mc-border-radius-m);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      line-height: 18px;

      &:hover {
        color: var(--mc-text-color-white);
      }

      &.selected {
        background-color: var(--mc-background-color-light);
      }
    }
  }
}
</style>
