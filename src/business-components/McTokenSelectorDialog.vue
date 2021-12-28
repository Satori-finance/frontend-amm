<template>
  <div>
    <el-dialog
      append-to-body
      top="0"
      custom-class="mini-round-dialog"
      class="token-selector-dialog"
      :close-on-click-modal="false"
      :visible.sync="currentVisible"
      @open="onOpen"
    >
      <template #title>
        <div class="token-selector-dialog-title">
          <div class="left"><i class="iconfont icon-left" @click="currentVisible = false"></i></div>
          <span class="title">{{ title === '' ? $t('selectToken.title') : title }}</span>
          <div class="right"></div>
        </div>
      </template>
      <div class="search-box">
        <el-input class="search-input" v-model="searchKey" :placeholder="$t('selectToken.searchPlaceholder')" clearable>
          <template #prefix>
            <i class="iconfont icon-search-bold"></i>
          </template>
        </el-input>
      </div>
      <div class="list">
        <McTokenSelector
          v-model="currentSelectedToken"
          :provider="provider"
          :tokens="tokenList"
          :search-key="searchKey"
          :network-id="networkId"/>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { McTokenSelector } from '@/components'
import { namespace } from 'vuex-class'
import { TokenInfoItem } from '@/type'
import { TARGET_NETWORK_ID } from '@/constants'
import { Provider } from '@ethersproject/providers'

const token = namespace('token')
const wallet = namespace('wallet')

@Component({
  components: {
    McTokenSelector,
  },
})
export default class McTokenSelectorDialog extends Vue {
  @Prop({ default: false }) visible!: boolean
  @Prop({ default: () => null }) value!: TokenInfoItem | null
  @Prop({ default: () => [] }) tokenList!: TokenInfoItem[]
  @Prop({ default: '' }) title!: string

  @wallet.Getter('provider') provider!: Provider

  private searchKey = ''
  private networkId = TARGET_NETWORK_ID
  private selectedToken: TokenInfoItem | null = null

  get currentVisible() {
    return this.visible
  }

  set currentVisible(val: boolean) {
    this.$emit('update:visible', val)
  }

  get currentSelectedToken(): TokenInfoItem | null {
    return this.selectedToken
  }

  set currentSelectedToken(val: TokenInfoItem | null) {
    this.selectedToken = val
    this.$emit('input', this.selectedToken)
    this.currentVisible = false
    this.$emit('close')
  }

  private onOpen() {
    this.searchKey = ''
  }

  @Watch('value', { immediate: true })
  private onValueChange() {
    this.selectedToken = this.value
  }
}
</script>

<style lang="scss" scoped>
.token-selector-dialog {
  ::v-deep .el-dialog {
    width: 400px;
    padding-left: 0;
    padding-right: 0;
    min-height: auto;

    .el-dialog__header {
      margin-left: 16px;
      margin-right: 16px;
    }
  }
}
</style>

<style lang="scss" scoped>
.token-selector-dialog {
  .token-selector-dialog-title {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .left, .right {
      flex: 1;
      .iconfont {
        cursor: pointer;
      }
    }
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
      max-height: 280px;
      height: 280px;
    }
  }
}
</style>

