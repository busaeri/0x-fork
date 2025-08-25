import { ContractTxFunctionObj } from '@0x/base-contract';
import { BigNumber, ChainId, ERC20BridgeSamplerContract, ERC20BridgeSource, FillData } from '../asset-swapper';
import { UNISWAPV4_CONFIG_BY_CHAIN_ID } from '../asset-swapper/utils/market_operation_utils/constants';
import { SamplerContractOperation } from '../asset-swapper/utils/market_operation_utils/sampler_contract_operation';
import {
    SourceQuoteOperation,
    TickDEXMultiPathFillData,
    PathAmount,
} from '../asset-swapper/utils/market_operation_utils/types';

interface BridgeSampler<TFillData extends FillData> {
    createSampleSellsOperation(tokenAddressPath: string[], amounts: BigNumber[]): SourceQuoteOperation<TFillData>;
    createSampleBuysOperation(tokenAddressPath: string[], amounts: BigNumber[]): SourceQuoteOperation<TFillData>;
}

// Interface for UniswapV4 specific fill data
export interface UniswapV4FillData extends TickDEXMultiPathFillData {
    poolManager: string;
    router: string;
    quoter: string;
    poolKeys?: string[]; // Encoded pool keys for V4
}

export class UniswapV4Sampler implements BridgeSampler<UniswapV4FillData> {
    private readonly source: ERC20BridgeSource = ERC20BridgeSource.UniswapV4;
    private readonly samplerContract: ERC20BridgeSamplerContract;
    private readonly chainId: ChainId;
    private readonly poolManagerAddress: string;
    private readonly routerAddress: string;
    private readonly quoterAddress: string;

    constructor(chainId: ChainId, samplerContract: ERC20BridgeSamplerContract) {
        this.chainId = chainId;
        this.samplerContract = samplerContract;
        const config = UNISWAPV4_CONFIG_BY_CHAIN_ID[chainId];
        this.poolManagerAddress = config?.poolManager || '';
        this.routerAddress = config?.router || '';
        this.quoterAddress = config?.quoter || '';
    }

    createSampleSellsOperation(
        tokenAddressPath: string[],
        amounts: BigNumber[],
    ): SourceQuoteOperation<UniswapV4FillData> {
        return this.createSamplerOperation(
            this.samplerContract.sampleSellsFromUniswapV4,
            'sampleSellsFromUniswapV4',
            tokenAddressPath,
            amounts,
        );
    }

    createSampleBuysOperation(
        tokenAddressPath: string[],
        amounts: BigNumber[],
    ): SourceQuoteOperation<UniswapV4FillData> {
        return this.createSamplerOperation(
            this.samplerContract.sampleBuysFromUniswapV4,
            'sampleBuysFromUniswapV4',
            tokenAddressPath,
            amounts,
        );
    }

    private static postProcessSamplerFunctionOutput(
        amounts: BigNumber[],
        poolKeys: string[],
        gasUsed: BigNumber[],
    ): PathAmount[] {
        return poolKeys.map((poolKey, i) => ({
            path: poolKey, // For V4, we use poolKey instead of path
            inputAmount: amounts[i],
            gasUsed: gasUsed[i].toNumber(),
        }));
    }

    private createSamplerOperation(
        samplerFunction: (
            poolManager: string,
            router: string,
            path: string[],
            takerTokenAmounts: BigNumber[],
        ) => ContractTxFunctionObj<[string[], BigNumber[], BigNumber[]]>,
        samplerMethodName: string,
        tokenAddressPath: string[],
        amounts: BigNumber[],
    ): SourceQuoteOperation<UniswapV4FillData> {
        return new SamplerContractOperation({
            source: this.source,
            contract: this.samplerContract,
            function: samplerFunction,
            params: [this.poolManagerAddress, this.routerAddress, tokenAddressPath, amounts],
            callback: (callResults: string, fillData: UniswapV4FillData): BigNumber[] => {
                const [poolKeys, gasUsed, samples] = this.samplerContract.getABIDecodedReturnData<
                    [string[], BigNumber[], BigNumber[]]
                >(samplerMethodName, callResults);
                
                fillData.poolManager = this.poolManagerAddress;
                fillData.router = this.routerAddress;
                fillData.quoter = this.quoterAddress;
                fillData.tokenAddressPath = tokenAddressPath;
                fillData.poolKeys = poolKeys;
                fillData.pathAmounts = UniswapV4Sampler.postProcessSamplerFunctionOutput(amounts, poolKeys, gasUsed);
                return samples;
            },
        });
    }
}
