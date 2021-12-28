import { BaseInterface, BaseType } from '@/type/baseType'
import { defineBignumberMetadata } from '@/utils/reflect'
import { BignumberString } from '@/type'

export class AccountGasFeeInfo extends BaseType implements BaseInterface {
  @defineBignumberMetadata() gasFee: BignumberString = '0'
}

export class QueryAccountGasFeeInfoResult extends BaseType implements BaseInterface {
  data: {[id: number]: AccountGasFeeInfo} = {}

  convert(): this {
    super.convert()
    let newData: {[id: number]: AccountGasFeeInfo} = {}
    Object.keys(this.data).forEach((item) => {
      const id = Number(item)
      newData[id] = AccountGasFeeInfo.fromData(this.data[id]).convert()
    })
    this.data = newData
    return this
  }
}

