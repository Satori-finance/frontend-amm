import { Component, Mixins, Watch } from 'vue-property-decorator'
import { DAO_GOVERNOR_VOTES_DECIMALS, SATORI_ADDRESS, SUPPORTED_NETWORK_ID, TARGET_NETWORK_ID } from '@/constants'
import { DaoActionData } from './Actions/types'
import BigNumber from 'bignumber.js'
import { namespace } from 'vuex-class'
import { DaoProposalIpfsStoreData, DaoProposalMixin } from './daoProposalMixin'
import { Provider } from '@ethersproject/providers'
import { balanceOf, DECIMALS, getERC20Contract, normalizeBigNumberish } from '@mcdex/mai3.js'
import {
  CHAIN_ID_TO_DAO_GOVERNOR_ADDRESS,
  CHAIN_ID_TO_DAO_XMCB_ADDRESS,
  
  DAO_UNSTAKE_TOKEN_SYMBOL,
  getDaoGovernorContract,
  getXmcbContract,
} from '@mcdex/mcdex-governance.js'
import { ethers } from 'ethers'
import { uploadDataToIPFS } from '@/api/ipfs'
import { checkAccountHasActiveProposal } from './lowLevelDaoProposal'
import { StepStatus } from '@/components/Steps/type'
import { waitTransaction } from '@/utils/transaction'

const wallet = namespace('wallet')

@Component
export default class CreateDaoProposalMixin extends Mixins(DaoProposalMixin) {
  @wallet.Getter('provider') provider !: Provider
  @wallet.Getter('isConnectedWallet') isConnectedWallet !: boolean
  @wallet.Getter('providerL1') providerL1 !: Provider
  @wallet.Getter('signer') signer !: ethers.Signer
  @wallet.Getter('address') accountAddress !: string

  votesDecimals = DAO_GOVERNOR_VOTES_DECIMALS
  daoUnstakeTokenSymbol: string = DAO_UNSTAKE_TOKEN_SYMBOL

  protected ipfsHash: string = ''
  protected repeatedActionsIndex: number[] = []

  protected created: boolean = false

  protected actions: Array<DaoActionData> = []
  protected actionsValidatorState: boolean = false
  protected accountHasActiveProposal: boolean = false
  private accountVotes: BigNumber = new BigNumber(0)

  protected accountxMcbBalance: BigNumber = new BigNumber(0)
  protected proposalThresholdValue: BigNumber = new BigNumber(0)

  protected createBaseForm = {
    title: '',
    overview: '',
    forumLink: '',
  }

  get invalidTitle(): boolean {
    // return this.createBaseForm.title === ''
    return false
  }

  get invalidOverview(): boolean {
    // return this.createBaseForm.overview === ''
    return false
  }

  get invalidForumLink(): boolean {
    if (this.createBaseForm.forumLink === '') {
      return false
    }
    return !this.isMcdexForumLink(this.createBaseForm.forumLink)
  }

  get userVoteReachThreshold(): boolean {
    if (this.proposalThresholdValue.isZero() || this.accountVotes.isZero()) {
      return false
    }
    return this.accountVotes.gte(this.proposalThresholdValue)
  }

  get createButtonIsDisabled(): boolean {
    if (this.isWrongNetwork || !this.accountAddress || this.accountAddress === '') {
      return true
    }
    return !this.actionsValidatorState || this.invalidTitle
      || this.invalidOverview || this.invalidForumLink || this.actions.length === 0
      || this.accountHasActiveProposal || !this.userVoteReachThreshold || this.created
  }

