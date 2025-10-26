// src/routes/tokenRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();
const tokenController = require('../controllers/tokenController');
const Coin = require('../models/coinModel');
const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const { processTokenCreationWithPayment } = require('../utils/tokenPaymentHandler');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { LAMPORTS_PER_SOL } = require('@solana/web3.js');


console.log('Token routes are being loaded!');

// Test route
router.get('/test', (req, res) => {
    res.json({ success: true, message: 'Token routes are working!' });
});

const { calculateTokenCreationCost } = require('../utils/tokenPaymentHandler');

router.post('/pricing/calculate', (req, res) => {
    try {
        const { addOns } = req.body;

        const lamports = calculateTokenCreationCost(addOns || []);
        const sol = lamports / LAMPORTS_PER_SOL;

        res.json({
            success: true,
            costLamports: lamports,
            costSOL: parseFloat(sol.toFixed(6))
        });
    } catch (error) {
        console.error('Error calculating pricing:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


// Token Creation and Management Routes
router.post('/create', upload.single('tokenImage'), async (req, res) => {
    try {
        console.log('Token creation request received:', req.body);
        
        // Handle image upload
        let imageUrl = '';
        if (req.file) {
            // Save the image to a public directory
            const fileName = `${Date.now()}-${req.file.originalname}`;
            const filePath = path.join(__dirname, '../../public/token-images', fileName);
            
            console.log('Saving image:', {
                originalName: req.file.originalname,
                fileName,
                filePath,
                fileSize: req.file.size
            });
            
            // Create directory if it doesn't exist
            await fs.promises.mkdir(path.join(__dirname, '../../public/token-images'), { recursive: true });
            
            // Save the file
            await fs.promises.writeFile(filePath, req.file.buffer);
            
            // Set the URL for accessing the image
            imageUrl = `/token-images/${fileName}`;
            console.log('Image saved successfully:', imageUrl);
        }
        
        // Get token creation result
        const result = await tokenController.createToken(req);
        
        if (!result || !result.success) {
            throw new Error('Token creation failed');
        }

        // Save to MongoDB
        const { tokenName, tokenSymbol, payerPublicKey, tokenDetails } = req.body;
        const parsedTokenDetails = typeof tokenDetails === 'string' 
            ? JSON.parse(tokenDetails) 
            : tokenDetails;

        const newCoin = new Coin({
            name: tokenName,
            symbol: tokenSymbol,
            tokenMintAddress: result.mintKeypair.publicKey.toString(),
            creator: payerPublicKey,
            decimals: parsedTokenDetails.decimals || 9,
            initialSupply: parsedTokenDetails.initialSupply || 0,
            fixedSupply: parsedTokenDetails.fixedSupply || false,
            associatedTokenAccount: result.associatedTokenAccount,
            imageUrl: imageUrl,
            creatorName: req.body.creatorName || '',
            creatorWebsite: req.body.creatorWebsite || '',
            paymentStatus: 'completed'
        });

        const savedToken = await newCoin.save();
        console.log('Token saved with image:', {
            tokenName: savedToken.name,
            imageUrl: savedToken.imageUrl,
            tokenMintAddress: savedToken.tokenMintAddress
        });

        // Send combined response
        res.status(201).json({
            ...result,
            savedToken
        });

    } catch (error) {
        console.error('Token creation error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Token Listing Routes
router.get('/list/:walletAddress', tokenController.listTokens);
router.get('/user/:walletAddress', tokenController.getUserTokens);
router.get('/balance/:mintAddress/:walletAddress', tokenController.getTokenBalance);

// Token Management Routes
router.post('/mint', tokenController.mintMore);
router.post('/freeze', tokenController.freezeToken);
router.delete('/:tokenMintAddress', async (req, res) => {
    try {
        const { tokenMintAddress } = req.params;
        await Coin.findOneAndDelete({ tokenMintAddress });
        res.json({ success: true, message: 'Token removed from list' });
    } catch (error) {
        console.error('Error deleting token:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Liquidity Pool Routes
router.get('/:mintAddress/pools', tokenController.getLiquidityPoolsForToken);
router.get('/pools/:mintAddress', tokenController.getLiquidityPoolsForToken);

// Payment Processing Route
router.post('/payment', upload.single('tokenImage'), async (req, res) => {
    const mode = req.body.mode || 'prepare';
    try {
        console.log('📥 /payment called with body:');
        console.log('mode:', req.body.mode);
        console.log('tokenName:', req.body.tokenName);
        console.log('tokenSymbol:', req.body.tokenSymbol);
        console.log('payerPublicKey:', req.body.payerPublicKey);
        console.log('paymentSignature:', req.body.paymentSignature);
        console.log('mintPublicKey:', req.body.mintPublicKey);
    
        const {
            tokenName,
            tokenSymbol,
            payerPublicKey,
            addOns,
            tokenDetails,
            paymentSignature,
            mintPublicKey // <-- from frontend during finalize
        } = req.body;

        const imageUrl = req.file ? req.file.path : '';
        const parsedAddOns = JSON.parse(addOns);
        const parsedTokenDetails = JSON.parse(tokenDetails);

        const connection = new Connection(process.env.SOLANA_CLUSTER_URL);

        if (mode === 'prepare') {
            const mintKeypair = Keypair.generate(); // Only generated ONCE here

            const transactions = await processTokenCreationWithPayment(
                connection,
                payerPublicKey,
                mintKeypair,
                parsedAddOns,
                parsedTokenDetails
            );

            return res.json({
                success: true,
                paymentTransaction: transactions.paymentTransaction,
                tokenCreationTransaction: transactions.tokenCreationTransaction,
                mintKeypair: {
                    publicKey: mintKeypair.publicKey.toString(),
                    secretKey: Array.from(mintKeypair.secretKey)
                }
            });
        }

        if (mode === 'finalize') {
            // 🔒 Require both signature and mint address from frontend
            if (!paymentSignature || !mintPublicKey) {
                return res.status(400).json({ success: false, error: 'Missing paymentSignature or mintPublicKey' });
            }

            // 🧠 Wait for actual confirmation (robust way)
            try {
                const confirmation = await connection.confirmTransaction(paymentSignature, 'finalized');
            
                if (!confirmation.value || confirmation.value.err) {
                    return res.status(400).json({
                        success: false,
                        error: 'Payment failed or not confirmed',
                        debug: confirmation.value.err
                    });
                }
            } catch (err) {
                console.error('Transaction confirmation threw an error:', err);
                return res.status(500).json({
                    success: false,
                    error: 'Unable to confirm transaction — Solana RPC error or timeout',
                    debug: err.message || err
                });
            }
            // ✅ Save to DB if payment confirmed
            const newCoin = new Coin({
                name: tokenName,
                symbol: tokenSymbol,
                tokenMintAddress: mintPublicKey,
                creator: payerPublicKey,
                decimals: parsedTokenDetails.decimals || 9,
                initialSupply: parsedTokenDetails.initialSupply || 0,
                fixedSupply: parsedTokenDetails.fixedSupply || false,
                associatedTokenAccount: mintPublicKey,
                imageUrl,
                creatorName: req.body.creatorName || '',
                creatorWebsite: req.body.creatorWebsite || '',
                paymentStatus: 'completed'
            });

            const savedToken = await newCoin.save();

            return res.json({
                success: true,
                savedToken
            });
        }

        return res.status(400).json({ success: false, error: 'Invalid mode' });

    } catch (error) {
        console.error('Payment processing error:', error);


    // Save only if you have enough fields
    if (mode === 'finalize' && req.body.mintPublicKey) {
        const failedCoin = new Coin({
            name: req.body.tokenName,
            symbol: req.body.tokenSymbol,
            tokenMintAddress: req.body.mintPublicKey,
            creator: req.body.payerPublicKey,
            decimals: 0,
            initialSupply: 0,
            fixedSupply: false,
            associatedTokenAccount: req.body.mintPublicKey,
            imageUrl: '',
            creatorName: req.body.creatorName || '',
            creatorWebsite: req.body.creatorWebsite || '',
            paymentStatus: 'failed'
        });

        try {
            await failedCoin.save();
        } catch (saveErr) {
            console.error('Failed to save failedCoin:', saveErr);
        }
    }

    res.status(500).json({
        success: false,
        error: error.message
    });
    }
});


// Debug Routes
router.get('/debug/all', async (req, res) => {
    try {
        const allCoins = await Coin.find({}).sort({ createdAt: -1 });
        res.json({
            success: true,
            count: allCoins.length,
            coins: allCoins
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Add this near your other routes
router.get('/fix-collections', async (req, res) => {
    try {
        // Get all documents from both collections
        const coins = await Coin.find({});
        console.log('Found coins:', coins.length);

        // Get reference to the tokens collection
        const tokensCollection = Coin.collection.conn.db.collection('tokens');
        const tokens = await tokensCollection.find({}).toArray();
        console.log('Found tokens:', tokens.length);

        // Merge tokens into coins collection
        for (const token of tokens) {
            const existingCoin = await Coin.findOne({ 
                tokenMintAddress: token.tokenMintAddress 
            });

            if (!existingCoin) {
                // Create new document in coins collection
                const newCoin = new Coin({
                    name: token.name,
                    symbol: token.symbol,
                    tokenMintAddress: token.tokenMintAddress,
                    creator: token.creator || "2vd5ru6SiwSzixfEfgyZ6HJ2HMCw9EoaJGDXWqMYQhGX",
                    decimals: token.decimals || 9,
                    initialSupply: token.initialSupply || 0,
                    fixedSupply: token.fixedSupply || false,
                    associatedTokenAccount: token.associatedTokenAccount || token.tokenMintAddress
                });

                await newCoin.save();
                console.log('Migrated token:', token.symbol);
            }
        }

        // Get final count
        const finalCoins = await Coin.find({});

        res.json({
            success: true,
            message: 'Collections merged successfully',
            originalCoins: coins.length,
            originalTokens: tokens.length,
            finalCount: finalCoins.length
        });

    } catch (error) {
        console.error('Error fixing collections:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Add this route to verify the data
router.get('/verify/:walletAddress', async (req, res) => {
    try {
        const { walletAddress } = req.params;
        
        // Check coins collection
        const coins = await Coin.find({ creator: walletAddress });
        
        // Check tokens collection directly
        const tokensCollection = Coin.collection.conn.db.collection('tokens');
        const tokens = await tokensCollection.find({ creator: walletAddress }).toArray();

        res.json({
            success: true,
            coinsCount: coins.length,
            tokensCount: tokens.length,
            coins,
            tokens
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Add this route before module.exports
router.get('/debug/mongodb', async (req, res) => {
    try {
        // Test MongoDB connection
        const count = await Coin.countDocuments();
        const lastToken = await Coin.findOne().sort({ createdAt: -1 });
        
        // Get all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        
        res.json({
            success: true,
            totalTokens: count,
            lastToken,
            mongooseConnection: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            collections: collectionNames,
            connectionString: process.env.MONGODB_URI ? 'Set' : 'Not Set'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
});

// Add this new debug route with proper Solana addresses
router.post('/debug/create', async (req, res) => {
    try {
        // Generate a valid-format Solana address (for testing only)
        const generateTestAddress = () => {
            return Keypair.generate().publicKey.toString();
        };

        const testToken = new Coin({
            name: "Test Token " + Date.now(),
            symbol: "TEST",
            tokenMintAddress: generateTestAddress(),
            creator: "2vd5ru6SiwSzixfEfgyZ6HJ2HMCw9EoaJGDXWqMYQhGX",
            decimals: 9,
            initialSupply: 1000000,
            fixedSupply: false,
            associatedTokenAccount: generateTestAddress()
        });

        console.log('Attempting to save test token:', testToken);
        const savedToken = await testToken.save();
        
        res.json({
            success: true,
            message: 'Test token created successfully',
            token: savedToken,
            collectionName: testToken.collection.name
        });
    } catch (error) {
        console.error('Debug create error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack,
            details: error.errors ? Object.keys(error.errors).map(key => ({
                field: key,
                message: error.errors[key].message
            })) : null
        });
    }
});

// Add this route to check specific token
router.get('/debug/token/:tokenMintAddress', async (req, res) => {
    try {
        const { tokenMintAddress } = req.params;
        const token = await Coin.findOne({ tokenMintAddress });
        
        res.json({
            success: true,
            exists: !!token,
            token,
            collectionName: token ? token.collection.name : null
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
