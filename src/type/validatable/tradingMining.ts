import { BaseInterface, BaseType } from '@/type/baseType'
import { defineBignumberMetadata } from '@/utils/reflect'
import { BignumberString } from '@/type'

export class AccountTradingMiningInfo extends BaseType implements BaseInterface {
  @defineBignumberMetadata() totalFee: BignumberString = '0'
  @defineBignumberMetadata() daoFee: BignumberString = '0'
  @defineBignumberMetadata() averageOI: BignumberString = '0'
  @defineBignumberMetadata() averageStake: BignumberString = '0'
  @defineBignumberMetadata() score: BignumberString = '0'
  @defineBignumberMetadata() proportion: BignumberString = '0'
}

export class AccountTradingMiningMultiChainInfo extends BaseType implements BaseInterface {
  totalFee: { [id: string]: BignumberString} = {}
  daoFee: { [id: string]: BignumberString} = {}
  baseDaoFee: { [id: string]: BignumberString} = {}
  averageOI: { [id: string]: BignumberString} = {}
  averageStake: { [id: string]: BignumberString} = {}
  @defineBignumberMetadata() score: BignumberString = '0'
  @defineBignumberMetadata() proportion: BignumberString = '0'
}

export class TotalTradingMiningInfo extends BaseType implements BaseInterface {
  totalTrader: number = 0
  @defineBignumberMetadata() totalFee: BignumberString = '0'
  @defineBignumberMetadata() totalStakeScore: BignumberString = '0'
  @defineBignumberMetadata() totalOI: BignumberString = '0'
  @defineBignumberMetadata() totalScore: BignumberString = '0'
}

export class QueryAccountTradingMiningInfoResult extends BaseType implements BaseInterface {
  data: {[id: number]: AccountTradingMiningInfo} = {}

  convert(): this {
    super.convert()
    let newData: {[id: number]: AccountTradingMiningInfo} = {}
    Object.keys(this.data).forEach((item) => {
      const id = Number(item)
      newData[id] = AccountTradingMiningInfo.fromData(this.data[id]).convert()
    })
    this.data = newData
    return this
  }
}

export class QueryAccountTradingMiningMultiChainInfoResult extends BaseType implements BaseInterface {
  data: {[id: number]: AccountTradingMiningMultiChainInfo} = {}

  convert(): this {
    super.convert()
    let newData: {[id: number]: AccountTradingMiningMultiChainInfo} = {}
    Object.keys(this.data).forEach((item) => {
      const id = Number(item)
      newData[id] = AccountTradingMiningMultiChainInfo.fromData(this.data[id]).convert()
    })
    this.data = newData
    return this
  }
}

export class QueryTotalTradingMiningInfoResult extends BaseType implements BaseInterface {
  data: {[id: number]: TotalTradingMiningInfo} = {}

  convert(): this {
    super.convert()
    let newData: {[id: number]: TotalTradingMiningInfo} = {}
    Object.keys(this.data).forEach((item) => {
      const id = Number(item)
      newData[id] = TotalTradingMiningInfo.fromData(this.data[id]).convert()
    })
    this.data = newData
    return this
  }
}
