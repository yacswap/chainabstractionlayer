import { Client } from '@yac-swap/client';
import * as Terra from '@yac-swap/terra';
import { WalletOptions } from '@yac-swap/types';
import { TerraConfig } from './config';

function getTerraClient(network: Terra.TerraTypes.TerraNetwork) {
    const config = TerraConfig(network);
    const chainProvider = new Terra.TerraChainProvider(network);
    const walletProvider = new Terra.TerraWalletProvider(config.walletOptions as WalletOptions, chainProvider);
    const swapProvider = new Terra.TerraSwapProvider(network.helperUrl, walletProvider);
    return new Client(chainProvider, walletProvider, swapProvider);
}

export const TerraClient = getTerraClient(Terra.TerraNetworks.terra_testnet);
