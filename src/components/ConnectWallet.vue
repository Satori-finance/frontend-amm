<template>
  <el-button size="small" type="primary" @click="showConnectWalletDialog()">{{buttonText}}</el-button>
</template>

<script lang="ts">
import {Vue, Component, Prop} from 'vue-property-decorator'
import { VUE_EVENT_BUS, WALLET_EVENT } from '@/event'

@Component
export default class ConnectWallet extends Vue {
  @Prop({default:'Connect Wallet'})  buttonText!: string

  private showConnectWalletDialog() {
    VUE_EVENT_BUS.emit(WALLET_EVENT.ShowConnectWallet)
  }
}
</script>

<style lang="scss" scoped>

</style>
