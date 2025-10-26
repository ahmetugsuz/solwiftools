import { 
    createMintToCheckedInstruction,
    createTransferCheckedInstruction,
    getAssociatedTokenAddress,
    getAccount,
    createAssociatedTokenAccountInstruction,
    TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { Connection, Transaction, PublicKey, Keypair, sendAndConfirmTransaction } from '@solana/web3.js';
import axios from 'axios';
import { RaydiumService } from './raydium/raydiumService.ts';

const API_URL = 'http://localhost:5050/api/liquidity';

export class LiquidityService {
    constructor(wallet) {
        if (!wallet) {
            throw new Error('Wallet is required for LiquidityService');
        }
        this.wallet = wallet;
        const rpcUrl = 'https://maximum-falling-leaf.solana-mainnet.quiknode.pro/f8542a105543937e8a2a44ae2cd850a1cd2ee6cc/';
        
        this.connection = new Connection(rpcUrl, {
            commitment: 'confirmed',
            wsEndpoint: 'wss://maximum-falling-leaf.solana-mainnet.quiknode.pro/f8542a105543937e8a2a44ae2cd850a1cd2ee6cc/',
            confirmTransactionInitialTimeout: 60000
        });
        
        this.requestQueue = Promise.resolve();
        
        try {
            this.raydiumService = new RaydiumService(this.connection);
        } catch (error) {
            console.error('Failed to initialize RaydiumService:', error);
            throw error;
        }
    }

    // Helper method to queue requests
    async queueRequest(callback) {
        return new Promise((resolve, reject) => {
            this.requestQueue = this.requestQueue
                .then(() => callback())
                .then(resolve)
                .catch(reject)
                .finally(() => new Promise(res => setTimeout(res, 200))); // 200ms delay between requests
        });
    }

    async createPool(poolData) {
        try {
            if (!this.raydiumService) {
                throw new Error('Raydium service not initialized');
            }

            console.log('Creating pool with data:', poolData);

            // Format the data for the backend
            const formattedData = {
                baseToken: {
                    mint: poolData.baseToken.tokenMintAddress,
                    decimals: poolData.baseToken.decimals,
                    symbol: poolData.baseToken.symbol
                },
                solAmount: poolData.solAmount,
                tokenAmount: poolData.tokenAmount,
                walletAddress: poolData.publicKey,
                // Include any other necessary data
            };

            console.log('Sending to backend:', formattedData);

            // Send to backend
            const response = await axios.post(`${API_URL}/create`, formattedData);

            console.log('Backend response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error creating pool:', error);
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error('Backend error details:', error.response.data);
                throw new Error(error.response.data.message || 'Server error occurred');
            } else if (error.request) {
                // The request was made but no response was received
                throw new Error('No response from server');
            } else {
                // Something happened in setting up the request that triggered an Error
                throw new Error(error.message || 'Failed to create pool');
            }
        }
    }

    async getPoolStats(token) {
        try {
            if (!token || typeof token !== 'object' || !token.tokenMintAddress) {
                console.warn('Invalid token object:', token);
                return {
                    totalSol: 0,
                    totalTokens: 0,
                    userShare: 0,
                    exists: false,
                    needsCreation: true
                };
            }

            console.log('Attempting to fetch pool from database for token:', {
                symbol: token.symbol,
                mintAddress: token.tokenMintAddress
            });

            // First try to get pool info from our database
            try {
                const url = `${API_URL}/pool/${token.tokenMintAddress}`;
                console.log('Making request to:', url);
                
                const response = await axios.get(url);
                console.log('Database response:', response.data);

                if (response.data.success && response.data.pool) {
                    console.log('Found pool in database:', response.data.pool);
                    // Make sure we're using the raw lamports value for totalSol
                    const poolStats = {
                        totalSol: Number(response.data.pool.totalSol), // Store as lamports
                        totalTokens: Number(response.data.pool.totalTokens),
                        userShare: 0,
                        exists: true,
                        needsCreation: false,
                        poolAddress: response.data.pool.poolAddress
                    };
                    console.log('Returning pool stats:', poolStats);
                    return poolStats;
                }
            } catch (error) {
                console.error('Error fetching pool from database:', {
                    status: error.response?.status,
                    data: error.response?.data,
                    message: error.message
                });
                
                if (error.response?.status === 404) {
                    console.log('Pool not found in database for token:', token.symbol);
                    return {
                        totalSol: 0,
                        totalTokens: 0,
                        userShare: 0,
                        exists: false,
                        needsCreation: true,
                        tokenMintAddress: token.tokenMintAddress
                    };
                }
            }

            // If database check failed for other reasons, try Raydium as fallback
            console.log('Checking Raydium for pool...');
            const poolInfo = await this.raydiumService.getPoolInfo(token.tokenMintAddress);

            // If no pool exists, indicate that one needs to be created
            if (!poolInfo) {
                console.log('No pool exists for token:', token.symbol);
                return {
                    totalSol: 0,
                    totalTokens: 0,
                    userShare: 0,
                    exists: false,
                    needsCreation: true,
                    tokenMintAddress: token.tokenMintAddress
                };
            }

            console.log('Raw pool info:', {
                baseReserve: poolInfo?.baseReserve?.toString(),
                quoteReserve: poolInfo?.quoteReserve?.toString(),
                poolKeys: poolInfo?.poolKeys
            });

            // Use fixed decimals for SOL (9) and token decimals from token info
            const baseDecimals = 9; // SOL always has 9 decimals
            const quoteDecimals = token.decimals || 9;

            // Store the raw lamports value for SOL
            const baseReserve = poolInfo.baseReserve ? 
                Number(poolInfo.baseReserve.toString()) : 0;
            const quoteReserve = poolInfo.quoteReserve ? 
                Number(poolInfo.quoteReserve.toString()) / Math.pow(10, quoteDecimals) : 0;

            return {
                totalSol: baseReserve, // Store as lamports
                totalTokens: quoteReserve,
                userShare: 0,
                exists: true,
                needsCreation: false,
                poolAddress: poolInfo.poolKeys.id.toString()
            };

        } catch (error) {
            console.error('Error in getPoolStats:', error);
            return {
                totalSol: 0,
                totalTokens: 0,
                userShare: 0,
                exists: false,
                needsCreation: true,
                error: error.message,
                tokenMintAddress: token?.tokenMintAddress
            };
        }
    }

    async addLiquidity(liquidityData) {
        try {
            const response = await axios.post(`${API_URL}/add`, liquidityData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async removeLiquidity(liquidityData) {
        try {
            const response = await axios.post(`${API_URL}/remove`, liquidityData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getPools(walletAddress) {
        try {
            const response = await axios.get(`${API_URL}/pools`, {
                params: { walletAddress }
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getUserTokens(walletAddress) {
        try {
            if (!walletAddress) {
                console.error('No wallet address provided');
                throw new Error('Wallet address is required');
            }

            console.log('Fetching tokens for wallet:', walletAddress);

            // First try to get tokens from backend
            try {
                const response = await axios.get(`/api/tokens/user/${walletAddress}`);
                console.log('Backend response:', response.data);

                if (response.data.success && response.data.tokens) {
                    const tokens = response.data.tokens;
                    console.log('Found tokens from backend:', tokens.length);
                    return { tokens };
                }
            } catch (error) {
                console.error('Backend request failed:', error.response || error);
            }

            // Fallback to on-chain data if backend fails
            const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
                new PublicKey(walletAddress),
                {
                    programId: TOKEN_PROGRAM_ID
                }
            );

            console.log('On-chain token accounts found:', tokenAccounts.value.length);

            const tokens = tokenAccounts.value.map(ta => {
                const accountData = ta.account.data.parsed.info;
                return {
                    tokenMintAddress: accountData.mint,
                    balance: accountData.tokenAmount.uiAmount,
                    decimals: accountData.tokenAmount.decimals,
                    symbol: 'Unknown',
                    name: `Token ${accountData.mint.slice(0, 4)}...`
                };
            }).filter(token => token.balance > 0);

            console.log('Processed tokens:', tokens);

            return { tokens };

        } catch (error) {
            console.error('Error in getUserTokens:', {
                error,
                message: error.message,
                stack: error.stack
            });
            throw new Error(`Failed to fetch user tokens: ${error.message}`);
        }
    }

    async getPoolInfo(poolId) {
        try {
            if (!poolId || !this.raydiumService) {
                return { exists: false, needsCreation: true };
            }

            const poolInfo = await this.raydiumService.getPoolInfo(poolId);
            
            if (!poolInfo || poolInfo.error) {
                return { 
                    exists: false, 
                    needsCreation: true, 
                    error: poolInfo?.error 
                };
            }

            return { exists: true, pool: poolInfo };
        } catch (error) {
            console.error('Failed to fetch pool info:', error);
            return { 
                exists: false, 
                needsCreation: true, 
                error: error.message 
            };
        }
    }

    async getTokenBalance(mintAddress, walletAddress) {
        return this.queueRequest(async () => {
            try {
                if (!mintAddress || !walletAddress) {
                    console.warn('Missing parameters:', { mintAddress, walletAddress });
                    return 0;
                }

                // Validate mint address format
                try {
                    new PublicKey(mintAddress);
                } catch (error) {
                    console.warn('Invalid mint address format:', mintAddress);
                    return 0;
                }

                const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
                    new PublicKey(walletAddress),
                    { mint: new PublicKey(mintAddress) }
                );

                if (!tokenAccounts.value.length) {
                    return 0;
                }

                return tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
            } catch (error) {
                if (error.message.includes('could not find mint')) {
                    console.warn('Mint not found:', mintAddress);
                    return 0;
                }
                console.warn('Error fetching token balance:', error);
                return 0;
            }
        });
    }

    async mintTokens(token, amount) {
        try {
            if (!this.wallet.publicKey) {
                throw new Error('Wallet not connected');
            }

            // Create transaction
            const transaction = new Transaction();

            // Get the mint public key
            const mintPubkey = new PublicKey(token.tokenMintAddress);

            // Get the user's ATA
            const userATA = await getAssociatedTokenAddress(
                mintPubkey,
                this.wallet.publicKey
            );

            // Create ATA if it doesn't exist
            try {
                await getAccount(this.connection, userATA);
            } catch (error) {
                transaction.add(
                    createAssociatedTokenAccountInstruction(
                        this.wallet.publicKey,
                        userATA,
                        this.wallet.publicKey,
                        mintPubkey
                    )
                );
            }

            // Calculate mint amount with decimals
            const mintAmount = amount * Math.pow(10, token.decimals);

            // Add mint instruction
            transaction.add(
                createMintToCheckedInstruction(
                    mintPubkey,
                    userATA,
                    this.wallet.publicKey, // mint authority
                    mintAmount,
                    token.decimals
                )
            );

            // Sign and send transaction
            const signature = await this.wallet.sendTransaction(transaction, this.connection);
            await this.connection.confirmTransaction(signature, 'confirmed');

            // Get final balance
            const userAccount = await getAccount(this.connection, userATA);
            const finalBalance = Number(userAccount.amount) / Math.pow(10, token.decimals);

            return {
                success: true,
                signature,
                message: `Successfully minted ${amount} ${token.symbol} tokens`,
                balance: finalBalance
            };

        } catch (error) {
            console.error('Error in mintTokens:', error);
            throw new Error(`Failed to mint tokens: ${error.message}`);
        }
    }

    handleError(error) {
        console.error('Service error:', error);
        return {
            message: error.message || 'An error occurred',
            status: error.response?.status || 500,
            details: error.response?.data || error
        };
    }
} 