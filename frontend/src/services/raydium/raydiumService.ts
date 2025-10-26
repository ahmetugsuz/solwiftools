import { Connection, PublicKey } from '@solana/web3.js'
import { Token, TokenAmount } from '@raydium-io/raydium-sdk'
import { Liquidity, PoolInfo, PoolKeys } from './liquidity.ts'

export class RaydiumService {
  private connection: Connection
  private liquidity: Liquidity

  constructor(connection: Connection) {
    this.connection = connection
    this.liquidity = new Liquidity(connection)
  }

  async getPoolInfo(poolId: string): Promise<PoolInfo | null> {
    try {
      if (!poolId) return null
      return await this.liquidity.getPoolInfo(poolId)
    } catch (error) {
      console.error('Error fetching pool info:', error)
      return null
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
      return await this.liquidity.createPool(
        baseToken,
        quoteToken,
        baseAmount,
        quoteAmount,
        startTime
      )
    } catch (error) {
      console.error('Error creating pool:', error)
      throw error
    }
  }

  async addLiquidity(
    poolKeys: PoolKeys,
    baseAmount: TokenAmount,
    quoteAmount: TokenAmount,
    fixedSide: 'base' | 'quote'
  ) {
    try {
      return await this.liquidity.addLiquidity(
        poolKeys,
        baseAmount,
        quoteAmount,
        fixedSide
      )
    } catch (error) {
      console.error('Error adding liquidity:', error)
      throw error
    }
  }
}
