import { near, SwapParams, SwapProvider, Transaction } from '@yac-swap/types'
import { NodeProvider } from '@yac-swap/node-provider'
import { PendingTxError } from '@yac-swap/errors'
import { addressToString } from '@yac-swap/utils'
import {
  fromBase64,
  toBase64,
  fromNearTimestamp,
  parseReceipt,
  validateSwapParams,
  validateSecretAndHash
} from '@yac-swap/near-utils'

const ONE_DAY_IN_NS = 24 * 60 * 60 * 1000 * 1000 * 1000

export default class NearSwapFindProvider extends NodeProvider implements Partial<SwapProvider> {
  constructor(url: string) {
    super({
      baseURL: url,
      responseType: 'text',
      transformResponse: undefined // https://github.com/axios/axios/issues/907,
    })
  }

  normalizeTransactionResponse(tx: near.NearScraperSwap): near.NearSwapTransaction {
    const normalizedTx = {
      hash: `${tx.hash}_${tx.signer_id}`,
      blockHash: tx.block_hash,
      sender: tx.signer_id,
      receiver: tx.receiver_id,
      rawHash: tx.hash
    } as { [key: string]: any }

    switch (tx.action_kind) {
      case 'DEPLOY_CONTRACT': {
        const code = toBase64(tx.args.code_sha256)
        normalizedTx.code = code
        break
      }

      case 'TRANSFER': {
        const value = tx.args.deposit
        normalizedTx.value = value
        break
      }

      case 'FUNCTION_CALL': {
        const method = tx.args.method_name
        const args = fromBase64(tx.args.args_base64)

        switch (method) {
          case 'init': {
            normalizedTx.swap = {
              method,
              secretHash: fromBase64(args.secretHash, 'hex'),
              expiration: fromNearTimestamp(args.expiration),
              recipient: args.buyer
            }
            break
          }

          case 'claim': {
            normalizedTx.swap = {
              method,
              secret: fromBase64(args.secret, 'hex')
            }

            break
          }

          case 'refund': {
            normalizedTx.swap = { method }
            break
          }

          default: {
            normalizedTx._raw = { method, ...args }
            break
          }
        }
        break
      }

      default: {
        break
      }
    }
    return normalizedTx as near.NearSwapTransaction
  }

  async findAddressTransaction(
    address: string,
    predicate: (tx: near.NearSwapTransaction) => boolean,
    limit = 1024
  ): Promise<Transaction<near.NearSwapTransaction>> {
    let offset = this.getCurrentTimeInNs()

    for (let page = 1; ; page++) {
      const transactions = (await this.nodeGet(
        `account/${address}/activity?offset=${offset}&limit=${limit}`
      )) as near.NearScraperSwap[]

      if (transactions.length === 0) {
        return
      }

      const normalizedTransactions = {} as { [key: string]: near.NearSwapTransaction }

      for (const tx of transactions) {
        normalizedTransactions[tx.hash] = {
          ...normalizedTransactions[tx.hash],
          ...this.normalizeTransactionResponse(tx)
        }
      }

      const tx = Object.values(normalizedTransactions).find(predicate)

      if (tx) {
        const txReceipt = await this.getMethod('getTransactionReceipt')(tx.hash)
        if (!txReceipt || (txReceipt.status && txReceipt.status.Failure)) {
          return
        }

        const currentHeight = await this.getMethod('getBlockHeight')()
        const txBlockHeight = await this.getMethod('getBlockHeight')(tx.blockHash)
        tx.confirmations = currentHeight - txBlockHeight
        return { ...tx, secret: tx.swap.secret, _raw: tx }
      }

      offset = offset - ONE_DAY_IN_NS
    }
  }

  async findInitiateSwapTransaction(swapParams: SwapParams) {
    validateSwapParams(swapParams)

    return this.findAddressTransaction(addressToString(swapParams.refundAddress), (tx: near.NearSwapTransaction) =>
      this.getMethod('doesTransactionMatchInitiation')(swapParams, tx)
    )
  }

  async findClaimSwapTransaction(
    swapParams: SwapParams,
    initiationTxHash: string
  ): Promise<Transaction<near.NearSwapTransaction>> {
    validateSwapParams(swapParams)

    const initiationTransactionReceipt = await this.getMethod('getTransactionReceipt')(initiationTxHash)
    if (!initiationTransactionReceipt) {
      throw new PendingTxError(`Transaction receipt is not available: ${initiationTxHash}`)
    }

    const tx = await this.findAddressTransaction(
      addressToString(parseReceipt(initiationTransactionReceipt).receiver),
      (tx) => {
        if (tx.swap) {
          return tx.swap.method === 'claim'
        }
      }
    )

    if (tx && tx.secret) {
      validateSecretAndHash(tx.secret, swapParams.secretHash)
      return tx
    }
  }

  async findRefundSwapTransaction(
    swapParams: SwapParams,
    initiationTxHash: string
  ): Promise<Transaction<near.NearSwapTransaction>> {
    validateSwapParams(swapParams)

    const initiationTransactionReceipt = await this.getMethod('getTransactionReceipt')(initiationTxHash)
    if (!initiationTransactionReceipt) {
      throw new PendingTxError(`Transaction receipt is not available: ${initiationTxHash}`)
    }

    return this.findAddressTransaction(addressToString(parseReceipt(initiationTransactionReceipt).receiver), (tx) => {
      if (tx.swap) {
        return tx.swap.method === 'refund'
      }
    })
  }

  getCurrentTimeInNs(): number {
    return new Date().valueOf() * 1000 * 1000
  }

  doesBlockScan(): boolean {
    return false
  }
}
