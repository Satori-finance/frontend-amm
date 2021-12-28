import { BaseInterface, BaseType } from '../baseType'
import { BignumberString, MomentString, Perpetual, QueryConfirmedOrderApiParams } from '@/type'
import { defineBignumberMetadata, defineMomentRFC3389Metadata } from '@/utils/reflect'
import gql from 'graphql-tag'
import { ORDER_CANCEL_REASON, ORDER_STATUS, WS_ORDER_TYPE } from '@/ts/types'


export class OrderStruct extends BaseType implements BaseInterface {
  @defineBignumberMetadata() amount: BignumberString = '0'
  @defineBignumberMetadata() availableAmount: BignumberString = '0'
  brokerAddress: string = ''
  brokerFeeLimit: number = 0
  cancelReasons: Array<OrderCancelReason> | null = null
  @defineBignumberMetadata() canceledAmount: BignumberString = '0'
  @defineBignumberMetadata() confirmedAmount: BignumberString = '0'
  @defineMomentRFC3389Metadata() createdAt: MomentString = ''
  @defineMomentRFC3389Metadata() expiresAt: MomentString = ''
  isCloseOnly: boolean = false
  liquidityPoolAddress: string = ''
  collateralAddress: string = ''
  @defineBignumberMetadata() minTradeAmount: BignumberString = '0'
  oldStatus: ORDER_STATUS = ORDER_STATUS.OrderEmpty
  orderHash: string = ''
  @defineBignumberMetadata() pendingAmount: BignumberString = '0'
  perpetualIndex: number = 0
  @defineBignumberMetadata() price: BignumberString = '0'
  referrerAddress: string = ''
  relayerAddress: string  = ''
  status: ORDER_STATUS = ORDER_STATUS.OrderCanceled
  @defineBignumberMetadata() triggerPrice: BignumberString = '0'
  traderAddress: string = ''
  type: WS_ORDER_TYPE = WS_ORDER_TYPE.LimitOrder
  @defineMomentRFC3389Metadata() updatedAt: MomentString = ''
  @defineBignumberMetadata() targetLeverage: BignumberString = '0'

  convert(): this {
    super.convert()
    if (this.cancelReasons) {
      this.cancelReasons = this.cancelReasons.map(m =>
        OrderCancelReason.fromData(m).convert(),
      )
    }
    return this
  }
}

export class OrderCancelReason extends BaseType implements BaseInterface {
  reason: ORDER_CANCEL_REASON = ORDER_CANCEL_REASON.CancelReasonExpired
  @defineBignumberMetadata() amount: BignumberString = '0'
  @defineMomentRFC3389Metadata() canceledAt: MomentString = ''
  transactionHash: string | undefined = undefined
}

export class PlaceOrderResult extends BaseType implements BaseInterface {
  status: number = 0
  data: { order: OrderStruct } = { order: new OrderStruct() }

  convert(): this {
    super.convert()
    this.data = {
      order: OrderStruct.fromData(this.data.order).convert()
    }
    return this
  }
}

export class CancelOrderResult extends BaseType implements BaseInterface {

}

export class CancelAllOrdersResult extends BaseType implements BaseInterface {

}

export class GetMyOrderResult extends BaseType implements BaseInterface {

}

export class GetMyOrdersResult extends BaseType implements BaseInterface {
  orders: OrderStruct[] = []

  convert(): this {
    super.convert()
    this.orders = this.orders.map(item => OrderStruct.fromData(item).convert())
    return this
  }
}

export class GetMyOrdersByPerpResult extends BaseType implements BaseInterface {

}

export class GetSignOrderInfoResult extends BaseType implements BaseInterface {
  brokerAddress: string = ''
  version: number = 3
  relayerAddress: string = ''
}

export class ConfirmedOrder extends BaseType implements BaseInterface {
  id: string = ''
  @defineBignumberMetadata() gas: BignumberString = '0'
  @defineBignumberMetadata() amount: BignumberString = '0'
  @defineBignumberMetadata() price: BignumberString = '0'
  type: number = 0
  transactionHash: string = ''
  timestamp: string = ''
  perpetual: Perpetual = new Perpetual()
}

export class QueryConfirmedOrdersResult extends BaseType implements BaseInterface {
  static genQuery(params: QueryConfirmedOrderApiParams) {
    const gqlStr = `
      query(
        $userAddr:ID!
        ${params.startTime ? '$startTime:String,' : ''}
        ${params.endTime ? '$endTime:String,' : ''}
        ${params.perpetualID ? '$perpetualAddress:String' : ''}
        ${params.type ? '$type:Int' : ''}
      ) {
        matchOrders(
          where: {
            trader: $userAddr
            ${params.startTime ? 'timestamp_gt: $startTime' : ''}
            ${params.endTime ? 'timestamp_lt: $endTime' : ''}
            ${params.perpetualID ? 'perpetualID: $perpetualAddress' : ''}
            ${params.type ? 'type: $type' : ''}
          }
        ) {
          id
          gas
          amount
          price
          type
          transactionHash
          timestamp
          perpetual {
            id
          }
        }
      }
    `
    return gql(gqlStr)
  }

  confirmedOrders: ConfirmedOrder[] = [] // possibly empty

  convert(): this {
    super.convert()
    this.confirmedOrders = this.confirmedOrders.map(m =>
      ConfirmedOrder.fromData(m).convert(),
    )
    return this
  }
}
