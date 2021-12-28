import { Component, Mixins } from 'vue-property-decorator'
import {
  AccountComputed,
  AccountDetails,
  computeAccount,
} from '@mcdex/mai3.js'
import { PerpetualStorageMixin } from './perpetualStorageMixin'
import { namespace } from 'vuex-class'
import { BigNumber } from 'bignumber.js'
import { AccountStorageDirectoryItem } from '@/type'

const wallet = namespace('wallet')
const account = namespace('account')

@Component
export class AccountStorageMixin extends Mixins(PerpetualStorageMixin) {
  @wallet.Getter('address') address!: string | null
  @account.Action('updateAccountStorage') updateAccountStorage!: (perpetualID: string) => Promise<void>
  @account.Getter('accountStorageFunc') accountStorageFunc!: (perpetualID: string) => AccountStorageDirectoryItem | null

  get accountDetail(): AccountDetails | null {
    if (!this.perpetual || !this.accountStorage) {
      return null
    }
    return computeAccount(this.perpetual.liquidityPoolStorage, this.perpetual.perpetualProperty.perpetualIndex, this.accountStorage)
  }

  get accountStorage(): AccountStorageDirectoryItem | null {
    if (!this.perpetualID || !this.accountStorageFunc) {
      return null
    }
    return this.accountStorageFunc(this.perpetualID)
  }

  get accountComputed(): AccountComputed | null {
    return this.accountDetail ? this.accountDetail.accountComputed : null
  }

  get marginBalance(): BigNumber | null {
    return this.accountDetail ? this.accountDetail.accountComputed.marginBalance : null
  }

  get position(): BigNumber | null {
    return this.accountStorage ? this.accountStorage.positionAmount : null
  }

  get leverage(): BigNumber | null {
    return this.accountComputed ? this.accountComputed.leverage : null
  }
}
