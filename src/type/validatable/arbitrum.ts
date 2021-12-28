import { BaseInterface, BaseType } from '@/type/baseType'
import { defineBignumberMetadata, defineIntMetadata } from '@/utils/reflect'
import { IntString, BignumberString } from '@/type'
import { ReturnCode } from '@/utils/arbitrum/types'
import gql from 'graphql-tag'
import _ from 'lodash'

export class L2TransactionLog extends BaseType implements BaseInterface {
  address: string = ''
  blockHash: string = ''
  @defineIntMetadata() blockNumber: IntString = '0x0'
  data: string = ''
  @defineIntMetadata() logIndex: IntString = '0x0'
  removed: boolean = false
  topics: Array<string> = []
  transactionHash: string = ''
  @defineIntMetadata() transactionIndex: IntString = '0x0'
}

export class L2TransactionReceipt extends BaseType implements BaseInterface {
  transactionHash: string = ''
  @defineIntMetadata() transactionIndex: IntString = '0x0'
  blockHash: string = ''
  @defineIntMetadata() blockNumber: IntString = '0x0'
  contractAddress: string | null = null
  @defineIntMetadata() gasUsed: IntString = '0x0'
  @defineIntMetadata() cumulativeGasUsed: IntString = '0x0'
  from: string = ''
  to: string = ''
  returnCode: ReturnCode = ReturnCode.Return
  @defineIntMetadata() status: IntString = 0
  returnData: string = '0x'
  logs: Array<L2TransactionLog> = []
  logsBloom: string =
    '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
}

export class TxToL1 extends BaseType implements BaseInterface {
  @defineIntMetadata() id: IntString = '0'
  from: string = ''
  to: string = ''
  data: string = ''
  txHash: string = ''
  @defineIntMetadata() seqNum: IntString = '0'
  @defineIntMetadata() timestamp: IntString = '0'
  @defineIntMetadata() blockNumber: IntString = '0'
}

export class TxToL2 extends BaseType implements BaseInterface {
  @defineIntMetadata() id: IntString = '0'
  from: string = ''
  to: string = ''
  data: string = ''
  txHash: string = ''
  @defineIntMetadata() seqNum: IntString = '0'
  @defineIntMetadata() timestamp: IntString = '0'
  @defineIntMetadata() blockNumber: IntString = '0'
}

export class MessageDelivered extends BaseType implements BaseInterface {
  id: string = ''
  inbox: string = ''
  sender: string = ''
  messageDataHash: string = ''
  beforeInboxAcc: string = ''
  txHash: string = ''
  kind: number = 0
  @defineIntMetadata() messageIndex: IntString = '0'
  @defineIntMetadata() timestamp: IntString = '0'
  @defineIntMetadata() blockNumber: IntString = '0'
  @defineBignumberMetadata() value: BignumberString = '0'
}

export class L2ToL1Transaction extends BaseType implements BaseInterface {
  id: string = ''
  @defineBignumberMetadata() callvalue: BignumberString = ''
  @defineBignumberMetadata() amount: BignumberString = '0'
  caller: string = ''
  destination: string = ''
  @defineIntMetadata() uniqueId: IntString = '0'
  @defineIntMetadata() batchNumber: IntString = '0'
  @defineIntMetadata() indexInBatch: IntString = '0'
  data: string = ''
  @defineIntMetadata() arbBlockNum: IntString = '0'
  @defineIntMetadata() ethBlockNum: IntString = '0'
  @defineIntMetadata() timestamp: IntString = '0'
  txHash: string = ''
  token: string = ''
  from: string = ''
  to: string = ''
}

export class OutboundTransferInitiated extends BaseType implements BaseInterface {
  @defineIntMetadata() id: IntString = '0'
  token: string = ''
  from: string = ''
  to: string = ''
  data: string = ''
  txHash: string = ''
  @defineIntMetadata() transferId: IntString = '0'
  @defineIntMetadata() timestamp: IntString = '0'
  @defineIntMetadata() blockNumber: IntString = '0'
  @defineBignumberMetadata() amount: BignumberString = '0'
}

export class InboundTransferFinalized extends BaseType implements BaseInterface {
  @defineIntMetadata() id: IntString = '0'
  token: string = ''
  from: string = ''
  to: string = ''
  data: string = ''
  txHash: string = ''
  @defineIntMetadata() transferId: IntString = '0'
  @defineIntMetadata() timestamp: IntString = '0'
  @defineIntMetadata() blockNumber: IntString = '0'
  @defineBignumberMetadata() amount: BignumberString = '0'
}

