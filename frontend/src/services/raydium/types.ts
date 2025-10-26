import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import { Token, TokenAmount } from '@raydium-io/raydium-sdk'

export interface TokenInfo {
  mint: string;
  decimals: number;
  symbol?: string;
  name?: string;
  icon?: string;
}

export interface TokenAmountInfo {
  token: TokenInfo;
  amount: string;
}

export interface LiquidityPoolInfo {
  status: BN
  baseDecimals: number
  quoteDecimals: number
  lpDecimals: number
  baseReserve: BN
  quoteReserve: BN
  lpSupply: BN
  startTime: BN
}

export interface LiquidityPoolKeys {
  id: PublicKey
  baseMint: PublicKey
  quoteMint: PublicKey
  lpMint: PublicKey
  baseDecimals: number
  quoteDecimals: number
  lpDecimals: number
  version: number
  programId: PublicKey
  authority: PublicKey
  openOrders: PublicKey
  targetOrders: PublicKey
  baseVault: PublicKey
  quoteVault: PublicKey
  marketVersion: number
  marketId: PublicKey
  marketProgramId: PublicKey
  marketAuthority: PublicKey
  marketBaseVault: PublicKey
  marketQuoteVault: PublicKey
  marketBids: PublicKey
  marketAsks: PublicKey
  marketEventQueue: PublicKey
  lookupTableAccount: PublicKey
}

/**
 * Represents a Raydium liquidity pool
 * @property id - The pool's public key
 * @property baseMint - The base token mint address
 * @property quoteMint - The quote token mint address
 * @property lpMint - The LP token mint address
 * @property baseDecimals - Decimals for the base token
 * @property quoteDecimals - Decimals for the quote token
 * @property lpDecimals - Decimals for the LP token
 */
export interface RaydiumPool {
  id: PublicKey
  baseMint: PublicKey
  quoteMint: PublicKey
  lpMint: PublicKey
  baseDecimals: number
  quoteDecimals: number
  lpDecimals: number
}

/**
 * Represents the current state of a liquidity pool
 * @property liquidity - The total LP tokens in circulation
 * @property baseAmount - The total base tokens in the pool
 * @property quoteAmount - The total quote tokens in the pool
 */
export interface PoolState {
  liquidity: TokenAmount
  baseAmount: TokenAmount
  quoteAmount: TokenAmount
}

/**
 * Parameters for a swap operation
 * @property tokenIn - The token being swapped in
 * @property tokenOut - The token being swapped out
 * @property amountIn - The amount of tokenIn to swap
 * @property slippage - The maximum acceptable slippage as a percentage (e.g., 1 = 1%)
 */
export interface SwapParams {
  tokenIn: Token
  tokenOut: Token
  amountIn: TokenAmount
  slippage: number
}
