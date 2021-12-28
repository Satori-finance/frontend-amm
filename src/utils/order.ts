// sign order

import { OrderTypeParams, PerpetualV3OrderToSign, OrderApiRequestParams, SignType } from '@/type'
import { UnsupportEIP712Error, Wallet } from '@/business-components/wallet/wallet-connector'
import { ethers } from 'ethers'
import { getLocalStorage } from '@/utils/storage'
import { EMPTY_ADDRESS, REFERRAL_KEY } from '@/constants'
import { TradeFlag } from '@mcdex/mai3.js';
import { getLeverageFlag } from './leverage'

const EIP712_DOMAIN_TYPE_HASH = keccak256String('EIP712Domain(string name)')
const EIP712_ORDER_TYPE = keccak256String(
  'Order(address trader,address broker,address relayer,address referrer,address liquidityPool,int256 minTradeAmount,int256 amount,int256 limitPrice,int256 triggerPrice,uint256 chainID,uint64 expiredAt,uint32 perpetualIndex,uint32 brokerFeeLimit,uint32 flags,uint32 salt)',
)

function getMaiV3EIP712Message(message: PerpetualV3OrderToSign) {
  return {
    types: {
      EIP712Domain: [{ name: 'name', type: 'string' }],
      Order: [
        { name: 'trader', type: 'address' },
        { name: 'broker', type: 'address' },
        { name: 'relayer', type: 'address' },
        { name: 'referrer', type: 'address' },
        { name: 'liquidityPool', type: 'address' },
        { name: 'minTradeAmount', type: 'int256' },
        { name: 'amount', type: 'int256' },
        { name: 'limitPrice', type: 'int256' },
        { name: 'triggerPrice', type: 'int256' },
        { name: 'chainID', type: 'uint256' },
        { name: 'expiredAt', type: 'uint64' },
        { name: 'perpetualIndex', type: 'uint32' },
        { name: 'brokerFeeLimit', type: 'uint32' },
        { name: 'flags', type: 'uint32' },
        { name: 'salt', type: 'uint32' },
      ],
    },
    domain: { name: 'Mai Protocol v3' },
    primaryType: 'Order',
    message: message,
  }
}

function addLeadingZero(str: string, length: number): string {
  let len: number = str.length
  return '0'.repeat(length - len) + str
}

function keccak256(message: string): string {
  //return ethers.utils.id(message)
  let messageBytes = ethers.utils.toUtf8Bytes(message)
  return ethers.utils.keccak256(messageBytes)
}

function string2Hex(message: string): string {
  return ethers.utils.hexlify(ethers.utils.toUtf8Bytes(message))
}

function keccak256String(message: string): string {
  //let messageBytes = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(message))
  let messageHex = string2Hex(message)
  return ethers.utils.keccak256(messageHex)
}

function keccak256Hex(message: string): string {
  return ethers.utils.keccak256(message)
}

function getDomainSeparator(): string {
  return keccak256Hex(EIP712_DOMAIN_TYPE_HASH + keccak256String('Mai Protocol v3').slice(2))
}

function getEIP712MessageHash(message: string): string {
  let hash = keccak256Hex('0x1901' + getDomainSeparator().slice(2) + message.slice(2))
  return hash
}

interface Signature {
  r: string
  s: string
  v: string
}

// make the result of eth_sign compatible with EIP155 where the v is either 27 or 28
function normalizeSign(sign: string): Signature {
  if (sign.length != 132) {
    throw new Error('sign should consist up with 0x{r}{s}{v}')
  }
  const r = sign.slice(2, 2 + 64)
  const s = sign.slice(2 + 64, 2 + 128)
  let v = sign.slice(2 + 128)

  const tail = parseInt(v, 16)
  if (tail < 27) {
    v = (tail + 27).toString(16).toLowerCase()
  }
  return { r, s, v }
}

export async function signOrder(
  wallet: Wallet,
  orderHash: string,
  v3json: PerpetualV3OrderToSign | null,
): Promise<{ signature: Signature, signType: SignType }> {
  // EIP712
  if (wallet.signTypedDataV3) {
    try {
      if (v3json != null) {
        const eip712 = getMaiV3EIP712Message(v3json)
        const result = await wallet.signTypedDataV3(eip712)
        return {
          signature: normalizeSign(result),
          signType: SignType.EIP712,
        }
      }
    } catch (e) {
      if (e instanceof UnsupportEIP712Error) {
        console.log('the wallet does not support eip712, fall back to normal personal sign.')
      } else {
        throw e
      }
    }
  }
  // not EIP712
  const result = await wallet.signer.signMessage(ethers.utils.arrayify(orderHash))
  return {
    signature: normalizeSign(result),
    signType: SignType.EthSign,
  }
}

export function getOrderFlag(orderType: number, isCloseOnly: boolean, leverage: number): number {
  let orderFlag: number = 0
  if (isCloseOnly) {
    orderFlag += TradeFlag.MASK_CLOSE_ONLY
  }
  if (orderType == OrderTypeParams.StopOrder) {
    orderFlag += TradeFlag.MASK_STOP_LOSS_ORDER
  }
  return orderFlag + getLeverageFlag(leverage)
}

export function getOrderHash(orderParam: OrderApiRequestParams): string {
  let orderFlag = getOrderFlag(orderParam.orderType, orderParam.isCloseOnly, Number(orderParam.targetLeverage))

  let coder: ethers.utils.AbiCoder = ethers.utils.defaultAbiCoder
  const result = coder.encode(
    ['bytes32', 'address', 'address', 'address', 'address', 'address',
      'int256', 'int256', 'int256', 'int256', 'uint256',
      'uint64', 'uint32', 'uint32', 'uint32', 'uint32'],
    [EIP712_ORDER_TYPE,
      orderParam.address,
      orderParam.brokerAddress,
      orderParam.relayerAddress,
      orderParam.referrerAddress,
      orderParam.liquidityPoolAddress,

      orderParam.minTradeAmount,
      orderParam.amount,
      orderParam.price,
      orderParam.triggerPrice,
      orderParam.chainID,

      Number(orderParam.expiresAt),
      orderParam.perpetualIndex,
      orderParam.brokerFeeLimit, // in gwei
      Number(orderFlag),
      Number(orderParam.salt),
    ],
  )

  return getEIP712MessageHash(keccak256Hex(result))
}

export function getReferralAddress(accountAddress: string): string {
  // {address: 'xx', timestamp: xxx}
  const referralInfo = getLocalStorage(REFERRAL_KEY)
  const referralAddress = referralInfo?.address || ''
  const isValidAddress = ethers.utils.isAddress(referralAddress)
  if(referralAddress !== '' && isValidAddress && referralAddress.toLowerCase() !== accountAddress.toLowerCase()) {
      return referralAddress
  }else {
    return EMPTY_ADDRESS
  }
}