export class QueryMessageDeliveredResult extends BaseType implements BaseInterface {
  static query = gql`
    query($user: String!) {
      messageDelivereds(where: {sender: $user}, orderBy: timestamp, orderDirection: desc) {
        id
        messageIndex
        beforeInboxAcc
        inbox
        kind
        sender
        messageDataHash
        value
        txHash
        timestamp
        blockNumber
      }
    }
  `

  messageDelivereds: MessageDelivered[] = []

  convert(): this {
    super.convert()
    this.messageDelivereds = this.messageDelivereds.map(item => MessageDelivered.fromData(item).convert())
    return this
  }
}

export class QueryTxToL1sResult extends BaseType implements BaseInterface {
  static query = gql`
    query($user: String!) {
      txToL1S(where: {from: $user}) {
        id
        from
        to
        seqNum
        data
        txHash
        timestamp
        blockNumber
      }
    }
  `

  txToL1S: TxToL1[] = []

  convert(): this {
    super.convert()
    this.txToL1S = this.txToL1S.map(item => TxToL1.fromData(item).convert())
    return this
  }
}

export class QueryTxToL2sResult extends BaseType implements BaseInterface {
  static query = gql`
    query($user: String!) {
      txToL2S(where: {from: $user}) {
        id
        from
        to
        seqNum
        data
        txHash
        timestamp
        blockNumber
      }
    }
  `

  txToL2S: TxToL2[] = []

  convert(): this {
    super.convert()
    this.txToL2S = this.txToL2S.map(item => TxToL2.fromData(item).convert())
    return this
  }
}

export class QueryOutboundTransferInitiatedResult extends BaseType implements BaseInterface {
  static query = gql`
    query($user: String!) {
      outboundTransferInitiateds(where: {from: $user}) {
        id
        transferId
        from
        to
        token
        amount
        data
        txHash
        timestamp
        blockNumber
      }
    }
  `

  outboundTransferInitiateds: OutboundTransferInitiated[] = []

  convert(): this {
    super.convert()
    this.outboundTransferInitiateds = this.outboundTransferInitiateds.map(item => OutboundTransferInitiated.fromData(item).convert())
    return this
  }
}

export class QueryInboundTransferFinalizedResult extends BaseType implements BaseInterface {
  static query = gql`
    query($user: String!) {
      inboundTransferFinalizeds(where: {from: $user}) {
        id
        transferId
        from
        to
        token
        amount
        data
        txHash
        timestamp
        blockNumber
      }
    }
  `

  inboundTransferFinalizeds: InboundTransferFinalized[] = []

  convert(): this {
    super.convert()
    this.inboundTransferFinalizeds = this.inboundTransferFinalizeds.map(item => InboundTransferFinalized.fromData(item).convert())
    return this
  }
}

export class QueryL2ToL1TransactionsResult extends BaseType implements BaseInterface {
  static query = gql`
    query($user: String!) {
      ethTransactions: l2ToL1Transactions(where: {destination: $user, data: "0x"}, orderBy: timestamp, orderDirection: desc) {
        ...Transaction
      }
      erc20Transactions: l2ToL1Transactions(where: {to: $user}, orderBy: timestamp, orderDirection: desc) {
        ...Transaction
      }
    }

    fragment Transaction on L2ToL1Transaction {
      id
      destination
      uniqueId
      caller
      batchNumber
      indexInBatch
      timestamp
      data
      arbBlockNum
      ethBlockNum
      token
      callvalue
      txHash
      from
      to
      amount
    }
  `

  ethTransactions: L2ToL1Transaction[] = []
  erc20Transactions: L2ToL1Transaction[] = []

  /**
   * @ignore
   */
  get transactions(): L2ToL1Transaction[] {
    return _.orderBy(_.union(this.ethTransactions, this.erc20Transactions), 'timestamp', 'desc')
  }

  convert(): this {
    super.convert()
    this.erc20Transactions = this.erc20Transactions.map(item => L2ToL1Transaction.fromData(item).convert())
    this.ethTransactions = this.ethTransactions.map(item => L2ToL1Transaction.fromData(item).convert())
    return this
  }
}
