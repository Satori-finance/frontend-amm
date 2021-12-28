<template>
  <transition name="fade">
    <el-dialog
      custom-class="is-small is-round select-wallet-dialog"
      append-to-body
      top="0"
      :visible.sync="currentVisible"
      :title="$t('connectWallet.caption')">
      <SelectWallet @input="onSelectWallet"/>
    </el-dialog>
  </transition>
</template>

<script lang='ts'>
import { Component, Prop, Vue } from 'vue-property-decorator'
import { SUPPORTED_WALLET } from './wallet-connector'
import SelectWallet from './SelectWallet.vue'

@Component({
  components: {
    SelectWallet,
  },
})
export default class SelectWalletDialog extends Vue {
  @Prop({ default: true }) visible!: boolean

  get currentVisible() {
    return this.visible
  }

  set currentVisible(val: boolean) {
    this.$emit('update:visible', val)
  }

  private onSelectWallet(walletType: SUPPORTED_WALLET) {
    this.$emit('onSelectWallet', walletType)
  }
}
</script>

<style lang="scss">
.select-wallet-dialog {
  width: 400px;
}
</style>
