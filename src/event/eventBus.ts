import Vue from 'vue'

function eventBusInfo(info: any[]) {
  if (process.env.VUE_APP_EVENT_LOG !== 'on') {
    return
  }
  console.info(
    '%cEVENT_BUS',
    'background:red;color:white;font-weight:bold;padding:0 8px;',
    ...info,
  )
}

export class EventBus {
  private id = 0
  private eventBus = new Vue()
  private callbackFuncMap = new Map<Function, Function>()
  private eventOnCloseFuncMap = new Map<number, Function[]>()

  emit(event: string, ...args: any[]) {
    eventBusInfo(['emit event:', event, ` [ID: ${this.id}]`, ...args])
    this.eventBus.$emit(event, ...args, this.id)
    this.id++
  }

  on(event: string | string[], callback: Function, closeFunc?: Function) {
    eventBusInfo(['add event watcher:', event])

    const callbackFunc = (...args: any[]) => {
      const eventId = args[args.length - 1] as number
      if (closeFunc) {
        if (this.eventOnCloseFuncMap.has(eventId)) {
          this.eventOnCloseFuncMap.get(eventId)!.push(closeFunc)
        } else {
          this.eventOnCloseFuncMap.set(eventId, [closeFunc])
        }
      }
      callback(...args)
    }
    this.callbackFuncMap.set(callback, callbackFunc)
    this.eventBus.$on(event, callbackFunc)
  }

  handle(event: string | string[], handler: (...arg: any[]) => Promise<any>) {
    eventBusInfo(['handle event:', event])

    const callbackFunc = async (...args: any[]) => {
      const eventId = args[args.length - 1] as number
      await handler(...args)
      if (this.eventOnCloseFuncMap.has(eventId)) {
        this.eventOnCloseFuncMap.get(eventId)!.forEach((closeFunc: Function) => {
          closeFunc()
        })
        this.eventOnCloseFuncMap.delete(eventId)
      }
    }
    this.callbackFuncMap.set(handler, callbackFunc)
    this.eventBus.$on(event, callbackFunc)
  }

  off(event?: string | string[], callback?: Function) {
    eventBusInfo(['remove event watcher:', event])
    this.eventBus.$off(event, callback ? this.callbackFuncMap.get(callback) : undefined)
    if (callback) {
      this.callbackFuncMap.delete(callback)
    }
  }

  once(event: string | string[], callback: Function, closeFunc?: Function) {
    eventBusInfo(['register once event watcher:', event])
    const callbackFunc = (...args: any[]) => {
      const eventId = args[args.length - 1] as number
      const params = args.slice(0, args.length - 1)
      callback(params)
      if (closeFunc) {
        if (this.eventOnCloseFuncMap.has(eventId)) {
          this.eventOnCloseFuncMap.get(eventId)!.push(closeFunc)
        } else {
          this.eventOnCloseFuncMap.set(eventId, [closeFunc])
        }
      }
    }
    this.callbackFuncMap.set(callback, callbackFunc)
    this.eventBus.$once(event, callbackFunc)
  }
}


export const VUE_EVENT_BUS = new EventBus()


if (!window.hasOwnProperty('VUE_EVENT_BUS')) {
  (window as any).VUE_EVENT_BUS = VUE_EVENT_BUS
}
