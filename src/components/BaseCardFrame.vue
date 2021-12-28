<template>
  <div class="base-card-frame">
    <div class="head">
      <div class="title">
        <slot name="title">
          {{ title }}
        </slot>
      </div>
      <div class="title-center">
        <slot name="title-center"></slot>
      </div>
      <div class="title-suffix">
        <slot name="title-suffix"></slot>
      </div>
    </div>
    <div class="content">
      <slot name="content"></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Prop, Component } from 'vue-property-decorator'

@Component
export default class BaseCardFrame extends Vue {
  @Prop({ default: ''}) private title!: string

}
</script>

<style lang="scss" scoped>
.base-card-frame {
  height: 100%;

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 48px;
    padding: 0 16px;
    font-size: 14px;
    line-height: 20px;
  }

  .content {
    width: auto;
    padding: 15px 20px;
  }
}
</style>

<style lang="scss" scoped>
@import "~@mcdex/style/common/var";
.dex-theme-dark {
  .base-card-frame {
    background: var(--mc-background-color);

    .head {
      color: var(--mc-text-color);
      background-color: rgba($--mc-background-color-dark, 0.5);
    }

    .content {
      background: var(--mc-background-color);
    }
  }
}
</style>

<style lang="scss" scoped>
@import "~@mcdex/style/common/fantasy-var";
.satori-fantasy {
  .base-card-frame {
    background: var(--mc-background-color-darkest);

    .head {
      color: var(--mc-text-color-white);
      border-bottom: 1px solid #1A2136;
    }

    .content {
    }
  }
}
</style>
