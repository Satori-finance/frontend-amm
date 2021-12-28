import Vue from 'vue'
import { NotifyParams } from '@/mobile/components/Notify/notify'

declare module 'vue/types/vue' {
  interface Vue {
    $mcmToastErrorMsg: (messages: string | string[]) => void
    $mcmNotify: (info: NotifyParams) => void
  }
}
