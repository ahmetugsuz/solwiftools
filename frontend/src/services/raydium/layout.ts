import { PublicKey } from '@solana/web3.js'
import { struct, u8, u64, u128, array } from '@project-serum/borsh'

// Add this helper for PublicKey layout
const publicKey = (property: string) => {
  return struct([u8Array(32)], property)
}

// Add this helper for fixed arrays
const seq = (type: any, len: number, property: string) => {
  return struct([array(type, len)], property)
}

// Add this helper for byte arrays
const u8Array = (len: number) => {
  return array(u8(), len)
}

export interface LiquidityStateV4 {
  withdrawQueue: PublicKey
  lpVault: PublicKey
  version: number
  isInitialized: number
  nonce: number
  baseDecimal: number
  quoteDecimal: number
  baseReserve: PublicKey
  quoteReserve: PublicKey
  lpMint: PublicKey
  baseVault: PublicKey
  quoteVault: PublicKey
  marketId: PublicKey
  marketProgramId: PublicKey
  targetOrders: PublicKey
  openOrders: PublicKey
}

export interface LiquidityStateV5 {
  modelDataAccount: PublicKey
  version: number
  isInitialized: number
  nonce: number
  baseDecimal: number
  quoteDecimal: number
  baseReserve: PublicKey
  quoteReserve: PublicKey
  lpMint: PublicKey
  baseVault: PublicKey
  quoteVault: PublicKey
  marketId: PublicKey
  marketProgramId: PublicKey
  targetOrders: PublicKey
  openOrders: PublicKey
}

export const LIQUIDITY_STATE_LAYOUT_V4 = struct([
  u8('version'),
  u8('isInitialized'),
  u8('nonce'),
  u64('startTime'),
  u64('depositNonce'),
  u64('withdrawNonce'),
  u64('baseDecimal'),
  u64('quoteDecimal'),
  u64('state'),
  u64('resetFlag'),
  u64('minSize'),
  u64('volMaxCutRatio'),
  u64('amountWaveRatio'),
  u64('baseNeedTakePnl'),
  u64('quoteNeedTakePnl'),
  u64('quoteTotalPnl'),
  u64('baseTotalPnl'),
  u128('systemDecimal'),
  u128('baseReserve'),
  u128('quoteReserve'),
  u128('baseTarget'),
  u128('quoteTarget'),
  u128('baseAmount'),
  u128('quoteAmount'),
  seq(u64(), 48, 'padding'),
  publicKey('baseVault'),
  publicKey('quoteVault'),
  publicKey('lpMint'),
  publicKey('openOrders'),
  publicKey('marketId'),
  publicKey('marketProgramId'),
  publicKey('targetOrders'),
  publicKey('withdrawQueue'),
  publicKey('lpVault'),
  publicKey('owner'),
  publicKey('pnlOwner')
])

export const LIQUIDITY_STATE_LAYOUT_V5 = struct([
  u64('accountType'),
  u64('status'),
  u64('nonce'),
  u64('maxOrder'),
  u64('depth'),
  u64('baseDecimal'),
  u64('quoteDecimal'),
  u64('state'),
  u64('resetFlag'),
  u64('minSize'),
  u64('volMaxCutRatio'),
  u64('amountWaveRatio'),
  u64('baseLotSize'),
  u64('quoteLotSize'),
  u64('minPriceMultiplier'),
  u64('maxPriceMultiplier'),
  u64('systemDecimalsValue'),
  u64('abortTradeFactor'),
  u64('priceTickMultiplier'),
  u64('priceTick'),
  // Fees
  u64('minSeparateNumerator'),
  u64('minSeparateDenominator'),
  u64('tradeFeeNumerator'),
  u64('tradeFeeDenominator'),
  u64('pnlNumerator'),
  u64('pnlDenominator'),
  u64('swapFeeNumerator'),
  u64('swapFeeDenominator'),
  // OutPutData
  u64('baseNeedTakePnl'),
  u64('quoteNeedTakePnl'),
  u64('quoteTotalPnl'),
  u64('baseTotalPnl'),
  u64('poolOpenTime'),
  u64('punishPcAmount'),
  u64('punishCoinAmount'),
  u64('orderbookToInitTime'),
  u128('swapBaseInAmount'),
  u128('swapQuoteOutAmount'),
  u128('swapQuoteInAmount'),
  u128('swapBaseOutAmount'),
  u64('swapQuote2BaseFee'),
  u64('swapBase2QuoteFee'),

  publicKey('baseVault'),
  publicKey('quoteVault'),
  publicKey('baseMint'),
  publicKey('quoteMint'),
  publicKey('lpMint'),

  publicKey('modelDataAccount'),
  publicKey('openOrders'),
  publicKey('marketId'),
  publicKey('marketProgramId'),
  publicKey('targetOrders'),
  publicKey('owner'),
  seq(u64(), 64, 'padding')
])