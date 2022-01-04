import { Component, Vue, Watch } from 'vue-property-decorator'
import {
  approveToken,
  DECIMALS,
  getERC20Contract,
} from '@mcdex/mai3.js'
import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'
import { namespace } from 'vuex-class'
import { getGasStationTxParams } from '@/utils/gasPrice'
import { gasLimitConfig } from '@/config/gas'
import { InvalidArgumentError, TokenBalanceDirectoryItem } from '@/type'
import { formatBigNumberByPrecision } from '@/utils'
import {
  ALLOWANCE_AMOUNT,
  L1_NETWORK_ID,
  NETWORK_ID_TO_ARB_BRIDGE_ADDRESS,
  NETWORK_ID_TO_ARB_TOKEN_BRIDGE_ADDRESS,
  SUPPORTED_NETWORK_ID,
  TARGET_NETWORK_ID,
} from '@/const'
import { Provider } from '@ethersproject/providers'
import { currentChainConfig } from '@/config/chain'
import { Bridge } from 'arb-ts'
import AsyncComputed from '@romancow/vue-async-computed-decorator'
import { waitTransaction } from '@/utils/transaction'

const wallet = namespace('wallet')
const account = namespace('account')

@Component
export class TransferL1BetweenL2Mixin extends Vue {
  @wallet.Getter('signer') signer!: ethers.Signer | null
  @wallet.Getter('signerL1') signerL1!: ethers.Signer
  @wallet.Getter('signerL2') signerL2!: ethers.Signer
  @wallet.Getter('provider') provider!: Provider
  @wallet.Getter('providerL1') providerL1!: Provider
  @wallet.Getter('isL2') isL2!: boolean
  @wallet.Getter('isL1') isL1!: boolean
  @wallet.Getter('address') address!: string | null
  @account.Getter('tokenBalanceFunc') tokenBalanceFunc!: (tokenAddress: string, networkId?: SUPPORTED_NETWORK_ID) => TokenBalanceDirectoryItem | null
  @wallet.Action('updateNativeTokenBalance') updateNativeTokenBalance!: () => Promise<void>
  @account.Action('updateTokenBalance') updateTokenBalance!: (params: { tokenAddress: string, networkId?: SUPPORTED_NETWORK_ID }) => Promise<void>
  @account.Action('updateAllowance') updateAllowance!: (params: { tokenAddress: string; spenderAddress: string, networkId?: SUPPORTED_NETWORK_ID }) => Promise<void>
  @account.Getter('allowanceFunc') allowanceFunc!: (tokenAddress: string, spenderAddress: string, networkId?: SUPPORTED_NETWORK_ID) => BigNumber

  approving: boolean = false
  transferringL1ToL2: boolean = false
  transferringL2ToL1: boolean = false
  loading: boolean = false
  claiming: boolean = false
  l1TokenAddress: string = ''
  l2TokenAddress: string = ''
  gatewayAddress: string = ''
  bridge: Promise<Bridge | null> = Promise.resolve(null)

  get validTokenPair() {
    return (this.l1TokenAddress && this.l2TokenAddress) || (!this.l1TokenAddress && !this.l2TokenAddress)
  }

  get l1BridgeAddress() {
    if (typeof NETWORK_ID_TO_ARB_BRIDGE_ADDRESS[TARGET_NETWORK_ID] === 'undefined') {
      console.error(new InvalidArgumentError('target network does not support L2Inbox'))
      return null
    }
    return NETWORK_ID_TO_ARB_BRIDGE_ADDRESS[TARGET_NETWORK_ID] || null
  }

  get l2BridgeAddress() {
    if (typeof NETWORK_ID_TO_ARB_TOKEN_BRIDGE_ADDRESS[TARGET_NETWORK_ID] === 'undefined') {
      console.error(new InvalidArgumentError('target network does not support arb token bridge'))
      return null
    }
    return NETWORK_ID_TO_ARB_TOKEN_BRIDGE_ADDRESS[TARGET_NETWORK_ID] || null
  }

  @Watch('signerL1')
  @Watch('signerL2')
  initBridge() {
    if (!this.l2BridgeAddress || !this.l1BridgeAddress) {
      this.bridge = Promise.resolve(null)
    }
    this.bridge = Bridge.init(this.signerL1, this.signerL2, this.l1BridgeAddress!, this.l2BridgeAddress!)
  }

