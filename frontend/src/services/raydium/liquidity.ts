import { Connection, PublicKey } from '@solana/web3.js'
import { Currency, Token, TokenAmount } from '@raydium-io/raydium-sdk'
import { LIQUIDITY_STATE_LAYOUT_V4, LIQUIDITY_STATE_LAYOUT_V5 } from './layout.ts'
import BN from 'bn.js'
// Replace @project-serum/serum import with a mock or install the package
// import { OpenOrders } from '@project-serum/serum'
// Mock OpenOrders class until you can install the proper dependency
class OpenOrders {
  baseTokenTotal: BN;
  quoteTokenTotal: BN;

  constructor(baseTokenTotal: BN, quoteTokenTotal: BN) {
    this.baseTokenTotal = baseTokenTotal;
    this.quoteTokenTotal = quoteTokenTotal;
  }

  static async load(connection: Connection, address: PublicKey, programId: PublicKey): Promise<OpenOrders> {
    // Mock implementation
    return new OpenOrders(new BN(0), new BN(0));
  }
}
import { Transaction } from '@solana/web3.js'
import { RaydiumError, RaydiumErrorCode } from './errors.ts'

export interface RaydiumPool {
  id: PublicKey
  baseMint: PublicKey
  quoteMint: PublicKey
  lpMint: PublicKey
  baseDecimals: number
  quoteDecimals: number
  lpDecimals: number
}

export interface PoolState {
  liquidity: TokenAmount
  baseAmount: TokenAmount
  quoteAmount: TokenAmount
}

export interface SwapParams {
  tokenIn: Token
  tokenOut: Token
  amountIn: TokenAmount
  slippage: number
}

export interface PoolKeys {
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
  withdrawQueue: PublicKey
  lpVault: PublicKey
  marketVersion: number
  marketProgramId: PublicKey
  marketId: PublicKey
  marketAuthority: PublicKey
  marketBaseVault: PublicKey
  marketQuoteVault: PublicKey
  marketBids: PublicKey
  marketAsks: PublicKey
  marketEventQueue: PublicKey
}

export interface PoolInfo {
  poolKeys: PoolKeys
  baseReserve: BN
  quoteReserve: BN
  lpSupply: BN
  startTime: BN
}

// Adjust rate limiting constants
const INITIAL_BACKOFF = 3000; // Start with 3 seconds
const MAX_BACKOFF = 15050;    // Max 15 seconds
const MAX_RETRIES = 5;
const MINIMUM_REQUEST_INTERVAL = 2000; // 2 seconds between requests

// At the top of your file, add this custom Token class
class CustomToken {
  public mint: PublicKey;
  public decimals: number;
  public symbol: string;
  public name: string;
  public icon: string;
  public programId: PublicKey;

  constructor(
    mint: PublicKey,
    decimals: number,
    symbol: string = '',
    name: string = '',
    icon: string = ''
  ) {
    this.mint = mint;
    this.decimals = decimals;
    this.symbol = symbol;
    this.name = name;
    this.icon = icon;
    this.programId = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
  }

  equals(other: CustomToken): boolean {
    return this.mint.equals(other.mint);
  }
}

export class Liquidity {
  private connection: Connection
  private requestCache: Map<string, {data: any, timestamp: number}> = new Map()
  private lastRequestTime: number = 0
  private requestQueue: Promise<any> = Promise.resolve()

  constructor(connection: Connection) {
    this.connection = connection
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minimumDelay = MINIMUM_REQUEST_INTERVAL;

    if (timeSinceLastRequest < minimumDelay) {
      await this.delay(minimumDelay - timeSinceLastRequest);
    }
    this.lastRequestTime = Date.now();
  }

  private async retryWithBackoff<T>(operation: () => Promise<T>): Promise<T> {
    let retries = 0;
    let lastError: any;

    while (retries < MAX_RETRIES) {
      try {
        await this.enforceRateLimit();
        
        if (retries > 0) {
          const backoff = Math.min(
            INITIAL_BACKOFF * Math.pow(2, retries),
            MAX_BACKOFF
          );
          console.log(`Retry ${retries + 1}/${MAX_RETRIES}, waiting ${backoff}ms...`);
          await this.delay(backoff);
        }

        return await operation();
      } catch (error: any) {
        lastError = error;
        if (error.message?.includes('429') || error.message?.includes('rate limit')) {
          retries++;
          continue;
        }
        throw error;
      }
    }
    
    console.error('Max retries exceeded:', lastError);
    // Use RaydiumError for rate limit errors
    throw new RaydiumError(
      RaydiumErrorCode.RATE_LIMIT_ERROR,
      `Max retries exceeded: ${lastError.message}`,
      { retries: MAX_RETRIES, lastError }
    );
  }

