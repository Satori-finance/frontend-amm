import 'reflect-metadata'
import BigNumber from 'bignumber.js'
import moment from 'moment'

export enum REFLECT_METADATA {
  TYPE = 'design:type'
}

export enum METADATA_VALUE_TYPE {
  BIGNUMBER = 'bignumber',
  MOMENT = 'Moment',
  Int = 'int'
}

export function defineBignumberMetadata(decimals?: number): PropertyDecorator {
  return (target, key) => {
    Reflect.defineMetadata(
      REFLECT_METADATA.TYPE,
      {
        type: METADATA_VALUE_TYPE.BIGNUMBER,
        formatter: (val: any) => {
          let b = new BigNumber(val)
          if (typeof decimals !== 'undefined') {
            b = b.shiftedBy(-decimals)
          }
          return b
        }
      },
      target,
      key
    )
  }
}

export function defineMomentRFC3389Metadata(): PropertyDecorator {
  return (target, key) => {
    Reflect.defineMetadata(
      REFLECT_METADATA.TYPE,
      {
        type: METADATA_VALUE_TYPE.MOMENT,
        formatter: (val: any) => {
          let b = moment(val)
          return b
        }
      },
      target,
      key
    )
  }
}

export function defineMomentUnixMetadata(): PropertyDecorator {
  return (target, key) => {
    Reflect.defineMetadata(
      REFLECT_METADATA.TYPE,
      {
        type: METADATA_VALUE_TYPE.MOMENT,
        formatter: (val: any) => {
          let b = moment.unix(val)
          return b
        }
      },
      target,
      key
    )
  }
}

export function defineIntMetadata(): PropertyDecorator {
  return (target, key) => {
    Reflect.defineMetadata(
      REFLECT_METADATA.TYPE,
      {
        type: METADATA_VALUE_TYPE.Int,
        formatter: (val: any) => {
          return parseInt(val)
        }
      },
      target,
      key
    )
  }
}
