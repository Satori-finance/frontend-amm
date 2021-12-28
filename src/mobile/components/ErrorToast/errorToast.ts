import { VueConstructor } from 'vue'
import { Notify } from '../Notify/notify'

export const ToastErrorMessage = (messages: string | string[]) => {
  let errorMessage: string = ''
  if (messages instanceof Array) {
    if (messages.length > 0) {
      errorMessage = messages[messages.length-1]
    }
  } else {
    errorMessage = messages
  }
  if (errorMessage && errorMessage !== '') {
    Notify({
      title: '',
      message: errorMessage,
      type: 'danger',
      duration: 1500, // 1.5s
    })
  }
}

export default {
  install (Vue: VueConstructor) {
    Vue.prototype.$mcmToastErrorMsg = ToastErrorMessage
  },
}