  async approve(
    tokenAddress: string,
    onTransactionSuccess: () => void = () => {
    },
  ): Promise<ethers.providers.TransactionReceipt | undefined> {
    const bridge = await this.bridge
    if (!this.l1BridgeAddress || !this.isL1 || !bridge || !this.signer) {
      return
    }
    const token = this.tokenBalanceFunc(tokenAddress, L1_NETWORK_ID)
    if (!token) {
      return
    }
    this.approving = true
    try {
      const gas = await getGasStationTxParams(gasLimitConfig.ARB_L2_APPROVE_ERC20_GAS_LIMIT)
      const promiseInstance = await bridge.approveToken(
        tokenAddress,
        gas,
      )
      const transaction = waitTransaction(promiseInstance)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.transferApprove', {
          amount: '∞',
          token: token.symbol,
        }).toString(),
        transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
      })
      onTransactionSuccess()
      return await transaction
    } catch (e) {
      console.error('approve', e)
      throw e
    } finally {
      this.approving = false
    }
  }

  async transferFromL1ToL2(tokenAddress: string | undefined, address: string | undefined, amount: BigNumber): Promise<ethers.providers.TransactionReceipt | undefined> {
    const bridge = await this.bridge
    if (!this.signerL1 || !this.isL1 || !this.address || !bridge) {
      return
    }
    this.transferringL1ToL2 = true
    try {
      let promiseInstance
      let tokenStr
      if (!tokenAddress) {
        tokenStr = currentChainConfig.symbol
        const gas = await getGasStationTxParams(gasLimitConfig.ARB_L1_DEPOSIT_ETH_GAS_LIMIT)
        const amountNum = ethers.BigNumber.from(amount.shiftedBy(DECIMALS).toFixed())
        promiseInstance = await bridge.depositETH(amountNum, ethers.BigNumber.from(3000000), gas)
      } else {
        const token = this.tokenBalanceFunc(tokenAddress, L1_NETWORK_ID)
        if (!token || token.decimals === null) {
          return
        }
        tokenStr = token.symbol
        const amountNum = ethers.BigNumber.from(amount.shiftedBy(token.decimals).toFixed())
        const gas = await getGasStationTxParams(gasLimitConfig.ARB_L1_DEPOSIT_ERC20_GAS_LIMIT)
        promiseInstance = await bridge.deposit(
          tokenAddress,
          amountNum,
          undefined,
          undefined,
          gas,
        )
      }

      const transaction = waitTransaction(promiseInstance)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.transferL1ToL2', {
          amount: formatBigNumberByPrecision(amount),
          token: tokenStr,
        }).toString(),
        transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
      })
      return await transaction
    } finally {
      this.transferringL1ToL2 = false
    }
  }

  async transferFromL2ToL1(l1TokenAddress: string, amount: BigNumber): Promise<ethers.providers.TransactionReceipt | undefined> {
    const bridge = await this.bridge
    if (!this.signer || !bridge || !this.isL2) {
      return
    }
    this.transferringL2ToL1 = true
    try {
      let promiseInstance
      let tokenStr

      if (!l1TokenAddress) {
        tokenStr = currentChainConfig.symbol
        const amountNum = ethers.BigNumber.from(amount.shiftedBy(DECIMALS).toFixed())
        const l2Gas = await getGasStationTxParams(gasLimitConfig.ARB_L2_WITHDRAW_ETH_GAS_LIMIT)
        promiseInstance = await bridge.withdrawETH(amountNum, undefined, l2Gas)
      } else {
        const token = this.tokenBalanceFunc(l1TokenAddress, L1_NETWORK_ID)
        if (!token || token.decimals === null) {
          return
        }
        tokenStr = token.symbol
        const amountNum = ethers.BigNumber.from(amount.shiftedBy(token.decimals).toFixed())
        const l2Gas = await getGasStationTxParams(gasLimitConfig.ARB_L2_WITHDRAW_ERC20_GAS_LIMIT)
        promiseInstance = await bridge.withdrawERC20(l1TokenAddress, amountNum, undefined, l2Gas)
      }

      const transaction = waitTransaction(promiseInstance)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.transferL2Tol1', {
          amount: formatBigNumberByPrecision(amount),
          token: tokenStr,
        }).toString(),
        transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
      })
      return await transaction
    } finally {
      this.transferringL2ToL1 = false
    }
  }

  async loadData(tokenAddress: string, networkId: SUPPORTED_NETWORK_ID = TARGET_NETWORK_ID) {
    this.loading = true
    try {
      await this.loadTokenInfo(tokenAddress, networkId)
    } finally {
      this.loading = false
    }
  }

  async reloadTokenInfo(tokenAddress: string, networkId: SUPPORTED_NETWORK_ID = TARGET_NETWORK_ID, times: number = 1) {
    if (times === 0) {
      return
    }
    await this.loadTokenInfo(tokenAddress, networkId)
    times--
    if (times > 0) {
      const timer = window.setTimeout(() => {
        this.reloadTokenInfo(tokenAddress, networkId, times)
        window.clearTimeout(timer)
      }, 5000)
    }
  }

  private async loadTokenInfo(tokenAddress: string, networkId: SUPPORTED_NETWORK_ID = TARGET_NETWORK_ID) {
    const bridge = await this.bridge
    if (!bridge || !this.l1BridgeAddress) {
      return
    }
    if (!tokenAddress) { // native token
      this.l1TokenAddress = ''
      this.l2TokenAddress = ''
      this.gatewayAddress = ''
      await this.updateNativeTokenBalance()
    } else {
      if (networkId === TARGET_NETWORK_ID) {
        this.l1TokenAddress = await bridge.l2Bridge.getERC20L1Address(tokenAddress) || ''
        this.l2TokenAddress = tokenAddress
      } else {
        this.l1TokenAddress = tokenAddress
        this.l2TokenAddress = await bridge.getERC20L2Address(tokenAddress)
      }
      this.gatewayAddress = await bridge.l1Bridge.getGatewayAddress(this.l1TokenAddress)
      await Promise.all([
        this.updateAllowance({
          tokenAddress: this.l1TokenAddress,
          spenderAddress: this.gatewayAddress,
          networkId: L1_NETWORK_ID,
        }),
        this.updateTokenBalance({ tokenAddress: this.l2TokenAddress, networkId: TARGET_NETWORK_ID }),
        this.updateTokenBalance({ tokenAddress: this.l1TokenAddress || '', networkId: L1_NETWORK_ID }),
      ])
    }
  }
}
