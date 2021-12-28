import { BaseInterface, BaseType } from '@/type/baseType'
import { defineBignumberMetadata } from '@/utils/reflect'
import { BignumberString, PoolStruct } from '@/type'
import gql from 'graphql-tag'
import BigNumber from 'bignumber.js'
import { _0 } from '@mcdex/mai3.js'

export class TransactionMiningInfo extends BaseType implements BaseInterface {
  id: string = ''
  pools: string[] = []
  @defineBignumberMetadata() rebateRate: BignumberString = '0'
  @defineBignumberMetadata() budget: BignumberString = '0'
  @defineBignumberMetadata() minedBudget: BignumberString = '0'
}

export class TransactionMiningTrade extends BaseType implements BaseInterface {
  id: string = ''
  pool: PoolStruct = new PoolStruct()
  @defineBignumberMetadata() tradeVolume: BignumberString = '0'
  @defineBignumberMetadata() tradeVolumeUSD: BignumberString = '0'
  @defineBignumberMetadata() totalFee: BignumberString = '0'
  @defineBignumberMetadata() totalFeeUSD: BignumberString = '0'
  @defineBignumberMetadata() earnSATORI: BignumberString = '0'

  convert(): this {
    super.convert()
    this.pool = PoolStruct.fromData(this.pool).convert()
    return this
  }
}

export class TransactionMiningUserInfo extends BaseType implements BaseInterface {
  id: string = ''
  @defineBignumberMetadata() totalEarnSATORI: BignumberString = '0'
  @defineBignumberMetadata() paidSATORI: BignumberString = '0'
  @defineBignumberMetadata() unPaidSATORI: BignumberString = '0'
  @defineBignumberMetadata() totalFee: BignumberString = '0'

  /**
   * @ignore
   */
  oldTotalFee: BigNumber = _0

  /**
   * @ignore
   */
  get deltaTotalFee(): BigNumber {
    return new BigNumber(this.totalFee).minus(this.oldTotalFee || 0)
  }

  /**
   * @ignore
   */
  oldTotalEarnSATORI: BigNumber = _0

  /**
   * @ignore
   */
  get deltaTotalEarnSATORI(): BigNumber {
    return new BigNumber(this.totalEarnSATORI).minus(this.oldTotalEarnSATORI || 0)
  }
}

export class QueryTransactionMiningInfoResult extends BaseType implements BaseInterface {
  static query = gql`
    query {
      miningInfos {
        id
        rebateRate
        pools
        budget
        minedBudget
      }
    }
  `

  miningInfos: TransactionMiningInfo[] = []

  /**
   * @ignore
   */
  get miningInfo() {
    return this.miningInfos[0] || null
  }

  convert(): this {
    super.convert()
    this.miningInfos = this.miningInfos.map(m => TransactionMiningInfo.fromData(m).convert())
    return this
  }
}

export class QueryTransactionMiningTradeResult extends BaseType implements BaseInterface {
  static query = gql`
    query {
      tradeAccounts {
        id
        tradeVolume
        tradeVolumeUSD
        totalFee
        totalFeeUSD
        earnSATORI
      }
    }
  `

  tradeAccounts: TransactionMiningTrade[] = []

  convert(): this {
    super.convert()
    this.tradeAccounts = this.tradeAccounts.map(m => TransactionMiningTrade.fromData(m).convert())
    return this
  }
}

export class QueryTransactionMiningUserResult extends BaseType implements BaseInterface {
  static genQuery(blockNumber?: number) {
    return gql`
      query($user: String!) {
        user(id: $user, ${blockNumber ? `block: {number: ${blockNumber}},` : ''}) {
          id
          totalEarnSATORI
          paidSATORI
          unPaidSATORI
          totalFee
        }
      }
    `
  }

  user: TransactionMiningUserInfo | null = null

  convert(): this {
    super.convert()
    this.user = this.user ? TransactionMiningUserInfo.fromData(this.user).convert() : null
    return this
  }
}
