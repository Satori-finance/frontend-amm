import Vue from 'vue'
import { Component, Watch } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { VUE_EVENT_BUS, AUTH_EVENT } from '@/event'

const auth = namespace('auth')
const wallet = namespace('wallet')

/**
 * use once on global
 */
@Component
export class AuthSingletonMixin extends Vue {
  @wallet.Getter('address') address!: string | null
  @auth.Mutation('loadAuthData') loadAuthData!: Function
  @auth.Mutation('clearAuthData') clearAuthData!: Function

  mounted() {
    VUE_EVENT_BUS.on(AUTH_EVENT.CLEAR, this.doClearAuthData)
  }

  destroyed() {
    VUE_EVENT_BUS.off(AUTH_EVENT.CLEAR, this.doClearAuthData)
  }

  private doClearAuthData() {
    if (this.address) {
      this.clearAuthData({ address: this.address })
    }
  }

  @Watch('address', { immediate: true })
  private async onAddressChangeToLoadAuthData() {
    if (this.address) {
      this.loadAuthData({ address: this.address })
    }
  }
}
