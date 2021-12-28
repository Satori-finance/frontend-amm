import { Component, Prop, Vue } from 'vue-property-decorator'
import { McbCrowdsaleAccountStorage, McbCrowdsaleStorage } from '@/utils/SATORICrowdsale/type'
import { _0 } from '@mcdex/mai3.js'

@Component
export default class SubscriptionInfoMixin extends Vue {
  @Prop({ default: () => null }) mcbCrowdsaleAccountStorage!: McbCrowdsaleAccountStorage | null
  @Prop({ default: () => null }) mcbCrowdsaleStorage!: McbCrowdsaleStorage | null

  get isSubscribable() {
    return !!this.mcbCrowdsaleStorage?.isSubscribable
  }

  get subscriptionAmount() {
    return this.mcbCrowdsaleAccountStorage?.subscriptionAmount || _0
  }

  get allocation() {
    return this.mcbCrowdsaleAccountStorage?.allocation || _0
  }

  get cost() {
    return this.mcbCrowdsaleAccountStorage?.cost || _0
  }

  get stakedSATORI() {
    return !this.mcbCrowdsaleAccountStorage || this.mcbCrowdsaleAccountStorage.isAccountSettled ? _0 : this.mcbCrowdsaleAccountStorage.stakedSATORI
  }

  get stakedUSDC() {
    return !this.mcbCrowdsaleAccountStorage || this.mcbCrowdsaleAccountStorage.isAccountSettled ? _0 : this.mcbCrowdsaleAccountStorage.stakedUSDC
  }
}