  async findPoolByTokenMint(tokenMint: string): Promise<string | null> {
    try {
        // Only try the main program first to reduce requests
        const RAYDIUM_PROGRAM_ID = '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8';
        
        await this.enforceRateLimit();
        
        // Get all pools in one request instead of searching multiple times
        const pools = await this.connection.getProgramAccounts(
            new PublicKey(RAYDIUM_PROGRAM_ID),
            {
                filters: [
                    {
                        memcmp: {
                            offset: 72,
                            bytes: tokenMint
                        }
                    }
                ]
            }
        );

        if (pools.length > 0) {
            return pools[0].pubkey.toString();
        }

        return null;
    } catch (error) {
        console.error('Error in findPoolByTokenMint:', error);
        // Use RaydiumError for better error reporting
        throw new RaydiumError(
          RaydiumErrorCode.POOL_NOT_FOUND,
          `Failed to find pool for token: ${tokenMint}`,
          { tokenMint, error: error.message }
        );
    }
  }

  async getPoolInfo(tokenMint: string): Promise<PoolInfo | null> {
    try {
      // First find the pool ID for this token
      const poolId = await this.findPoolByTokenMint(tokenMint);
      
      if (!poolId) {
        console.log('No pool found for token:', tokenMint);
        return null;
      }

      console.log(`Found pool ID: ${poolId} for token: ${tokenMint}`);

      // Check cache
      const cached = this.requestCache.get(poolId);
      if (cached && (Date.now() - cached.timestamp) < 30000) {
        return cached.data;
      }

      const result = await this.retryWithBackoff(async () => {
        const account = await this.connection.getAccountInfo(new PublicKey(poolId));
        if (!account) {
          console.log(`No account data found for pool: ${poolId}`);
          throw new RaydiumError(
            RaydiumErrorCode.INVALID_POOL_DATA,
            `No account data found for pool: ${poolId}`,
            { poolId }
          );
        }

        console.log(`Got account data for pool: ${poolId}, size: ${account.data.length}`);

        try {
          // Try V4 first
          try {
            const decoded = LIQUIDITY_STATE_LAYOUT_V4.decode(account.data);
            console.log('Successfully decoded pool data with V4 layout');
            
            // Format into PoolInfo
            const poolKeys: PoolKeys = {
              id: new PublicKey(poolId),
              baseMint: decoded.baseMint,
              quoteMint: decoded.quoteMint,
              lpMint: decoded.lpMint,
              baseDecimals: Number(decoded.baseDecimal),
              quoteDecimals: Number(decoded.quoteDecimal),
              lpDecimals: Number(decoded.baseDecimal),
              version: 4,
              programId: account.owner,
              authority: decoded.authority,
              openOrders: decoded.openOrders,
              targetOrders: decoded.targetOrders,
              baseVault: decoded.baseVault,
              quoteVault: decoded.quoteVault,
              withdrawQueue: decoded.withdrawQueue,
              lpVault: decoded.lpVault,
              marketVersion: 3,
              marketProgramId: decoded.marketProgramId,
              marketId: decoded.marketId,
              marketAuthority: decoded.marketAuthority,
              marketBaseVault: decoded.marketBaseVault,
              marketQuoteVault: decoded.marketQuoteVault,
              marketBids: decoded.marketBids,
              marketAsks: decoded.marketAsks,
              marketEventQueue: decoded.marketEventQueue
            }

            const poolInfo = {
              poolKeys,
              baseReserve: decoded.baseReserve,
              quoteReserve: decoded.quoteReserve,
              lpSupply: decoded.lpSupply,
              startTime: decoded.startTime
            }

            // Cache the result
            this.requestCache.set(poolId, {
              data: poolInfo,
              timestamp: Date.now()
            });

            return poolInfo;
          } catch (error) {
            // Try V5 if V4 fails
            console.log('V4 decoding failed, trying V5 layout');
            const decoded = LIQUIDITY_STATE_LAYOUT_V5.decode(account.data);
            console.log('Successfully decoded pool data with V5 layout');
            
            // Format into PoolInfo for V5
            const poolKeys: PoolKeys = {
              id: new PublicKey(poolId),
              baseMint: decoded.baseMint,
              quoteMint: decoded.quoteMint,
              lpMint: decoded.lpMint,
              baseDecimals: Number(decoded.baseDecimal),
              quoteDecimals: Number(decoded.quoteDecimal),
              lpDecimals: Number(decoded.baseDecimal),
              version: 5,
              programId: account.owner,
              authority: decoded.owner,
              openOrders: decoded.openOrders,
              targetOrders: decoded.targetOrders,
              baseVault: decoded.baseVault,
              quoteVault: decoded.quoteVault,
              withdrawQueue: new PublicKey(0), // Not in V5
              lpVault: new PublicKey(0), // Not in V5
              marketVersion: 3,
              marketProgramId: decoded.marketProgramId,
              marketId: decoded.marketId,
              marketAuthority: new PublicKey(0), // Need to derive
              marketBaseVault: new PublicKey(0), // Need to derive
              marketQuoteVault: new PublicKey(0), // Need to derive
              marketBids: new PublicKey(0), // Need to derive
              marketAsks: new PublicKey(0), // Need to derive
              marketEventQueue: new PublicKey(0) // Need to derive
            }

            const poolInfo = {
              poolKeys,
              baseReserve: new BN(decoded.swapBaseInAmount.toString()),
              quoteReserve: new BN(decoded.swapQuoteOutAmount.toString()),
              lpSupply: new BN(0), // Need to fetch from token program
              startTime: new BN(decoded.poolOpenTime.toString())
            }

            // Cache the result
            this.requestCache.set(poolId, {
              data: poolInfo,
              timestamp: Date.now()
            });

            return poolInfo;
          }
        } catch (error) {
          console.error('Error decoding pool data:', error);
          throw new RaydiumError(
            RaydiumErrorCode.UNSUPPORTED_POOL_VERSION,
            `Failed to decode pool data: ${error.message}`,
            { poolId, error }
          );
        }
      });

      return result;
    } catch (error) {
      console.error('Error in getPoolInfo:', error);
      // If it's already a RaydiumError, rethrow it
      if (error instanceof RaydiumError) {
        throw error;
      }
      // Otherwise, wrap it in a RaydiumError
      throw new RaydiumError(
        RaydiumErrorCode.UNKNOWN_ERROR,
        `Failed to get pool info: ${error.message}`,
        { tokenMint, error }
      );
    }
  }

