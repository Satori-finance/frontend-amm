import Transaction from './Transaction.vue'
import Vue, { VueConstructor } from 'vue'

export interface TransactionParams {
  location?: string
  transactionHash: string
  transaction: Promise<any>
  content: string
}

export const RECENT_TRANSACTIONS: TransactionParams[] = []

export function clearRecentTransactions() {
  RECENT_TRANSACTIONS.splice(0)
}

class TransactionClass {
  _vue: VueConstructor
  topContainer: HTMLElement
  bottomContainer: HTMLElement

  constructor(Vue: VueConstructor) {
    this._vue = Vue
    this.topContainer = this.createContainer('top')
    this.bottomContainer = this.createContainer('bottom')
  }

  createContainer(location: 'top' | 'bottom') {
    const container = document.createElement('div')
    container.style.position = 'fixed'
    container.style.zIndex = '10000'
    container.style[location] = '8px'
    container.style.right = '8px'
    document.body.append(container)
    return container
  }

  transaction(transaction: TransactionParams) {
    if (!transaction || typeof transaction !== 'object') return console.error('Transaction param must is a Object')

    this.createdComponent(transaction)
  }

  createdComponent(info: TransactionParams) {
    const TransactionComponent = this._vue.extend(Transaction)
    const divEle = document.createElement('div')

    const vueComponent: any = new TransactionComponent({
      el: divEle,
      propsData: info,
    })
    vueComponent.flag = true
    setTimeout(() => {
      this.addMessageToBody(vueComponent.$el, info.location || 'top')
    })
  }

  addMessageToBody(element: Element, location: TransactionParams['location']) {
    switch (location) {
      case 'bottom':
        this.bottomContainer.append(element)
        break
      default:
        this.topContainer.append(element)
        break
    }
  }
}

const transactionClass = new TransactionClass(Vue)

export const TRANSACTION = (params: TransactionParams) => {
  RECENT_TRANSACTIONS.push(params)
  transactionClass.transaction(params)
}

export default {
  install(Vue: VueConstructor) {
    Vue.prototype.$transaction = TRANSACTION
  },
}
