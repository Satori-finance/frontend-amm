import { Contract, ethers } from 'ethers'
import { TransactionReceipt } from '@ethersproject/abstract-provider'
import store from '@/store'
import { Provider } from '@ethersproject/providers'
import { WalletError } from '@/type'
import { currentChainConfig } from '@/config/chain'
import { ContractReceipt, Event } from '@ethersproject/contracts/'
import { deepCopy } from '@ethersproject/properties'
import { LogDescription } from '@ethersproject/abi'
import { BytesLike } from '@ethersproject/bytes'

function parseTransactionEvents(contract: Contract, receipt: TransactionReceipt): Array<Event> {
  return receipt.logs.map((log) => {
    let event: Event = (<Event>deepCopy(log))
    let parsed: LogDescription | null = null
    try {
      parsed = contract.interface.parseLog(log)
    } catch (e){}

    if (parsed) {
      event.args = parsed.args
      event.decode = (data: BytesLike, topics?: Array<any>) => {
        return contract.interface.decodeEventLog(parsed!.eventFragment, data, topics)
      }
      event.event = parsed.name
      event.eventSignature = parsed.signature
    }

    event.removeListener = () => { return contract.provider }
    event.getBlock = () => {
      return contract.provider.getBlock(receipt.blockHash)
    }
    event.getTransaction = () => {
      return contract.provider.getTransaction(receipt.transactionHash)
    }
    event.getTransactionReceipt = () => {
      return Promise.resolve(receipt)
    }
    return event
  })
}

/**
 *
 * @param transactionResponse
 * @param contract need parse transaction logs
 */
export async function waitTransaction(
  transactionResponse: ethers.providers.TransactionResponse,
  contract?: Contract
): Promise<TransactionReceipt | ContractReceipt> {
  let provider = store.getters['wallet/provider'] as Provider
  if (!provider) {
    throw new WalletError('wallet provider undefined')
  }
  let receipt
  const optionConfig = currentChainConfig.pollingConfig
  try {
    receipt = await ethers.utils.poll(async () => {
      return await provider?.getTransactionReceipt(transactionResponse.hash) || undefined
    }, {
      interval: optionConfig.interval,
      retryLimit: optionConfig.retryLimit,
      ceiling: optionConfig.ceiling,
      floor: optionConfig.floor,
    })
  } catch (e) {
    if (e.message === 'timeout' || e.message === 'retry limit reached') {
      receipt = await transactionResponse.wait()
    } else {
      throw e
    }
  }
  // transaction failed
  if (receipt.status === 0) {
    throw new Error(`transaction failed, ${JSON.stringify(receipt)}`)
  }
  // transaction succeeded, parse transaction events
  if (contract) {
    receipt = {
      events: parseTransactionEvents(contract, receipt),
      ...receipt
    }
  }
  return receipt
}