  async createPool(
    baseToken: Token,
    quoteToken: Token, 
    baseAmount: number,
    quoteAmount: number,
    startTime?: number
  ) {
    try {
      // Implementation needed
      throw new RaydiumError(
        RaydiumErrorCode.UNKNOWN_ERROR,
        'Create pool method not implemented',
        { baseToken, quoteToken, baseAmount, quoteAmount, startTime }
      );
    } catch (error) {
      console.error('Error creating pool:', error);
      if (error instanceof RaydiumError) {
        throw error;
      }
      throw new RaydiumError(
        RaydiumErrorCode.UNKNOWN_ERROR,
        `Failed to create pool: ${error.message}`,
        { error }
      );
    }
  }

  async addLiquidity(
    poolKeys: PoolKeys,
    baseAmount: TokenAmount,
    quoteAmount: TokenAmount,
    fixedSide: 'base' | 'quote'
  ) {
    try {
      // Implementation needed
      throw new Error('Not implemented')
    } catch (error) {
      console.error('Error adding liquidity:', error)
      throw error
    }
  }

  async getCompletePoolState(poolInfo: PoolInfo): Promise<PoolState> {
    // Get base token vault balance
    const baseVaultBalance = await this.connection.getTokenAccountBalance(
      poolInfo.poolKeys.baseVault
    );
    
    // Get quote token vault balance
    const quoteVaultBalance = await this.connection.getTokenAccountBalance(
      poolInfo.poolKeys.quoteVault
    );
    
    // Get open orders account to find tokens in orders
    const openOrders = await OpenOrders.load(
      this.connection,
      poolInfo.poolKeys.openOrders,
      poolInfo.poolKeys.marketProgramId
    );
    
    // Calculate total base tokens (vault + open orders)
    const baseTotal = new BN(baseVaultBalance.value.amount)
      .add(new BN(openOrders.baseTokenTotal.toString()));
      
    // Calculate total quote tokens (vault + open orders)
    const quoteTotal = new BN(quoteVaultBalance.value.amount)
      .add(new BN(openOrders.quoteTokenTotal.toString()));
    
    // Get LP token supply
    const lpSupply = await this.connection.getTokenSupply(
      poolInfo.poolKeys.lpMint
    );
    
    return {
      liquidity: new TokenAmount(
        new CustomToken(
          poolInfo.poolKeys.lpMint,
          poolInfo.poolKeys.lpDecimals
        ),
        lpSupply.value.amount
      ),
      baseAmount: new TokenAmount(
        new CustomToken(
          poolInfo.poolKeys.baseMint,
          poolInfo.poolKeys.baseDecimals
        ),
        baseTotal.toString()
      ),
      quoteAmount: new TokenAmount(
        new CustomToken(
          poolInfo.poolKeys.quoteMint,
          poolInfo.poolKeys.quoteDecimals
        ),
        quoteTotal.toString()
      )
    };
  }