  isMcdexForumLink(url: string): boolean {
    const expression = /http(s)?:\/\/forum\.mcdex\.io\/*/
    const regObject = new RegExp(expression)
    return regObject.test(url)
  }

  updateActions(data: Array<DaoActionData>) {
    this.actions = data
    this.repeatedActionsIndex = []
  }

  updateActionsState(state: boolean) {
    this.actionsValidatorState = state
    this.repeatedActionsIndex = []
  }

  @Watch('provider', { immediate: true })
  async onProviderToUpdateData() {
    if (!this.provider) {
      return
    }

    await this.callChainReadFunc(async () => {
      const governorContract = getDaoGovernorContract(CHAIN_ID_TO_DAO_GOVERNOR_ADDRESS[TARGET_NETWORK_ID], this.provider)
      this.proposalThresholdValue = normalizeBigNumberish(await governorContract.proposalThreshold()).shiftedBy(-DECIMALS)
    })
  }

  @Watch('provider', { immediate: true })
  @Watch('accountAddress', { immediate: true })
  async onDataChangeUpdateMyVotes() {
    if (!this.provider || !this.accountAddress || this.accountAddress === '') {
      return
    }
    const xmcbAddress = TARGET_NETWORK_ID === SUPPORTED_NETWORK_ID.BSC ? SATORI_ADDRESS : CHAIN_ID_TO_DAO_XMCB_ADDRESS[TARGET_NETWORK_ID] // todo delete

    await this.callChainReadFunc(async () => {
      const xMcbContract = getXmcbContract(xmcbAddress, this.provider)
      const xMcbErc20Contract = getERC20Contract(xmcbAddress, this.provider)
      this.accountVotes = normalizeBigNumberish(await xMcbContract.getCurrentVotes(this.accountAddress)).shiftedBy(-DECIMALS)
      this.accountxMcbBalance = await balanceOf(xMcbErc20Contract, this.accountAddress, DECIMALS)
      this.accountHasActiveProposal = await checkAccountHasActiveProposal(CHAIN_ID_TO_DAO_GOVERNOR_ADDRESS[TARGET_NETWORK_ID], this.accountAddress, this.provider)
    })
  }

  verifyProposalAction() {
      const builderActionsDatas = this.buildActions(this.actions)
      this.repeatedActionsIndex = this.checkActionsRepeatIndex(builderActionsDatas)
      if (this.repeatedActionsIndex.length) {
        throw Error('repeat action')
      }
  }

  async uploadToIpfs(): Promise<string | null> {
    this.ipfsHash = ''
    if (!this.signer) {
      throw Error('invalid signer')
    }
    try {
      const ipfsKey = `mcdex-dao-proposal-${Date.now()}`
      const ipfsData: DaoProposalIpfsStoreData = {
        title: this.createBaseForm.title,
        overview: this.createBaseForm.overview,
        forumLink: this.createBaseForm.forumLink,
      }
      return await uploadDataToIPFS(ipfsData, ipfsKey)
    } catch (e) {
      throw e
    }
  }

  async onCreateProposal(
    onTransactionSucceed: () => void
  ) {
    if (!this.signer || this.ipfsHash === '') {
      throw Error('invalid signer or ipfsHash')
    }
    try {
      const builderActionsDatas = this.buildActions(this.actions)
      const description = this.buildDescription({
        title: this.createBaseForm.title,
        forumLink: this.createBaseForm.forumLink,
        ipfsHash: this.ipfsHash,
      })
      let targets: string[] = []
      let values: string[] = []
      let signatures: string[] = []
      let calldatas: string[] = []
      builderActionsDatas.forEach((item) => {
        targets.push(...item.targets)
        values.push(...item.values)
        signatures.push(...item.signatures)
        calldatas.push(...item.calldatas)
      })
      const governorContract = getDaoGovernorContract(CHAIN_ID_TO_DAO_GOVERNOR_ADDRESS[TARGET_NETWORK_ID], this.signer)
      const transaction = await governorContract.propose(targets, values, signatures, calldatas, description)
      const transactionResult = waitTransaction(transaction)
      this.$transaction({
        location: 'top',
        transaction: transactionResult,
        content: this.$t('transaction.createProposal').toString(),
        transactionHash: transaction.hash ? transaction.hash : '',
      })
      const txResult = await transactionResult
      this.created = true
      onTransactionSucceed()
      return txResult

    } catch (e) {
      console.error("create dao proposal fail, ", e)
      throw e
    }
  }

  async uploadToIpfsActon() {
    const hash = await this.uploadToIpfs()
    this.ipfsHash = hash || ''
  }

  async createProposalAction() {
    await this.callChainFunc(() => {
      return this.onCreateProposal(() => {
        this.$router.push({ name: 'daoMain' })
      })
    }, undefined, true)
  }
}
