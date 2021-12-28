import { Component, Vue, Watch } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { Provider } from '@ethersproject/providers'

import { VUE_EVENT_BUS, ERROR_EVENTS, FAUCET_EVENT } from '@/event'
import { RelayerServerAPIClient } from '@/api/client'
import { MCError } from '@/type'
import { ACCOUNT_EVENT } from '@/event'
import { NETWORK_ENV } from '@/constants'

export const BASE_URL = NETWORK_ENV.FAUCET_API_URL || ''

const wallet = namespace('wallet')

export class FaucetError extends Error implements MCError {
  helpCaptionKey: string = 'errors.captionError'
  helpKey: string = 'errors.faucet'
}

const faucetAPIClient = new RelayerServerAPIClient(BASE_URL)

@Component
export class FaucetMixin extends Vue {
  @wallet.Getter('address') address!: string | null
  @wallet.Getter('provider') provider!: Provider | null

  private isCalling = false

  @Watch('address', { immediate: true })
  async sendFaucet() {
    if (!BASE_URL) {
      return
    }
    if (!this.address || !this.provider) {
      console.warn('faucet: no address or provider')
      return
    }

    if (this.isCalling) {
      return
    }
    this.isCalling = true
    try {
      let tx: string
      const r = (await faucetAPIClient.request({
        url: '/faucet',
        method: 'POST',
        data: {
          to: this.address,
        },
      })) as any

      tx = r.data && r.data.transactionHash

      if (!tx) {
        console.warn('faucet: bad response', r)
        throw new Error(`bad faucet result, no trasaction hash`)
      }

      VUE_EVENT_BUS.emit(FAUCET_EVENT.START)
      const transaction = this.provider.waitForTransaction(tx)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.faucet').toString(),
        transactionHash: tx,
      })
      await transaction
      VUE_EVENT_BUS.emit(FAUCET_EVENT.END)
      VUE_EVENT_BUS.emit(ACCOUNT_EVENT.REFRESH_USER_DATA)
    } catch (e) {
      if (e.status === -100) {
        console.log(`faucet: already sent: ${this.address} `)
        return
      } else {
        console.warn('faucet error', e)
        VUE_EVENT_BUS.emit(ERROR_EVENTS.ShowMcError, new FaucetError(e.message))
      }
    } finally {
      this.isCalling = false
    }
  }

  bindFaucetEvent() {}
}
