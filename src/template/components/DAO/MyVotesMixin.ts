import { Component, Mixins, Watch } from 'vue-property-decorator'
import BigNumber from 'bignumber.js'
import { ErrorHandlerMixin } from '@/mixins'
import { namespace } from 'vuex-class'
import { Provider } from '@ethersproject/providers'
import { DAO_GOVERNOR_VOTES_DECIMALS, SATORI_ADDRESS, SUPPORTED_NETWORK_ID, TARGET_NETWORK_ID } from '@/constants'
import { _0, DECIMALS, normalizeBigNumberish } from '@mcdex/mai3.js'
import { getXmcbContract, CHAIN_ID_TO_DAO_XMCB_ADDRESS } from '@mcdex/mcdex-governance.js'
import { queryDaoVoteDelegateInfo } from '@/api/daoGovernor'
import _ from 'lodash'
import { DAO_GOVERNANCE_EVENT, VUE_EVENT_BUS } from '@/event'

const wallet = namespace('wallet')

@Component
export default class MyVotesInfoMixin extends Mixins(ErrorHandlerMixin) {
  @wallet.Getter('provider') provider !: Provider
  @wallet.Getter('address') userAddress !: string
  private xmcbBalanceOf: BigNumber = new BigNumber(0)
  private delegateToMeCount: number = 0
  private delegateToAddress: string = ''
  private userCurrentVotes: BigNumber = new BigNumber(0)

  votesDecimals = DAO_GOVERNOR_VOTES_DECIMALS

  mounted() {
    VUE_EVENT_BUS.on(DAO_GOVERNANCE_EVENT.UpdateMyVotes, () => {
      this.updateUserData()
    })
  }

  destroyed() {
    VUE_EVENT_BUS.off(DAO_GOVERNANCE_EVENT.UpdateMyVotes)
  }

  get hasDelegateUser(): boolean {
    if (!this.userAddress || this.userAddress === '' || this.delegateToAddress === ''
      || this.delegateToAddress === this.userAddress.toLowerCase()) {
      return false
    }
    return true
  }

  get myVotes(): BigNumber {
    return this.userCurrentVotes
  }

  get proxyVotes(): BigNumber {
    if (this.userCurrentVotes.isZero()) {
      return _0
    }
    return this.userCurrentVotes.minus(this.xmcbBalanceOf)
  }

  getDataFunc = _.debounce(async () => {
    await this.updateUserData()
  }, 200)

  async updateUserData() {
    if (!this.provider || this.userAddress === '') {
      return
    }
    await this.callChainReadFunc(async () => {
      const xmcbAddress = TARGET_NETWORK_ID === SUPPORTED_NETWORK_ID.BSC ? SATORI_ADDRESS : CHAIN_ID_TO_DAO_XMCB_ADDRESS[TARGET_NETWORK_ID] // todo delete

      const xSATORIContract = getXmcbContract(xmcbAddress, this.provider)
      if (!this.userAddress || this.userAddress === '') {
        return
      }
      // xSATORIContract.getPriorVotes()
      this.userCurrentVotes = normalizeBigNumberish(await xSATORIContract.getCurrentVotes(this.userAddress)).shiftedBy(-DECIMALS)
      this.xmcbBalanceOf = normalizeBigNumberish(await xSATORIContract.rawBalanceOf(this.userAddress)).shiftedBy(-DECIMALS)
      this.delegateToAddress = (await xSATORIContract.getDelegate(this.userAddress)).toLowerCase()
    })
    await this.callGraphApiFunc(async () => {
      if (!this.userAddress || this.userAddress === '') {
        return
      }
      const result = await queryDaoVoteDelegateInfo(this.userAddress)
      if (!result || result.delegates.length === 0) {
        this.delegateToMeCount = 0
        return
      }
      const delegates = result.delegates
      const delegateInfo = delegates[0]
      if (delegateInfo && delegateInfo.delegators) {
        this.delegateToMeCount = delegateInfo.delegators.length
        for (let i = 0; i < delegateInfo.delegators.length; i++) {
          const userItem = delegateInfo.delegators[i]
          if (userItem.id.toLowerCase() === this.userAddress.toLowerCase()) {
            this.delegateToMeCount -= 1
          }
        }
      }
    })
  }

  @Watch('provider', { immediate: true })
  @Watch('userAddress', { immediate: true })
  onProviderChangedUpdateData() {
    if (!this.provider || this.userAddress === '') {
      return
    }
    this.getDataFunc()
  }
}
