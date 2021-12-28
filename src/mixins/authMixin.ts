import { Component, Mixins, Watch } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { getJWT } from '@/api/jwt'
import { Wallet } from '@/business-components/wallet/wallet-connector'
import { cancelable, CancelablePromiseType } from 'cancelable-promise'
import { ErrorHandlerMixin } from './errorHandlerMixin'
import { RelayerApiError } from '@/type'

const wallet = namespace('wallet')
const auth = namespace('auth')

@Component
export class AuthMixin extends Mixins(ErrorHandlerMixin) {
  @wallet.State('wallet') wallet!: Wallet | null
  @auth.Mutation('setAndSaveAuthData') setAndSaveAuthData!: Function
  @wallet.Getter('address') address!: string | null
  @auth.State('jwt') jwt!: string
  @auth.Getter('isValidateFunc') isValidateFunc!: () => boolean
  @wallet.Getter('isWrongNetwork') isWrongNetwork!: boolean

  status: 'pending' | 'success' | 'error' = 'pending'
  visible: boolean = false
  authPromise: CancelablePromiseType<any> | null = null
  loading: boolean = false
  error: Error | null = null

  async handleAuth() {
    this.visible = true
    this.loading = true
    try {
      this.authPromise = cancelable(this.auth())
      await this.authPromise
      this.status = 'success'
      this.visible = false
    } catch (e) {
      this.status = 'error'
    } finally {
      this.loading = false
    }
  }

  cancel() {
    if (this.authPromise) {
      this.authPromise.cancel()
    }
    this.visible = false
  }

  async auth() {
    if (!this.wallet || !this.address) {
      return
    }
    const currentTime = new Date().toISOString()
    this.status = 'pending'

    const message = this.$t('wallet.authMessage', {
      currentTime: currentTime,
    }).toString()
    let sign = ''
    try {
      sign = await this.wallet.signMessage(message)
    } catch (e) {
      this.error = e
      return
    }

    const jwt = await this.callRelayerServerApiReadFunc(async () => {
      if (!this.address) {
        return null
      }
      try {
        const result = await getJWT(this.address, message, sign)
        this.error = null
        return result
      } catch (e) {
        if (e instanceof RelayerApiError) {
          this.error = new Error(this.$t(e.helpKey).toString())
        } else {
          this.error = e
        }
        throw e
      }
    })
    if (jwt) {
      this.setAndSaveAuthData({
        jwt: jwt.jwt,
        expires: jwt.expires,
        address: this.address,
      })
    } else {
      throw new Error('jwt failed')
    }
  }

  @Watch('address')
  onAddressChange() {
    this.error = null
  }
}
