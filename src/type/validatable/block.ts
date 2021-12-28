import { BaseInterface, BaseType } from '@/type/baseType'
import gql from 'graphql-tag'

export class ChainBlock extends BaseType implements BaseInterface {
  id: string = ''
  timestamp: string = ''
  number: string = ''
}

export class QueryChainBlockResult extends BaseType implements BaseInterface {
  static genQuery(timestamp: number) {
    return gql`
      {
        blocks(where: {timestamp_gte: ${timestamp}}, first: 1, orderBy: timestamp, orderDirection: asc) {
          id
          number
          timestamp
        }
      }
    `
  }

  blocks: ChainBlock[] = []

  /**
   * @ignore
   */
  get block() {
    return this.blocks[0] || null
  }
}

export class QueryTimeStampByBlockNumber extends BaseType implements BaseInterface {
  static genQuery(number: Array<number>) {
    return gql`
      {
        blocks(where: {number_in: [${number.join(',')}]}, orderBy: timestamp, orderDirection: asc) {
          id
          number
          timestamp
        }
      }
    `
  }

  blocks: ChainBlock[] = []

  /**
   * @ignore
   */
  get blockList(): Map<string, string> {
    const blockMap = new Map()
    this.blocks.forEach( i => {
      blockMap.set(i.number, i.timestamp)
    })
    return blockMap
  }
}

export class QueryLatestBlockNumber extends BaseType implements BaseInterface {
  static genQuery(subgraphName: string) {

    return gql`
      {
        indexingStatusForCurrentVersion(subgraphName:"mcdexio/${subgraphName}") {
          chains {
            latestBlock {
              number
            }
          }
        }
      }
    `
  }

  indexingStatusForCurrentVersion: { chains: { latestBlock: { number: string } }[] } = {chains:[{ latestBlock:{number:''} }]}

  /**
   * @ignore
   */
  get latestBlock() {
    return this.indexingStatusForCurrentVersion.chains[0].latestBlock.number || null
  }
}
