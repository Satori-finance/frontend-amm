export enum ReturnCode {
  Return = '0x0',
  Revert = '0x1',
  Congestion = '0x2',
  InsufficientGasFunds = '0x3',
  InsufficientTxFunds = '0x4',
  BadSequenceCode = '0x5',
  InvalidMessageFormatCode = '0x6',
  UnknownErrorCode = '0x255',
}

export enum MessageCode {
  Eth = 0,
  ERC20 = 1,
  ERC721 = 2,
  L2 = 3,
  Initialization = 4,
  BuddyRegistered = 5,
}

export enum L2MessageCode {
  Transaction = 0,
  ContractTransaction = 1,
  Call = 2,
  TransactionBatch = 3,
  SignedTransaction = 4,
}

export const ARB_SYS_ADDRESS = '0x0000000000000000000000000000000000000064'
