import 'reflect-metadata'
import { REFLECT_METADATA } from '@/utils/reflect'

export interface BaseInterface {
  convert(): this
}

export class BaseType {
  static fromData<T extends BaseType>(this: new () => T, val: any): T {
    const result = new this()
    for (const valKey in result) {
      result[valKey] = val[valKey]
    }
    return result
  }

  convert(): this {
    const keys = Reflect.ownKeys(this)
    for (const key of keys) {
      const metadata = Reflect.getMetadata(
        REFLECT_METADATA.TYPE,
        this,
        key as string
      )

      if (metadata && metadata.formatter) {
        Reflect.set(this, key, metadata.formatter(Reflect.get(this, key)))
      }
    }

    return this
  }
}
