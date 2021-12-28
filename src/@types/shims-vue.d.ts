import Vue from 'vue'
import { TransactionParams } from '@/components/Transaction/transaction'

declare module '*.vue' {
  import Vue from 'vue'
  export default Vue
}

declare module 'vue/types/vue' {
  interface Vue {
    $transaction: (params: TransactionParams) => void
  }
}
