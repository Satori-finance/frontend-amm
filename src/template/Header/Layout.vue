<template>
  <span class="layout">
    <el-popover
      placement="bottom"
      popper-class="layout-popper fantasy"
      :visible-arrow="false"
      trigger="click">
      <div class="layout-theme-box popover-content">
        <div class="theme-box">
          <!-- <h4 class="title">{{ $t('header.theme') }}</h4>-->
          <span class="title">{{ $t('header.layout') }}</span>
          <el-button plain class="default-layout" @click="defaultLayout" size="mini">{{
              $t('header.defaultLayout')
            }}</el-button>
        </div>

      <ul class="checkout-group">
        <el-checkbox-group v-model="gridItemsModel">
          <li
            :class="['line-item', gridItemsModel.includes(item.value)?'':'item-unselected']"
            v-for="(item, index) in layoutOptions"
            :key="index"
          >
            <el-checkbox :label="item.value" :checked="gridItemsModel.includes(item.value)">
              {{ item.label }}
            </el-checkbox>
          </li>
        </el-checkbox-group>
      </ul>
      </div>
      <img class="icon" slot="reference"
           :src="require(`@/assets/img/dark/header_layout${mouseHover ? '_hover' : ''}.svg`)"
           alt="">
    </el-popover>
  </span>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { Layout as PreferenceLayout } from '@/type'

const preference = namespace('preference')

@Component
export default class Layout extends Vue {
  @preference.State('layout') layout!: PreferenceLayout
  @preference.Mutation('resetLayout') resetLayout !: Function
  @preference.Mutation('changeLayoutItems') changeLayoutItems !: Function

  private mouseHover: boolean = false

  get gridItems() {
    return this.layout.tiles.map(x => x.i)
  }

  get gridItemsModel() {
    return this.layout.tiles.map(x => x.i)
  }

  set gridItemsModel(items: string[] | boolean) {
    if (items instanceof Array) {
      this.changeLayoutItems(items)
    }
  }

  get layoutOptions() {
    return [
      { label: this.$t('AMMDepth'), value: 'AMMDepth' },
      { label: this.$t('priceChart'), value: 'charts' },
      // { label: this.$t('recentTrades'), value: 'recentTrades' },
      { label: this.$t('positionsOrders'), value: 'positionsAndOrders' },
    ]
  }

  defaultLayout() {
    this.resetLayout()
  }
}
</script>

<style lang="scss">
.layout-popper.el-popper[x-placement^=bottom] {
  margin-top: 8px;
}
</style>

<style lang="scss" scoped>
.layout {
  .icon {
    vertical-align: middle;
  }

  ::v-deep {
    .el-popover__reference-wrapper {
      display: flex;
      align-items: center;
    }
  }
}

.layout-theme-box {
  padding: 16px;
  width: 222px;

  .theme-box {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .title {
      font-size: 16px;
    }

    .default-layout {
      border-radius: 8px;
      height: 24px;
    }
  }

  .checkout-group {
    margin-top: 16px;

    .line-item {
      height: 20px;
      display: flex;
      align-items: center;

      &:not(:first-of-type) {
        margin-top: 12px;
      }
    }
  }
}
</style>

<style lang="scss" scoped>
.dex-theme-dark {
  .layout {
  }

  .layout-theme-box {
    .theme-box {
      .title {
        color: var(--mc-text-color-white);
      }
    }

    button {
      color: var(--mc-text-color);
    }

    .item-unselected {
      .el-checkbox {
        ::v-deep .el-checkbox__label {
          color: var(--mc-text-color);
        }
      }
    }
  }
}
</style>

<style lang="scss" scoped>
.satori-fantasy {
  .layout-theme-box {
    .theme-box {
      .title {
        color: var(--mc-text-color-white);
      }
    }

    .item-unselected {
      .el-checkbox {
        ::v-deep .el-checkbox__label {
          color: var(--mc-text-color);
        }
      }
    }
  }
}
</style>
