const { Connection, PublicKey } = require('@solana/web3.js');
const { 
    AmmV4,
    MAINNET_PROGRAM_ID,
    LIQUIDITY_STATE_LAYOUT_V4,
    Market
} = require('@raydium-io/raydium-sdk');
const LiquidityPool = require('../models/LiquidityPool');

const createLiquidityPool = async (req, res) => {
    try {
        console.log('Received create pool request:', req.body);

        const { baseToken, solAmount, tokenAmount, walletAddress } = req.body;

        if (!baseToken || !baseToken.mint || !solAmount || !tokenAmount || !walletAddress) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                received: req.body
            });
        }

        const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://maximum-falling-leaf.solana-mainnet.quiknode.pro/f8542a105543937e8a2a44ae2cd850a1cd2ee6cc/');

        // Create basic pool info
        const poolInfo = {
            id: new PublicKey(baseToken.mint),
            baseMint: new PublicKey(baseToken.mint),
            quoteMint: new PublicKey('So11111111111111111111111111111111111111112'),
            lpMint: new PublicKey(baseToken.mint), // temporary
            baseDecimals: baseToken.decimals || 9,
            quoteDecimals: 9,
            lpDecimals: baseToken.decimals || 9,
            version: 4,
            programId: MAINNET_PROGRAM_ID.AmmV4,
            authority: new PublicKey(walletAddress),
            openOrders: new PublicKey(baseToken.mint), // temporary
            targetOrders: new PublicKey(baseToken.mint), // temporary
            baseVault: new PublicKey(baseToken.mint), // temporary
            quoteVault: new PublicKey(baseToken.mint), // temporary
            withdrawQueue: new PublicKey(baseToken.mint), // temporary
            lpVault: new PublicKey(baseToken.mint), // temporary
            marketVersion: 3,
            marketProgramId: MAINNET_PROGRAM_ID.OPENBOOK_MARKET,
            marketId: new PublicKey(baseToken.mint), // temporary
            marketAuthority: new PublicKey(walletAddress),
            marketBaseVault: new PublicKey(baseToken.mint), // temporary
            marketQuoteVault: new PublicKey(baseToken.mint), // temporary
            marketBids: new PublicKey(baseToken.mint), // temporary
            marketAsks: new PublicKey(baseToken.mint), // temporary
            marketEventQueue: new PublicKey(baseToken.mint) // temporary
        };

        // Create pool record in database
        const pool = new LiquidityPool({
            tokenMintAddress: baseToken.mint,
            poolAddress: poolInfo.id.toString(),
            totalSol: solAmount,
            totalTokens: tokenAmount
        });

        await pool.save();

        console.log('Pool created successfully:', pool);

        res.status(200).json({
            success: true,
            poolAddress: poolInfo.id.toString(),
            pool,
            poolInfo
        });

    } catch (error) {
        console.error('Error creating liquidity pool:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
};

const addLiquidity = async (req, res) => {
    try {
        const {
            poolAddress,
            baseAmount,
            quoteAmount,
            walletPublicKey
        } = req.body;

        const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://maximum-falling-leaf.solana-mainnet.quiknode.pro/f8542a105543937e8a2a44ae2cd850a1cd2ee6cc/');

        // Add liquidity using Raydium SDK
        const addLiquidityTx = await addToPool({
            connection,
            poolId: new PublicKey(poolAddress),
            baseAmount,
            quoteAmount,
            userPublicKey: new PublicKey(walletPublicKey)
        });

        res.status(200).json({
            success: true,
            transaction: addLiquidityTx
        });

    } catch (error) {
        console.error('Error adding liquidity:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const removeLiquidity = async (req, res) => {
    try {
        const {
            poolAddress,
            lpTokenAmount,
            walletPublicKey
        } = req.body;

        const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://maximum-falling-leaf.solana-mainnet.quiknode.pro/f8542a105543937e8a2a44ae2cd850a1cd2ee6cc/');

        // Remove liquidity using Raydium SDK
        const removeLiquidityTx = await removeFromPool({
            connection,
            poolId: new PublicKey(poolAddress),
            lpTokenAmount,
            userPublicKey: new PublicKey(walletPublicKey)
        });

        res.status(200).json({
            success: true,
            transaction: removeLiquidityTx
        });

    } catch (error) {
        console.error('Error removing liquidity:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const getLiquidityPoolsForToken = async (req, res) => {
    try {
        const { mintAddress } = req.params;
        const { walletAddress } = req.query;

        // Get associated liquidity pools without Token model dependency
        const liquidityPools = await LiquidityPool.find({
            'baseToken.address': mintAddress
        });

        res.status(200).json({
            success: true,
            liquidityPools
        });

    } catch (error) {
        console.error('Error fetching liquidity pools:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const getLiquidityPools = async (req, res) => {
    try {
        const { walletAddress } = req.query;

        // Get all liquidity pools for the wallet
        const liquidityPools = await LiquidityPool.find({
            creator: walletAddress
        });

        res.status(200).json({
            success: true,
            liquidityPools
        });

    } catch (error) {
        console.error('Error fetching liquidity pools:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Middleware to verify token ownership
const verifyTokenOwnership = async (req, res, next) => {
    try {
        const { baseToken, walletPublicKey } = req.body;
        
        const token = await LiquidityPool.findOne({ 'baseToken.address': baseToken });
        
        if (!token) {
            return res.status(404).json({
                success: false,
                error: 'Token not found'
            });
        }

        if (token.creator !== walletPublicKey) {
            return res.status(403).json({
                success: false,
                error: 'Only token creator can manage liquidity'
            });
        }

        req.token = token; // Attach token to request for later use
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createLiquidityPool,
    addLiquidity,
    removeLiquidity,
    getLiquidityPools,
    getLiquidityPoolsForToken,
    verifyTokenOwnership
}; 