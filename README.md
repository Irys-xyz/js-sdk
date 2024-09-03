
# Irys Bundler SDK

![](/assets/irys-sdk.png)


## What is Irys?

[Irys](https://irys.xyz/) is the world's first L1 programmable datachain, designed to . On Irys, you can upload onchain data, deploy smart contracts, and those smart contracts can access and perform verifiable computations on onchain data.

This Irys Bundler SDK is for uploading onchain data. 

## Docs

https://docs.irys.xyz

## What is a Bundler?

Bundlers enable any number of data transactions to be uploaded at once. To upload data to Irys, start by connecting to a bundler and then use one of its  upload functions.

## Repos

The Irys Bundler SDK reduces dependency bloat by providing dedicated packages for each [supported token](https://docs.irys.xyz/build/d/features/supported-tokens). 

Install only the specific packages you require.

### CLI

- [cli](/packages/cli/README.md): The Irys storage CLI.

### EVM Chains

- [ethereum](/packages/ethereum/README.md): Use with NodeJS, contains token-specific packages for all supported EVM tokens.
- [ethereum-web](/packages/ethereum-web/README.md): Use in the browser, contains token-specific packages for all supported EVM tokens.
- [ethereum-ethers-v5](/packages/ethereum-ethers-v5/README.md): Use with the ethers v5 browser provider. 
- [ethereum-ethers-v6](/packages/ethereum-ethers-v6/README.md): Use with the ethers v6 browser provider. 
- [ethereum-viem-v2](/packages/ethereum-viem-v2/README.md): Use with the viem v2 browser provider. 

### Solana

- [solana-node](/packages/solana-node/README.md): Use with NodeJS, contains token-specific packages for all supported Solana tokens. 
- [solana-web](/packages/solana-web/README.md): Use in the browser, contains token-specific packages for all supported Solana tokens. 

### Aptos

- [aptos-node](/packages/aptos-node/README.md): Use with NodeJS and the Aptos token.
- [aptos-web](/packages/aptos-web/README.md): Use in the browser with the Aptos token.

### Core

The Irys core packages are used internally, most users will not need to install them directly. 

- [client-core](/packages/client-core/README.md)
- [client-node](/packages/client-node/README.md)
- [client-web](/packages/client-web/README.md)
