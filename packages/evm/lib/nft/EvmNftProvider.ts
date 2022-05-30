import { ClientTypes, HttpClient, Nft } from '@chainify/client';
import { UnsupportedMethodError } from '@chainify/errors';
import { AddressType, BigNumber, FeeType, Transaction } from '@chainify/types';
import { Signer } from '@ethersproject/abstract-signer';
import { AddressZero } from '@ethersproject/constants';
import { BaseProvider } from '@ethersproject/providers';
import { ERC1155, ERC1155__factory, ERC721, ERC721__factory } from '../typechain';
import { EthersPopulatedTransaction, EthersTransactionResponse, NftTypes } from '../types';
import { toEthereumTxRequest } from '../utils';
import { EvmBaseWalletProvider } from '../wallet/EvmBaseWalletProvider';

type NftContract = ERC721 | ERC1155;
type NftInfo = { contract: NftContract; schema: NftTypes };

export class EvmNftProvider extends Nft<BaseProvider, Signer> {
    private _erc721: ERC721;
    private _erc1155: ERC1155;
    private _cache: Record<string, NftInfo>;
    private _schemas: Record<string, NftContract>;
    private _httpClient: HttpClient;

    constructor(walletProvider: EvmBaseWalletProvider<BaseProvider>, httpConfig: ClientTypes.AxiosRequestConfig) {
        super(walletProvider);

        this._erc721 = ERC721__factory.connect(AddressZero, this.walletProvider.getSigner());
        this._erc1155 = ERC1155__factory.connect(AddressZero, this.walletProvider.getSigner());
        this._cache = {};
        this._schemas = { ERC721: this._erc721, ERC1155: this._erc1155 };
        this._httpClient = new HttpClient(httpConfig);
    }

    public async transfer(
        contractAddress: AddressType,
        receiver: AddressType,
        tokenIDs: number[],
        amounts?: number[],
        data?: string,
        fee?: FeeType
    ): Promise<Transaction<EthersTransactionResponse>> {
        const { schema, contract } = await this._cacheGet(contractAddress);
        const owner = (await this.walletProvider.getAddress()).toString();
        const to = receiver.toString();

        let tx: EthersPopulatedTransaction;

        switch (schema) {
            case NftTypes.ERC721: {
                const _contract: ERC721 = contract as ERC721;
                if (data) {
                    tx = await _contract.populateTransaction['safeTransferFrom(address,address,uint256,bytes)'](
                        owner,
                        to,
                        tokenIDs[0],
                        data
                    );
                } else {
                    tx = await _contract.populateTransaction['safeTransferFrom(address,address,uint256)'](owner, to, tokenIDs[0]);
                }
                break;
            }

            case NftTypes.ERC1155: {
                const _contract: ERC1155 = contract as ERC1155;
                if (tokenIDs.length > 1) {
                    tx = await _contract.populateTransaction.safeBatchTransferFrom(owner, to, tokenIDs, amounts, data);
                } else {
                    tx = await _contract.populateTransaction.safeTransferFrom(owner, to, tokenIDs[0], amounts[0], data);
                }
                break;
            }

            default: {
                throw new UnsupportedMethodError(`Unsupported NFT type: ${schema}`);
            }
        }

        return await this.walletProvider.sendTransaction(toEthereumTxRequest(tx, fee));
    }

    public async balanceOf(contractAddress: AddressType, owners: AddressType[], tokenIDs: number[]): Promise<BigNumber | BigNumber[]> {
        const { schema, contract } = await this._cacheGet(contractAddress);
        const _owners = owners.map((owner) => owner.toString());

        switch (schema) {
            case NftTypes.ERC721: {
                const _contract: ERC721 = contract as ERC721;
                const balance = await _contract.balanceOf(_owners[0]);
                return new BigNumber(balance.toString());
            }

            case NftTypes.ERC1155: {
                const _contract: ERC1155 = contract as ERC1155;
                if (tokenIDs.length > 1) {
                    const balances = await _contract.balanceOfBatch(_owners, tokenIDs);
                    return balances.map((b) => new BigNumber(b.toString()));
                } else {
                    return new BigNumber((await _contract.balanceOf(_owners[0], tokenIDs[0])).toString());
                }
            }

            default: {
                throw new UnsupportedMethodError(`Unsupported NFT type: ${schema}`);
            }
        }
    }

    public async approve(
        contractAddress: AddressType,
        operator: AddressType,
        tokenID: number,
        fee?: FeeType
    ): Promise<Transaction<EthersTransactionResponse>> {
        const { schema, contract } = await this._cacheGet(contractAddress);
        const _operator = operator.toString();

        let tx: EthersPopulatedTransaction;

        switch (schema) {
            case NftTypes.ERC721: {
                const _contract: ERC721 = contract as ERC721;
                tx = await _contract.populateTransaction.approve(_operator, tokenID);
                break;
            }

            case NftTypes.ERC1155: {
                const _contract: ERC1155 = contract as ERC1155;
                tx = await _contract.populateTransaction.setApprovalForAll(_operator, true);
                break;
            }

            default: {
                throw new UnsupportedMethodError(`Unsupported NFT type: ${schema}`);
            }
        }

        return this.walletProvider.sendTransaction(toEthereumTxRequest(tx, fee));
    }

    async isApprovedForAll(contractAddress: AddressType, operator: AddressType): Promise<boolean> {
        const { contract } = await this._cacheGet(contractAddress);
        const owner = await this.walletProvider.getAddress();
        return await contract.isApprovedForAll(owner.toString(), operator.toString());
    }

    public async approveAll(
        contractAddress: AddressType,
        operator: AddressType,
        state: boolean,
        fee?: FeeType
    ): Promise<Transaction<EthersTransactionResponse>> {
        const { contract } = await this._cacheGet(contractAddress);
        const tx = await contract.populateTransaction.setApprovalForAll(operator.toString(), state);
        return this.walletProvider.sendTransaction(toEthereumTxRequest(tx, fee));
    }

    async fetch() {
        const userAddress = await this.walletProvider.getAddress();
        const nfts = await this._httpClient.nodeGet(`assets?owner=${userAddress}`);

        nfts.assets.map((nft: any) => {
            if (nft.asset_contract) {
                const { schema_name, address } = nft.asset_contract;
                if (schema_name && address) {
                    this._cache[address] = {
                        contract: this._schemas[schema_name].attach(address),
                        schema: schema_name as NftTypes,
                    };
                }
            }
        });
        return nfts;
    }

    private async _cacheGet(contractAddress: AddressType): Promise<NftInfo> {
        const _contractAddress = contractAddress.toString();
        if (!this._cache[_contractAddress]) {
            const result = await this._httpClient.nodeGet<null, { schema_name: string }>(`asset_contract/${_contractAddress}`);

            if (!result.schema_name) {
                throw new UnsupportedMethodError(`Cannot find the data for ${_contractAddress}`);
            }

            this._cache[_contractAddress] = {
                contract: this._schemas[result.schema_name]?.attach(_contractAddress),
                schema: result.schema_name as NftTypes,
            };
        }

        return this._cache[_contractAddress];
    }
}
