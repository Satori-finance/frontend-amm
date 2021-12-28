import { BaseInterface, BaseType } from '@/type/baseType'
import { defineBignumberMetadata, defineIntMetadata, defineMomentUnixMetadata } from '@/utils/reflect'
import { BignumberString, IntString, MomentString } from '@/type'
import gql from 'graphql-tag'


export class DaoGovernor extends BaseType implements BaseInterface {
  id: string = ''
  proposalCount: IntString = '0'
}

export class DaoGovernorProposal extends BaseType implements BaseInterface {
  id: string = ''
  proposer?: DaoGovernorUser = new DaoGovernorUser()
  targets: string[] = []
  values: IntString[] = []
  signatures: string[] = []
  calldatas: string[] = [] // ['0x000'],0x
  description: string = ''
  isExecuted: boolean = false
  @defineIntMetadata() eta: IntString = '0'
  @defineIntMetadata() startBlock: IntString = '0'
  @defineIntMetadata() endBlock: IntString = '0'
  @defineIntMetadata() executedBlockNumber: IntString = '0'
  @defineBignumberMetadata() for: BignumberString = '0'
  @defineBignumberMetadata() against: BignumberString = '0'
  @defineMomentUnixMetadata() timestamp: MomentString = ''
  votes?: DaoGovernorVote[] = []
  state?: number = 0

  startTimestamp?: number = 0
  endTimestamp?: number = 0


  /**
  * @ignore
  */
  get proposalId(): string {
    return this.id
  }

  /**
   * @ignore
   */
  get newValues(): string[] {
    let result: string[] = []
    this.values.forEach((v) => {
      result.push(String(v))
    })
    return result
  }
}

export class DaoGovernorVote extends BaseType implements BaseInterface {
  id: string = ''
  voter?: DaoGovernorUser = new DaoGovernorUser()
  support?: boolean = false
  @defineBignumberMetadata() votes?: BignumberString = '0'
}

export class DaoGovernorUser extends BaseType implements BaseInterface {
  id = ''
}

export class DaoGovernorDelegate extends BaseType implements BaseInterface {
  id = ''
  delegatee?: DaoGovernorUser | null = new DaoGovernorUser()
  delegators?: DaoGovernorUser[] = []
}

export class QueryDaoProposalListResult extends BaseType implements BaseInterface {
  static query = gql`
    query($id: String!, $skip: Int!, $row: Int!) {
      proposals: proposals(
        orderBy: timestamp
        orderDirection: desc
        skip: $skip
        first: $row
      ) {
        id
        targets
        values
        description
        calldatas
        signatures
        isExecuted
        for
        against
        startBlock
        endBlock
        executedBlockNumber
        timestamp
        eta
      }
      daoGovernors: daos (id: $id) {
        id
        proposalCount
      }
    }
  `

  proposals: DaoGovernorProposal[] = []
  daoGovernors: DaoGovernor[] = []

  /**
   * @ignore
   */
  get daoGovernor(): DaoGovernor | null {
    if (this.daoGovernors.length > 0) {
      return this.daoGovernors[0]
    }
    return null
  }


  convert(): this {
    super.convert()
    this.proposals = this.proposals.map((m) => DaoGovernorProposal.fromData(m).convert())
    this.daoGovernors = this.daoGovernors.map((m) => DaoGovernor.fromData(m).convert())
    return this
  }
}

export class QueryDaoProposalResultByIndexResult extends BaseType implements BaseInterface{
  static query = gql`
    query ($index: String, $id: String) {
      proposals: proposals(
        where: {id: $index}
      ){
        id
        proposer {
          id
        }
        targets
        values
        description
        calldatas
        signatures
        isExecuted
        for
        against
        startBlock
        endBlock
        executedBlockNumber
        eta
        votes {
          id
          voter {
            id
          }
          support
          votes
        }
        timestamp
      }
    }
  `
  proposals: DaoGovernorProposal[] = []

  convert(): this {
    super.convert()
    this.proposals = this.proposals.map((m) => DaoGovernorProposal.fromData(m).convert())
    return this
  }
}

export class QueryDaoVoteDelegateInfoResult extends BaseType implements BaseInterface{
  static query = gql`
    query($userAddress: String!) {
      delegates: users(where: {
        id: $userAddress,
      }) {
        id
        delegatee {
          id
        }
        delegators {
          id
        }
      }
    }
  `
  delegates: DaoGovernorDelegate[] = []

  convert(): this {
    super.convert()
    this.delegates = this.delegates.map((m) => DaoGovernorDelegate.fromData(m).convert())
    return this
  }
}
