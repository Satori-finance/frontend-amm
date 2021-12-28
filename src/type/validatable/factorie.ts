import { BaseInterface, BaseType } from '@/type/baseType'
import gql from 'graphql-tag'

export class Factories extends BaseType implements BaseInterface {
  id: string = ''
  collaterals?: string[] = []
  // more...
}

export class QueryVaultAssetResult extends BaseType implements BaseInterface {
  static query = gql`
    query {
      factories: factories(where: { id: "mcdex" }) {
        id
        collaterals
      }
    }
  `

  factories: Factories[] = []

  convert(): this {
    super.convert()
    this.factories = this.factories.map((m) => Factories.fromData(m).convert())
    return this
  }
}
