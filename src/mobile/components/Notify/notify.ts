import NotifyComponent from './Notify.vue'
import Vue, { VueConstructor } from 'vue'

export interface NotifyParams {
  value?: boolean
  duration?: number
  className?: string
  message: string
  title?: string
  type?: 'danger' | 'success' | 'warning' | 'info'
  position?: 'top' | 'bottom'
}

function defaultOptions(): NotifyParams {
  return {
    value: true,
    type: 'info',
    message: '',
    duration: 3000,
    className: '',
    position: 'top'
  }
}

class NotifyClass {
  _vue: VueConstructor
  timer: number = 0
  instance: any = null

  constructor(Vue: VueConstructor) {
    this._vue = Vue
  }

  notify(notify: NotifyParams) {
    if (!notify || typeof notify !== 'object') return console.error('McMNotify param must is a Object')

    this.createdComponent(notify)
  }

  createdComponent(info: NotifyParams) {
    info = { ...defaultOptions(), ...info }
    if (this.instance) {
      this.instance.$el.remove()
    }
    const notifyComponent = this._vue.extend(NotifyComponent)
    const divEle = document.createElement('div')

    this.instance = new notifyComponent({
      el: divEle,
      data: info,
    })
    document.body.appendChild(this.instance.$el)

    window.clearTimeout(this.timer)
    this.timer = 0

    if (info.duration && info.duration > 0) {
      this.timer = window.setTimeout(() => this.instance.hide(), info.duration)
    }
  }
}

const notifyClass = new NotifyClass(Vue)

export const Notify = (params: NotifyParams) => {
  notifyClass.notify(params)
}

export default {
  install(Vue: VueConstructor) {
    Vue.prototype.$mcmNotify = Notify
  },
}
