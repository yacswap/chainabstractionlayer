# @chainify/utils

## 1.0.3

### Patch Changes

-   719c01706: - Ensure that all hashes and addresses have 0x as prefix for the EVM packages
    -   Order of checks insideverifyInitiateSwapTransaction
    -   Fix for `withCachedUtxos`
    -   Proper creation of BitcoinEsploraApiProvider
-   Updated dependencies [719c01706]
    -   @chainify/errors@1.0.3
    -   @chainify/types@1.0.3

## 1.0.2

### Patch Changes

-   8383db002: - fee provider can be null
    -   export typechain from the evm package
    -   remove approval step from initiate swap for evm chains
    -   add gasLimit as optional parameter in the TransactionRequest type
    -   fee provider is now optional for BitcoinEsploraProvider
    -   new evm chain support - Optimism
    -   add wallet and chain update hooks
    -   fix evm fees handlin
-   Updated dependencies [8383db002]
    -   @chainify/errors@1.0.2
    -   @chainify/types@1.0.2

## 1.0.1

### Patch Changes

-   change namespace from @liquality to @chainify
-   Updated dependencies
    -   @chainify/errors@1.0.1
    -   @chainify/types@1.0.1