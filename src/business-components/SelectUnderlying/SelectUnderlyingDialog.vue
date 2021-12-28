<template>
  <div>
    <el-dialog
      :title="$t('newContract.underlyingAsset')"
      append-to-body
      top="0"
      custom-class="mini-round-dialog"
      class="select-underlying-dialog"
      :close-on-click-modal="false"
      :visible.sync="currentVisible"
    >
      <div class="tabs">
        <McTabs :tabs="tabs" v-model="selectedTab" style-type="round"></McTabs>
      </div>
      <div class="search-box">
        <el-input class="search-input" v-model="searchKey" :placeholder="$t('selectToken.searchPlaceholder')" clearable>
          <template #prefix>
            <i class="iconfont icon-search-bold"></i>
          </template>
        </el-input>
      </div>
      <div class="list">
        <template v-if="selectedTab === 'token'">
          <McTokenSelector
            v-model="currentSelectedToken"
            :provider="provider"
            :tokens="chainAllTokenList"
            :search-key="searchKey"
            :network-id="networkId"/>
        </template>
        <template v-else>
          <div class="indexes">
            <div class="index-item selected" v-if="selectedIndex">
              <el-image :src="selectedIndex | tokenIconUrlFormatter">
                <div slot="error" class="image-slot">
                  <img src="@/assets/img/tokens/Unknow.svg" alt="">
                </div>
              </el-image>
              <div class="label">{{ selectedIndex }}</div>
            </div>
            <div class="index-item" v-if='indexItems.length > 0' v-for="item in indexItems" :key="item"
                 @click="selectIndex(item)">
              <el-image :src="item | tokenIconUrlFormatter">
                <div slot="error" class="image-slot">
                  <img src="@/assets/img/tokens/Unknow.svg" alt="">
                </div>
              </el-image>
              <div class="label">{{ item }}</div>
            </div>
            <McNoData v-if='indexItems.length === 0'/>
          </div>
        </template>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { McTabs, McTokenSelector, McNoData } from '@/components'
import { namespace } from 'vuex-class'
import { IndexUnderlying, TokenInfoItem, TokenUnderlying, UnderlyingInfo, UnderlyingType } from '@/type'
import { TARGET_NETWORK_ID } from '@/constants'
import { searchRegisteredAssets } from '@/config/oracle'
import { Provider } from '@ethersproject/providers'

const token = namespace('token')
const wallet = namespace('wallet')

@Component({
  components: {
    McTabs,
    McTokenSelector,
    McNoData,
  },
})
export default class SelectUnderlyingDialog extends Vue {
  @Prop({ default: false }) visible!: boolean
  @Prop({ default: null }) value!: UnderlyingInfo | null

  @token.Getter('chainAllTokenList') chainAllTokenList!: TokenInfoItem[]
  @wallet.Getter('provider') provider!: Provider

  private tabs = [
    {
      label: this.$t('base.index'),
      value: 'index',
    },
    {
      label: this.$t('base.token'),
      value: 'token',
    },
  ]
  private selectedTab: 'index' | 'token' = 'index'
  private searchKey = ''
  private networkId = TARGET_NETWORK_ID
  private selectedToken: TokenInfoItem | null = null
  private selectedIndex = ''

  get currentVisible() {
    return this.visible
  }

  set currentVisible(val: boolean) {
    this.$emit('update:visible', val)
  }

  get currentSelectedToken() {
    return this.selectedToken
  }

  set currentSelectedToken(val: TokenInfoItem | null) {
    this.selectedToken = val
    this.$emit('input', { type: UnderlyingType.Token, info: this.selectedToken } as TokenUnderlying)
    this.currentVisible = false
  }

  get indexItems() {
    return searchRegisteredAssets(this.searchKey).filter(a => a !== this.selectedIndex)
  }

  private selectIndex(item: string) {
    this.selectedIndex = item
    this.$emit('input', { type: UnderlyingType.Index, info: this.selectedIndex } as IndexUnderlying)
    this.currentVisible = false
  }

  @Watch('value', { immediate: true })
  private onValueChange() {
    this.selectedTab = this.value && this.value.type === UnderlyingType.Token ? 'token' : 'index'
    this.selectedToken = this.value && this.value.type === UnderlyingType.Token ? this.value.info : null
    this.selectedIndex = this.value && this.value.type === UnderlyingType.Index ? this.value.info : ''
  }
}
</script>

<style lang="scss" scoped>
.select-underlying-dialog {
  ::v-deep .el-dialog {
    padding-left: 0;
    padding-right: 0;
    width: 400px;

    .el-dialog__header {
      margin-left: 16px;
      margin-right: 16px;
    }
  }
}
</style>

<style lang="scss" scoped>
.select-underlying-dialog {
  .tabs {
    margin: 0 16px;
  }

  .search-box {
    margin: 16px 16px 0;

    .search-input {
      height: 56px;
      border: 1px solid var(--mc-border-color);
      background: var(--mc-background-color);
      border-radius: var(--mc-border-radius-l);
      padding: 0 16px;
      font-size: 16px;

      ::v-deep {
        .el-input__inner {
          height: 56px;
          line-height: 56px;

          &::placeholder {
            color: var(--mc-text-color-dark);
          }
        }
      }
    }
  }

  .list {
    margin-top: 16px;

    .mc-token-selector {
      height: 280px;
    }

    .indexes {
      max-height: 280px;
      overflow-y: auto;

      .index-item {
        display: flex;
        align-items: center;
        height: 56px;
        padding: 0 16px;
        cursor: pointer;

        &.selected {
          opacity: 0.5;
        }

        &:not(.selected):hover {
          background-color: var(--mc-background-color-light);
        }

        .icon {
          height: 24px;
          width: 24px;
          border: 2px solid var(--mc-text-color);
          color: var(--mc-text-color);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
        }

        .el-image {
          height: 24px;
          width: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;

          ::v-deep .image-slot {
            height: 24px;
            width: 24px;
            img {
              height: 100%;
              width: 100%;
            }
          }
        }
      }
    }
  }
}
</style>

