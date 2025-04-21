import { GmxSdk } from "@gmx-io/sdk";
import type { MarketInfo, MarketsInfoData } from "@gmx-io/sdk/types/markets.js";
import type { TokenData, TokensData } from "@gmx-io/sdk/types/tokens.js";
import "dotenv/config";
import { Wallet } from 'ethers';

// Configuration

const MARKET_NAME = 'BTC/USD [BTC-USDC]';
const COLLATERAL_TOKEN_SYMBOL = 'USDC';

// Reading the environment

const readPrivateKeyAddress = (): string => {
  const PRIVATE_KEY = process.env.PRIVATE_KEY || (() => {
    throw new Error("No PRIVATE_KEY found in the environment");
  })();

  const wallet = new Wallet(PRIVATE_KEY);
  return wallet.address;
}

const readWalletAddress = (): string => {
  const WALLET_ADDRESS = process.env.WALLET_ADDRESS || (() => {
    throw new Error("No WALLET_ADDRESS found in the environment");
  })();

  return WALLET_ADDRESS;
}

const getWalletAddress = (): string => {
  try {
    return readPrivateKeyAddress();
  } catch (e) {
    return readWalletAddress();
  }
};

console.log('Address:', getWalletAddress());

// Initializing the SDK

const sdk = new GmxSdk({
  chainId: 42161,
  rpcUrl: "https://arb1.arbitrum.io/rpc",
  oracleUrl: "https://arbitrum-api.gmxinfra.io",
  account: getWalletAddress(),
});

const { marketsInfoData, tokensData } = await sdk.markets.getMarketsInfo();

if (!marketsInfoData || !tokensData) {
  throw new Error("No markets or tokens info data");
}

// Finding the needed markets

let selectedMarket: MarketInfo | null = null;
let selectedToken: TokenData | null = null;

// Print markets
console.log('Markets:');
Object.entries(marketsInfoData as MarketsInfoData).forEach(([marketAddress, market]) => {
  console.log(`- ${market.name}: ${marketAddress}`);
  if (market.name === MARKET_NAME) {
    selectedMarket = market as MarketInfo;
  }
});

// Print tokens
console.log();
console.log('Tokens:');

Object.entries(tokensData as TokensData).forEach(([tokenAddress, token]) => {
  console.log(`- ${token.symbol}: ${tokenAddress}`);
  if (token.symbol === COLLATERAL_TOKEN_SYMBOL) {
    selectedToken = token as TokenData;
  }
});

// Ensure the needed markets exist
if (selectedMarket === null) {
  throw new Error(`Market not found for ${MARKET_NAME}`);
}

if (selectedToken === null) {
  throw new Error(`Token not found by symbol ${COLLATERAL_TOKEN_SYMBOL}`);
}

// Ignore the ts errors below. The SDK is probably just mistyped
sdk.orders.createIncreaseOrder({
  marketsInfoData: marketsInfoData,
  tokensData,
  isLimit: false,
  isLong: true,
  marketAddress: (selectedMarket as MarketInfo).marketTokenAddress,
  allowedSlippage: 50,
  collateralToken: selectedToken,
  collateralTokenAddress: (selectedToken as TokenData).address,
  receiveTokenAddress: (selectedToken as TokenData).address,
  fromToken: selectedToken,
  marketInfo: selectedMarket,
  indexToken: (selectedMarket as MarketInfo).indexToken,
  increaseAmounts: {
    initialCollateralAmount: 3000000n,
    initialCollateralUsd: 2999578868393486100000000000000n,
    collateralDeltaAmount: 2997003n,
    collateralDeltaUsd: 2996582289103961007386100000000n,
    indexTokenAmount: 1919549334876037n,
    sizeDeltaUsd: 5993158579050185227800000000000n,
    sizeDeltaInTokens: 1919536061202302n,
    estimatedLeverage: 20000n,
    indexPrice: 3122169600000000000000000000000000n,
    initialCollateralPrice: 999859622797828700000000000000n,
    collateralPrice: 999859622797828700000000000000n,
    triggerPrice: 0n,
    acceptablePrice: 3122191190655414690893787784152819n,
    acceptablePriceDeltaBps: 0n,
    positionFeeUsd: 2996579289525092613900000000n,
    swapPathStats: undefined,
    uiFeeUsd: 0n,
    swapUiFeeUsd: 0n,
    feeDiscountUsd: 0n,
    borrowingFeeUsd: 0n,
    fundingFeeUsd: 0n,
    positionPriceImpactDeltaUsd: 41444328240807630917223064n,
  },
});
