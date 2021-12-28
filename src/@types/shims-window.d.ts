import { EventBus } from '@/event'

declare global {
  interface Window {
    VUE_EVENT_BUS?: EventBus
    SATORI_CONFIG?: {
      configs: { [key: string]: Promise<any> }
      onResolve: (configKey: string | string[]) => Promise<any>
    }
  }
}