  // Add cache invalidation
  private invalidateCache(key?: string): void {
    if (key) {
      this.requestCache.delete(key);
    } else {
      // Invalidate entries older than 2 minutes
      const now = Date.now();
      for (const [key, value] of this.requestCache.entries()) {
        if (now - value.timestamp > 120000) {
          this.requestCache.delete(key);
        }
      }
    }
  }

  // Add swap transaction building
  async buildSwapTransaction(
    poolKeys: PoolKeys,
    userKeys: {
      tokenAccountIn: PublicKey,
      tokenAccountOut: PublicKey,
      owner: PublicKey
    },
    amountIn: BN,
    minAmountOut: BN
  ): Promise<Transaction> {
    const transaction = new Transaction();
    
    // Add necessary instructions for swap
    // 1. Transfer tokens to pool
    // 2. Swap instruction
    // 3. Receive tokens from pool
    
    // This is a simplified example - actual implementation would be more complex
    
    return transaction;
  }

  // Add route swap transaction building for multi-hop swaps
  async buildRouteSwapTransaction(
    pools: PoolKeys[],
    userKeys: {
      tokenAccountIn: PublicKey,
      tokenAccountOut: PublicKey,
      owner: PublicKey
    },
    amountIn: BN,
    minAmountOut: BN
  ): Promise<Transaction> {
    const transaction = new Transaction();
    
    // Add instructions for multi-hop swap
    // This would involve multiple swaps across different pools
    
    return transaction;
  }

  // Enhanced pool discovery
  async findPools(options: {
    baseMint?: string,
    quoteMint?: string,
    lpMint?: string,
    programId?: string
  }): Promise<string[]> {
    try {
      // Define program IDs to search
      const programIds = options.programId ? 
        [new PublicKey(options.programId)] : 
        [
          new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'), // V4
          new PublicKey('5quBtoiQqxF9Jv6KYKctB59NT3gtJD2Y65kdnB1Uev3h')  // V5
        ];
      
      // Define filters with the correct type
      const filters: Array<{
        memcmp: {
          offset: number;
          bytes: string;
        }
      }> = [];
      
      // Add filters based on options
      if (options.baseMint) {
        filters.push({
          memcmp: {
            offset: 72, // Adjust offset based on layout
            bytes: options.baseMint
          }
        });
      }
      
      if (options.quoteMint) {
        filters.push({
          memcmp: {
            offset: 104, // Adjust offset based on layout
            bytes: options.quoteMint
          }
        });
      }
      
      if (options.lpMint) {
        filters.push({
          memcmp: {
            offset: 136, // Adjust offset based on layout
            bytes: options.lpMint
          }
        });
      }
      
      // Search across all program IDs
      const poolIds: string[] = [];
      
      for (const programId of programIds) {
        await this.enforceRateLimit();
        
        const accounts = await this.connection.getProgramAccounts(
          programId,
          {
            filters: filters.length > 0 ? filters : undefined
          }
        );
        
        accounts.forEach(account => {
          poolIds.push(account.pubkey.toString());
        });
      }
      
      return poolIds;
    } catch (error) {
      console.error('Error in findPools:', error);
      return [];
    }
  }
}
