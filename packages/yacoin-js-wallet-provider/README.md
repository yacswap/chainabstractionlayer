# `@yac-swap/bitcoin-js-wallet-provider` <img align="right" src="https://raw.githubusercontent.com/liquality/chainabstractionlayer/master/liquality-logo.png" height="80px" />

[![Build Status](https://travis-ci.com/liquality/chainabstractionlayer.svg?branch=master)](https://travis-ci.com/liquality/chainabstractionlayer)
[![Coverage Status](https://coveralls.io/repos/github/liquality/chainabstractionlayer/badge.svg?branch=master)](https://coveralls.io/github/liquality/chainabstractionlayer?branch=master)
[![Standard Code Style](https://img.shields.io/badge/codestyle-standard-brightgreen.svg)](https://github.com/standard/standard)
[![MIT License](https://img.shields.io/badge/license-MIT-brightgreen.svg)](../../LICENSE.md)
[![@yac-swap/bitcoin-ledger-provider](https://img.shields.io/npm/dt/@yac-swap/bitcoin-ledger-provider.svg)](https://npmjs.com/package/@yac-swap/bitcoin-ledger-provider)
[![Gitter](https://img.shields.io/gitter/room/liquality/Lobby.svg)](https://gitter.im/liquality/Lobby?source=orgpage)
[![Telegram](https://img.shields.io/badge/chat-on%20telegram-blue.svg)](https://t.me/Liquality) [![Greenkeeper badge](https://badges.greenkeeper.io/liquality/chainabstractionlayer.svg)](https://greenkeeper.io/)

> :warning: This project is under heavy development. Expect bugs & breaking changes.

### :pencil: [Introductory Blog Post: The Missing Tool to Cross-Chain Development](https://medium.com/liquality/the-missing-tool-to-cross-chain-development-2ebfe898efa1)

Query different blockchains with account management using a single and simple interface.

## Installation

```bash
npm i @yac-swap/bitcoin-js-wallet-provider
```

or

```html
<script src="https://cdn.jsdelivr.net/npm/@yac-swap/bitcoin-ledger-provider@0.2.3/dist/bitcoin-ledger-provider.min.js"></script>
<!-- sourceMap at https://cdn.jsdelivr.net/npm/@yac-swap/bitcoin-ledger-provider@0.2.3/dist/bitcoin-ledger-provider.min.js.map -->
<!-- available as window.BitcoinLedgerProvider -->
```

## Usage

```js
import { BitcoinJsWalletProvider } from '@yac-swap/bitcoin-js-wallet-provider'
import { BitcoinNetworks } from '@yac-swap/bitcoin-network'
import { generateMnemonic } from 'bip39'

const jsWallet = new BitcoinJsWalletProvider(
  bitcoinNetworks[config.bitcoin.network],
  config.bitcoin.rpc.host,
  config.bitcoin.rpc.username,
  config.bitcoin.rpc.password,
  generateMnemonic(256),
  'bech32'
)

await jsWallet.getAddresses(0, 1)
```

## License

[MIT](../../LICENSE.md)
