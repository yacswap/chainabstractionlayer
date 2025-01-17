import { EthereumRpcProvider } from '@yac-swap/ethereum-rpc-provider'
import { EthereumJsWalletProvider } from '@yac-swap/ethereum-js-wallet-provider'
import { EthereumErc20Provider } from '@yac-swap/ethereum-erc20-provider'
import { EthereumErc20SwapProvider } from '@yac-swap/ethereum-erc20-swap-provider'
import { EthereumErc20ScraperSwapFindProvider } from '@yac-swap/ethereum-erc20-scraper-swap-find-provider'
import { EthereumRpcFeeProvider } from '@yac-swap/ethereum-rpc-fee-provider'
import { EthereumNetworks } from '@yac-swap/ethereum-networks'

export default [
  {
    provider: EthereumRpcProvider,
    optional: ['infuraProjectId'],
    args: (config: any) => [
      `https://rinkeby.infura.io/v3/${config.infuraProjectId || '1d8f7fb6ae924886bbd1733951332eb0'}`
    ]
  },
  {
    provider: EthereumJsWalletProvider,
    onlyIf: ['mnemonic'],
    args: (config: any) => [EthereumNetworks.rinkeby, config.mnemonic]
  },
  {
    provider: EthereumErc20Provider,
    requires: ['contractAddress'],
    args: (config: any) => [config.contractAddress]
  },
  {
    provider: EthereumErc20SwapProvider
  },
  {
    provider: EthereumErc20ScraperSwapFindProvider,
    args: ['https://liquality.io/eth-rinkeby-api/']
  },
  {
    provider: EthereumRpcFeeProvider
  }
]
