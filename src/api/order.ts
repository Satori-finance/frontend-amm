import {
  OrderApiRequestParams,
  QueryConfirmedOrderApiParams,
  QueryConfirmedOrdersResult,
  QueryOrderHistoryApiParams,
  GetSignOrderInfoResult,
  PlaceOrderResult,
  GetOrdersParams,
  GetMyOrdersResult,
  CancelOrderResult,
  CancelAllOrdersResult,
  OrderStruct,
  GetMyOrdersByPerpResult,
} from '@/type'
import {
  parsePlaceOrderResult,
  parseCancelOrderResult,
  parseCancelAllOrdersResult,
  parseGetMyOrdersResult,
  parseGetMyOrdersByPerpResult,
  parseQueryConfirmedOrdersResult,
  parseGetSignOrderInfoResult,
  parseOrderStruct,
} from '@/type/index.validator'
import { getGraphClient } from '@/utils/graphQL'
import { defaultRelayerServerAPIClient } from '@/api/client'
import { currentChainConfig } from '@/config/chain'

export async function placeOrder(requestParams: OrderApiRequestParams): Promise<PlaceOrderResult> {
  const result = (await defaultRelayerServerAPIClient.request({
    url: 'orders',
    method: 'post',
    data: requestParams,
  })) as any
  return parsePlaceOrderResult(result)
}

export async function getSignOrderInfo(liquidityPoolAddress: string, perpetualIndex: number): Promise<GetSignOrderInfoResult> {
  const result = (await defaultRelayerServerAPIClient.request({
    url: 'brokerRelay',
    params: {
      liquidityPoolAddress,
      perpetualIndex,
    },
    method: 'get',
  })) as any
  return result ? parseGetSignOrderInfoResult(result.data) : new GetSignOrderInfoResult().convert()
}


export async function cancelOrder(orderId: string) {
  const result = await defaultRelayerServerAPIClient.request({
    url: `orders/${orderId}`,
    method: 'delete',
  })
  return result ? parseCancelOrderResult(result) : new CancelOrderResult().convert()
}

export async function cancelAllOrders() {
  const result = (await defaultRelayerServerAPIClient.request({
    url: 'orders',
    method: 'delete',
  })) as any
  return result ? parseCancelAllOrdersResult(result) : new CancelAllOrdersResult().convert()
}

export async function getMyOrder(orderId: string) {
  const result = await defaultRelayerServerAPIClient.request({
    url: `orders/${orderId}`,
    method: 'get',
  })
  return result ? parseOrderStruct(result.data?.order || {}) : new OrderStruct().convert()
}

export async function getMyOrders(params: GetOrdersParams) {
  const result = await defaultRelayerServerAPIClient.request({
    url: 'orders',
    method: 'get',
    params,
  })
  return result ? parseGetMyOrdersResult(result.data) : new GetMyOrdersResult().convert()
}

export async function getMyOrdersByPerp(
  requestParams: QueryOrderHistoryApiParams,
) {
  const result = (await defaultRelayerServerAPIClient.request({
    url: 'orders',
    method: 'get',
    params: requestParams,
  })) as any
  return result ? parseGetMyOrdersByPerpResult(result) : new GetMyOrdersByPerpResult().convert()
}

export async function queryConfirmedOrders(
  params: QueryConfirmedOrderApiParams,
): Promise<QueryConfirmedOrdersResult> {
  const graphqlClient = getGraphClient(currentChainConfig.subgraphConfig.dataSubgraph)
  const result = (await graphqlClient.query({
    query: QueryConfirmedOrdersResult.genQuery(params),
    variables: {
      userAddr: params.userAddress.toLowerCase(),
      startTime: params.startTime,
      endTime: params.endTime,
      type: params.type,
      perpetualID: params.perpetualID?.toLowerCase(),
    },
    fetchPolicy: 'network-only',
  })) as any
  return parseQueryConfirmedOrdersResult(result.data)
}
