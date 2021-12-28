export const ERROR_MESSAGE_TO_ERROR_HELPKEY = new Map<string, { helpCaptionKey: string, helpKey: string }>([
  ['execution reverted: price exceeds limit', {
    helpCaptionKey: 'errors.transactionFailedCaption',
    helpKey: 'errors.exceedsPriceLimit',
  }],
  ['MetaMask Tx Signature: User denied transaction signature.', {
    helpCaptionKey: 'errors.captionCanceled',
    helpKey: 'errors.userCanceled',
  }],
  ['gas price too low', {
    helpCaptionKey: 'errors.transactionFailedCaption',
    helpKey: 'errors.gasPriceTooLow',
  }]
])

export interface MCError extends Error {
  readonly helpCaptionKey: string
  readonly helpKey: string
}

export interface ContractErrorResponse {
  code: number
  message: string
}

export interface WalletErrorResponse {
  code: number
  message: string
  data?: ContractErrorResponse
}

export interface RelayerErrorResponse {
  status: number
  desc?: string | null
  data?: Array<string | number> | null
}


export function isMCError(error: Error): error is MCError {
  const e = error as MCError
  return e && typeof e.helpKey === 'string' && typeof e.helpCaptionKey === 'string'
}

export function normalizeError(error: Error): MCError {
  if (isMCError(error)) {
    return error
  }
  console.warn('normalizeError:', error)
  const err = formatEthersjsError(error)
  const errorHelpKey = ERROR_MESSAGE_TO_ERROR_HELPKEY.get(err.message)
  const helpCaptionKey = err.code === -32603 ? 'errors.contractErrorCaption' : null
  return {
    ...err,
    helpCaptionKey: errorHelpKey?.helpCaptionKey || helpCaptionKey || 'errors.captionSystemError',
    helpKey: errorHelpKey?.helpKey || 'errors.messageFormat',
  }
}

export function isNodeServerError(e: Error) {
  return true
  // return e.message.match(/unsupported block number/g)
}

export class UnavailableWalletError extends Error implements MCError {
  helpCaptionKey: string = 'errors.captionError'
  helpKey: string = 'errors.unavailableWallet'
}

export class UserCanceledError extends Error implements MCError {
  helpCaptionKey: string = 'errors.captionCanceled'
  helpKey: string = 'errors.userCanceled'
}

export class WalletError extends Error implements MCError {
  helpCaptionKey: string = 'errors.captionWalletError'
  helpKey: string = 'errors.messageFormat'
}

export class WrongNetworkError extends Error implements MCError {
  helpCaptionKey: string = 'errors.captionError'
  helpKey: string = 'errors.wrongNetwork'
  networkName: string = ''

  constructor(id: number, networkName: string) {
    super(`wrong network id ${id}, need network ${networkName}`)
    this.networkName = networkName
  }
}

export class ExecuteTransactionError extends Error implements MCError {
  helpCaptionKey: string = 'errors.captionError'
  helpKey: string = 'errors.executeTransaction'
}

export class InsufficientETH extends Error implements MCError {
  helpCaptionKey: string = 'errors.captionInsufficientETH'
  helpKey: string = 'errors.insufficientETHMessage'
  minETH: number = 0

  constructor(minETH: number) {
    super(`Insufficient ETH: need ${minETH} ETH`)
    this.minETH = minETH
  }
}

export class ContractError extends Error implements MCError {
  helpCaptionKey: string = 'errors.contractErrorCaption'
  helpKey: string = 'errors.messageFormat'
  code: number

  constructor(error: WalletErrorResponse) {
    super(error.data?.message || error.message)
    this.code = error.data?.code || error.code
  }
}

export class GraphQLError extends Error implements MCError {
  helpCaptionKey: string = 'errors.graphqlErrorCaption'
  helpKey: string = 'errors.messageFormat'

  constructor(error: Error) {
    super(error.message)
  }
}

export class DataNotFoundError extends Error implements MCError {
  helpCaptionKey: string = '' // do not pop an error window
  helpKey: string = ''

  constructor(...deps: string[]) {
    super()
    const depsStr = deps.join(',')
    this.message = `Pending data or data not found: ${depsStr}`
  }
}

export class InvalidArgumentError extends Error implements MCError {
  helpCaptionKey: string = '' // do not pop an error window
  helpKey: string = ''

  constructor(arg: string) {
    super()
    this.message = `Invalid argument: ${arg}`
  }
}

export class OracleChartServerNetworkError extends Error implements MCError {
  helpCaptionKey: string = 'errors.oracleChartErrorCaption'
  helpKey: string = 'errors.messageFormat'
}

export class TradingMiningServerNetworkError extends Error implements MCError {
  helpCaptionKey: string = 'errors.tradingMiningErrorCaption'
  helpKey: string = 'errors.messageFormat'
}

export class RelayerServerNetworkError extends Error implements MCError {
  helpCaptionKey: string = 'errors.relayerErrorCaption'
  helpKey: string = 'errors.messageFormat'
}

export class RelayerApiError extends Error implements MCError {
  // relayer server api data error
  helpCaptionKey: string = 'errors.relayerErrorCaption'
  helpKey: string = 'errors.messageFormat'
  status: number
  desc: string
  globalNoticeErrorCodeList: Array<number> = []
  data?: Array<string | number> | null

  constructor(err: RelayerErrorResponse, url?: string) {
    super(`${url} response error[${err.status}]:${err.desc}`)
    this.status = err.status
    this.desc = err.desc || ''
    this.data = err.data

    if (this.globalNoticeErrorCodeList.indexOf(this.status) >= 0) {
      this.helpKey = 'apiErrors.apiUnknownError'
    } else {
      this.helpKey = `apiErrors.apiError_${Math.abs(this.status)}`
    }
  }
}

export function formatEthersjsError(e: any) {
  let error: any = formatEthersjsContractError(e)
  if (!error) {
    error = formatEtherjsRPCError(e.message)
  }
  if (!error) {
    error = e as Error
  }
  return error
}

/**
 * format error like "Error: [ethjs-query] while formatting outputs from RPC '{'value":{"code":-32603,"data":{"code":-32000,"message":"gas price too low'}}}'"
 * @param error
 */
export function formatEtherjsRPCError(error: string): ContractErrorResponse | null {
  const regx = /"data":(\{"code":-?[0-9]*,"message":"[\W\w]*"\})/i
  const result = regx.exec(error)
  const data = result ? (result[1] || null) : null
  const errorObj = data ? JSON.parse(data) : null
  return errorObj ? errorObj as ContractErrorResponse : null
}

export function formatEthersjsContractError(error: { code: number, data?: { message: string } }): ContractErrorResponse | null {
  return error.data ? { code: error.code, message: error.data.message } as ContractErrorResponse : null
}
