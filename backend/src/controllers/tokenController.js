// src/controllers/tokenController.js
const { Connection, PublicKey, Keypair, Transaction, SystemProgram } = require('@solana/web3.js');
const { Token, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const dotenv = require('dotenv');
const solanaService = require('../services/solanaService');
const LiquidityPool = require('../models/LiquidityPool');
const CoinModel = require('../models/coinModel');
const Coin = require('../models/coinModel');

dotenv.config();

const connection = new Connection(process.env.SOLANA_CLUSTER_URL, 'confirmed');

// Create a new token
const createToken = async (req) => {
    try {
        console.log('1. Token creation request received:', {
            body: req.body,
            files: req.files
        });

        // Handle FormData fields
        const tokenName = req.body.tokenName;
        const tokenSymbol = req.body.tokenSymbol;
        const payerPublicKey = req.body.payerPublicKey;
        const tokenDetails = req.body.tokenDetails;
        const addOns = req.body.addOns;

        if (!tokenName || !tokenSymbol || !payerPublicKey || !tokenDetails) {
            throw new Error('Missing required fields');
        }

        // Parse tokenDetails and addOns if they're strings
        const parsedTokenDetails = typeof tokenDetails === 'string' 
            ? JSON.parse(tokenDetails) 
            : tokenDetails;

        console.log('Parsed tokenDetails:', parsedTokenDetails);

        const parsedAddOns = typeof addOns === 'string'
            ? JSON.parse(addOns)
            : addOns;

        console.log('2. Parsed data:', {
            name: tokenName,
            symbol: tokenSymbol,
            payer: payerPublicKey,
            details: parsedTokenDetails,
            addOns: parsedAddOns
        });

        // Create token on Solana
        const solanaResult = await solanaService.createToken(payerPublicKey, parsedTokenDetails);
        console.log('3. Solana token created:', solanaResult);

        if (!solanaResult.success) {
            throw new Error('Solana token creation failed');
        }

        // Create new token document
        const newCoin = new CoinModel({
            name: tokenName,
            symbol: tokenSymbol,
            tokenMintAddress: solanaResult.mintAddress,
            creator: payerPublicKey,
            decimals: parsedTokenDetails.decimals || 9,
            initialSupply: parsedTokenDetails.initialSupply || 0,
            fixedSupply: parsedTokenDetails.fixedSupply || false,
            associatedTokenAccount: solanaResult.associatedTokenAccount,
            revokeAuthorities: {
                freeze: parsedTokenDetails.revokeAuthorities?.freeze || false,
                mint: parsedTokenDetails.revokeMint || false,
                update: parsedTokenDetails.revokeUpdate || false
            },
            creatorName: req.body.creatorName || '',
            creatorWebsite: req.body.creatorWebsite || ''
        });

        console.log('4. Attempting to save to MongoDB:', newCoin);
        const savedToken = await newCoin.save();
        console.log('5. Successfully saved to MongoDB:', savedToken);

        return {
            success: true,
            transaction: solanaResult.transaction,
            mintKeypair: solanaResult.mintKeypair,
            savedToken: savedToken
        };

    } catch (error) {
        console.error('Token creation error:', error);
        throw error;
    }
};

// Add burn functionality
const burnTokens = async (req, res) => {
    const { mintAddress, ownerPublicKey, amount } = req.body;

    try {
        const token = new Token(
            connection,
            new PublicKey(mintAddress),
            TOKEN_PROGRAM_ID,
            ownerPublicKey
        );

        const account = await token.getOrCreateAssociatedAccountInfo(new PublicKey(ownerPublicKey));
        await token.burn(account.address, new PublicKey(ownerPublicKey), [], amount);

        res.status(200).json({
            success: true,
            message: 'Tokens burned successfully'
        });

    } catch (err) {
        console.error('Token burn error:', err);
        res.status(500).json({ 
            success: false,
            error: 'Failed to burn tokens',
            details: err.message 
        });
    }
};

const listTokens = async (req, res) => {
    try {
        const { walletAddress } = req.params;
        const tokens = await CoinModel.find({ creator: walletAddress });

        // Get updated token info from Solana, but handle missing tokens gracefully
        const tokenDetails = await Promise.all(
            tokens.map(async (token) => {
                try {
                    const onchainInfo = await solanaService.getTokenInfo(token.tokenMintAddress);
                    return {
                        ...token.toObject(),
                        ...onchainInfo,
                        status: 'active'
                    };
                } catch (error) {
                    console.log(`Token ${token.tokenMintAddress} not found on-chain:`, error.message);
                    return {
                        ...token.toObject(),
                        status: 'not_found'
                    };
                }
            })
        );

        res.json({
            success: true,
            tokens: tokenDetails
        });
    } catch (error) {
        console.error('Error listing tokens:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to list tokens',
            details: error.message
        });
    }
};

const mintMore = async (req, res) => {
    try {
        const { tokenMint, amount, walletAddress } = req.body;
        const result = await solanaService.mintTokens(tokenMint, amount, walletAddress);
        res.json(result);
    } catch (error) {
        console.error('Error minting tokens:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mint tokens',
            details: error.message
        });
    }
};

const freezeToken = async (req, res) => {
    try {
        const { tokenMint, walletAddress } = req.body;
        const result = await solanaService.freezeToken(tokenMint, walletAddress);
        res.json(result);
    } catch (error) {
        console.error('Error freezing token:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to freeze token',
            details: error.message
        });
    }
};

const getLiquidityPoolsForToken = async (req, res) => {
    try {
        const { mintAddress } = req.params;
        const { walletAddress } = req.query;

        // Get associated liquidity pools
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

const getUserTokens = async (req, res) => {
    try {
        const walletAddress = req.params.walletAddress;
        console.log('Getting tokens for wallet:', walletAddress);
        
        // Remove any potential limit and sort by creation date descending
        const coins = await Coin.find({ creator: walletAddress })
            .sort({ createdAt: -1 })
            .limit(0) // explicitly remove limit
            .lean(); // for better performance
            
        console.log(`Found ${coins.length} coins in database`);

        // Map coins to tokens
        const tokens = coins.map(coin => ({
            tokenMintAddress: coin.tokenMintAddress,
            symbol: coin.symbol,
            name: coin.name,
            decimals: coin.decimals,
            initialSupply: coin.initialSupply,
            fixedSupply: coin.fixedSupply,
            associatedTokenAccount: coin.associatedTokenAccount,
            createdAt: coin.createdAt
        }));

        // Log the response
        console.log(`Sending ${tokens.length} tokens to frontend`);

        res.json({
            success: true,
            tokens,
            total: tokens.length
        });
    } catch (error) {
        console.error('Error in getUserTokens:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const getTokenBalance = async (req, res) => {
    try {
        const { mintAddress, walletAddress } = req.params;
        const connection = new Connection(process.env.SOLANA_RPC_URL);
        
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
            new PublicKey(walletAddress),
            { mint: new PublicKey(mintAddress) }
        );

        const balance = tokenAccounts.value[0]?.account.data.parsed.info.tokenAmount.uiAmount || 0;

        res.json({
            success: true,
            balance
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch token balance'
        });
    }
};

// Single exports object at the end
module.exports = {
    createToken,
    burnTokens,
    listTokens,
    mintMore,
    freezeToken,
    getLiquidityPoolsForToken,
    getUserTokens,
    getTokenBalance
};
