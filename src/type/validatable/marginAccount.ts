import { BaseInterface, BaseType } from '@/type/baseType'
import gql from 'graphql-tag'
import { defineBignumberMetadata } from '@/utils/reflect'
import { BignumberString, Perpetual } from '@/type'

export class MarginAccount extends BaseType implements BaseInterface {
  id: string = ''
  @defineBignumberMetadata() position: BignumberString = '0'
  @defineBignumberMetadata() entryValue: BignumberString = '0'
  @defineBignumberMetadata() entryFunding: BignumberString = '0'

  perpetual?: Perpetual = new Perpetual()

  /**
   * @ignore
   */
  get perpetualID(): string {
    const splitResult = this.id.split('-')
    return splitResult ? `${splitResult[0]}-${splitResult[1]}` : ''
  }
}

export class QueryMarginAccountResult extends BaseType implements BaseInterface {
  static query = gql`
    query($userAddr:ID!) {
       marginAccounts(
        where: { user: $userAddr }
      ) {
        id
        position
        entryValue
        entryFunding
        perpetual {
          id
          collateralAddress
        }
      }
    }
  `
  marginAccounts: MarginAccount[] = [] // possibly empty

  convert(): this {
    super.convert()
    this.marginAccounts = this.marginAccounts.map(m =>
      MarginAccount.fromData(m).convert()
    )
    return this
  }
}
