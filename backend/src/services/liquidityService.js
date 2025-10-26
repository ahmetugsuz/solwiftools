const { Connection, PublicKey } = require('@solana/web3.js');
const Coin = require('../models/coinModel');
const LiquidityPool = require('../models/LiquidityPool');

class LiquidityService {
    constructor() {
        // Use environment variable for RPC URL
        const rpcUrl = process.env.SOLANA_RPC_URL || 'https://maximum-falling-leaf.solana-mainnet.quiknode.pro/f8542a105543937e8a2a44ae2cd850a1cd2ee6cc/';
        const connection = new Connection(rpcUrl, {
            commitment: 'confirmed',
            confirmTransactionInitialTimeout: 60000,
            wsEndpoint: process.env.SOLANA_WS_URL,
            httpHeaders: {
                'Content-Type': 'application/json',
            }
        });
        this.connection = connection;
    }

    async verifyTokenOwnership(mintAddress, walletAddress) {
        try {
            console.log('Starting token ownership verification:', {
                mintAddress,
                walletAddress,
                connectionUrl: this.connection.rpcEndpoint
            });

            // Validate input addresses
            if (!PublicKey.isOnCurve(new PublicKey(mintAddress))) {
                throw new Error(`Invalid mint address format: ${mintAddress}`);
            }

            if (!PublicKey.isOnCurve(new PublicKey(walletAddress))) {
                throw new Error(`Invalid wallet address format: ${walletAddress}`);
            }

            // Check database
            const coin = await Coin.findOne({ tokenMintAddress: mintAddress });
            console.log('Database coin lookup result:', coin ? 'Found' : 'Not found');
            
            if (!coin) {
                throw new Error(`Coin not found in database: ${mintAddress}`);
            }

            // Get current token balance
            const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
                new PublicKey(walletAddress),
                { mint: new PublicKey(mintAddress) }
            );

            const balance = tokenAccounts.value[0]?.account.data.parsed.info.tokenAmount.uiAmount || 0;
            
            return { 
                token: coin, 
                balance,
                exists: true 
            };
        } catch (error) {
            console.error('Token verification failed:', {
                error: error.message,
                stack: error.stack,
                mintAddress,
                walletAddress
            });
            throw error;
        }
    }

    async createLiquidityPool(poolData) {
        try {
            const { mintAddress, walletAddress, quoteToken, baseAmount, quoteAmount } = poolData;

            // Verify token ownership
            const { token } = await this.verifyTokenOwnership(mintAddress, walletAddress);

            // Create pool using your existing token data
            const poolSetup = await createPool({
                connection: this.connection,
                baseToken: new PublicKey(mintAddress),
                quoteToken: new PublicKey(quoteToken),
                baseAmount,
                quoteAmount
            });

            // Create pool record
            const pool = await LiquidityPool.create({
                poolAddress: poolSetup.poolId.toString(),
                baseToken: {
                    address: mintAddress,
                    symbol: token.symbol,
                    decimals: token.decimals
                },
                quoteToken: {
                    address: quoteToken
                },
                creator: walletAddress,
                totalLiquidity: {
                    baseAmount,
                    quoteAmount
                }
            });

            // Update token with pool reference
            await Coin.findOneAndUpdate(
                { tokenMintAddress: mintAddress },
                { $push: { liquidityPools: pool._id } }
            );

            return { pool, transaction: poolSetup.transaction };
        } catch (error) {
            console.error('Error creating liquidity pool:', error);
            throw error;
        }
    }

    async getPoolInfo(poolAddress) {
        try {
            // Verify pool exists on-chain
            const accountInfo = await this.connection.getAccountInfo(new PublicKey(poolAddress));
            if (!accountInfo) {
                return null;
            }

            // Get pool from database
            const pool = await LiquidityPool.findOne({ poolAddress });
            if (!pool) {
                return null;
            }

            return {
                ...pool.toJSON(),
                exists: true
            };
        } catch (error) {
            console.error('Error getting pool info:', error);
            return null;
        }
    }

    async getTokenBalance(mintAddress, walletAddress) {
        try {
            if (!mintAddress || !walletAddress) {
                return 0;
            }

            const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
                new PublicKey(walletAddress),
                { mint: new PublicKey(mintAddress) }
            );

            return tokenAccounts.value[0]?.account.data.parsed.info.tokenAmount.uiAmount || 0;
        } catch (error) {
            console.warn('Error fetching token balance:', error);
            return 0;
        }
    }

    async addLiquidity(liquidityData) {
        try {
            console.log('Adding liquidity:', liquidityData);
            const { baseToken, solAmount, tokenAmount, publicKey: walletAddress } = liquidityData;

            // Check SOL balance
            const userPubKey = new PublicKey(walletAddress);
            const solBalance = await this.connection.getBalance(userPubKey);
            
            if (solBalance < solAmount) {
                throw new Error(`Insufficient SOL balance. Available: ${solBalance}, Requested: ${solAmount}`);
            }

            // Check token balance
            const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
                userPubKey,
                { mint: new PublicKey(baseToken.tokenMintAddress) }
            );
            
            const tokenBalance = tokenAccounts.value[0]?.account.data.parsed.info.tokenAmount.uiAmount || 0;
            
            if (tokenBalance < tokenAmount) {
                throw new Error(`Insufficient token balance. Available: ${tokenBalance}, Requested: ${tokenAmount}`);
            }

            // Find the pool
            const pool = await LiquidityPool.findOne({
                tokenMintAddress: baseToken.tokenMintAddress
            });

            if (!pool) {
                throw new Error('Pool not found');
            }

            // Update pool amounts
            pool.totalSol += parseFloat(solAmount);
            pool.totalTokens += parseFloat(tokenAmount);

            await pool.save();
            
            console.log('Updated pool after adding liquidity:', {
                totalSol: pool.totalSol,
                totalTokens: pool.totalTokens
            });

            return {
                success: true,
                pool: pool.toJSON(),
                message: 'Liquidity added successfully'
            };
        } catch (error) {
            console.error('Error adding liquidity:', error);
            throw error;
        }
    }

    async removeLiquidity(liquidityData) {
        try {
            console.log('Removing liquidity:', liquidityData);
            const { baseToken, amount, publicKey: walletAddress } = liquidityData;

            // Find the pool
            const pool = await LiquidityPool.findOne({
                tokenMintAddress: baseToken.tokenMintAddress
            });

            if (!pool) {
                throw new Error('Pool not found');
            }

            // Calculate SOL amount to remove based on current ratio
            const solToRemove = Math.floor((amount * pool.totalSol) / pool.totalTokens);

            // Verify sufficient liquidity
            if (amount > pool.totalTokens || solToRemove > pool.totalSol) {
                throw new Error('Insufficient liquidity in pool');
            }

            // Update pool amounts
            pool.totalSol -= solToRemove;
            pool.totalTokens -= parseFloat(amount);

            await pool.save();

            console.log('Updated pool after removing liquidity:', {
                totalSol: pool.totalSol,
                totalTokens: pool.totalTokens
            });

            return {
                success: true,
                pool: pool.toJSON(),
                removedSol: solToRemove,
                removedTokens: amount,
                message: 'Liquidity removed successfully'
            };
        } catch (error) {
            console.error('Error removing liquidity:', error);
            throw error;
        }
    }

    // Add this helper method for pool validation
    async validatePool(poolAddress) {
        const pool = await LiquidityPool.findOne({ poolAddress });
        if (!pool) {
            throw new Error('Pool not found');
        }
        return pool;
    }

    async getPoolStats(token) {
        try {
            console.log('Attempting to fetch pool from database for token:', token);
            
            const response = await fetch(`${this.baseUrl}/api/liquidity/pool/${token.tokenMintAddress}`);
            const data = await response.json();
            
            console.log('Database response:', data);

            if (!data.success) {
                throw new Error('Failed to fetch pool data');
            }

            const pool = data.pool;
            console.log('Found pool in database:', pool);

            // If pool exists but has zero SOL, consider it empty
            if (pool && pool.totalSol === 0) {
                return {
                    totalSol: 0,
                    totalTokens: 0,  // Reset tokens to 0 when SOL is 0
                    userShare: 0,
                    exists: true,
                    needsCreation: false,
                    poolAddress: pool.poolAddress
                };
            }

            // Return normal pool stats if not empty
            return {
                totalSol: pool ? pool.totalSol : 0,
                totalTokens: pool ? Math.floor(pool.totalTokens) : 0, // Floor the token amount
                userShare: 0,
                exists: !!pool,
                needsCreation: !pool,
                poolAddress: pool ? pool.poolAddress : null
            };
        } catch (error) {
            console.error('Error fetching pool stats:', error);
            throw error;
        }
    }
}

module.exports = new LiquidityService(); 