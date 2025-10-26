const express = require('express');
const router = express.Router();
const { 
    createLiquidityPool,
    addLiquidity,
    removeLiquidity,
    getLiquidityPools,
    getLiquidityPoolsForToken,
} = require('../controllers/liquidityController');
const LiquidityPool = require('../models/LiquidityPool');
const liquidityService = require('../services/liquidityService');

// Routes for liquidity pool operations
router.post('/create', createLiquidityPool);
router.post('/add', async (req, res) => {
  try {
    console.log('Received add liquidity request with data:', {
      baseToken: req.body.baseToken,
      solAmount: req.body.solAmount,
      tokenAmount: req.body.tokenAmount,
      publicKey: req.body.publicKey
    });

    // Validate request body
    if (!req.body.baseToken || !req.body.solAmount || !req.body.tokenAmount || !req.body.publicKey) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        required: ['baseToken', 'solAmount', 'tokenAmount', 'publicKey'],
        received: req.body
      });
    }

    const result = await liquidityService.addLiquidity({
      baseToken: req.body.baseToken,
      solAmount: req.body.solAmount,
      tokenAmount: req.body.tokenAmount,
      publicKey: req.body.publicKey
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Add liquidity error details:', {
      message: error.message,
      stack: error.stack,
      data: req.body
    });

    res.status(500).json({
      success: false,
      message: error.message,
      error: error.stack
    });
  }
});

router.post('/remove', async (req, res) => {
  try {
    console.log('Received remove liquidity request:', req.body);
    
    // Validate request body
    const { baseToken, amount, publicKey } = req.body;
    if (!baseToken || !amount || !publicKey) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        required: ['baseToken', 'amount', 'publicKey'],
        received: req.body
      });
    }

    const result = await liquidityService.removeLiquidity({
      baseToken,
      amount,
      publicKey
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Remove liquidity route error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.stack
    });
  }
});

router.get('/pools', getLiquidityPools);
router.get('/pools/:mintAddress', getLiquidityPoolsForToken);

// Get pool by token mint address
router.get('/pool/:tokenMintAddress', async (req, res) => {
    try {
        const { tokenMintAddress } = req.params;
        
        console.log('Looking for pool with token mint address:', tokenMintAddress);
        
        const pool = await LiquidityPool.findOne({ tokenMintAddress });
        
        if (!pool) {
            console.log('Pool not found for token:', tokenMintAddress);
            return res.status(404).json({
                success: false,
                message: 'Pool not found',
                needsCreation: true,
                tokenMintAddress
            });
        }

        console.log('Found pool:', pool);
        
        res.json({
            success: true,
            pool,
            exists: true
        });
    } catch (error) {
        console.error('Error in /pool/:tokenMintAddress:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Create new pool
router.post('/pool', async (req, res) => {
    try {
        const { tokenMintAddress, poolAddress } = req.body;
        
        if (!tokenMintAddress || !poolAddress) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Check if pool already exists
        const existingPool = await LiquidityPool.findOne({ tokenMintAddress });
        if (existingPool) {
            return res.status(400).json({
                success: false,
                message: 'Pool already exists for this token'
            });
        }

        const pool = new LiquidityPool({
            tokenMintAddress,
            poolAddress,
            totalSol: 0,
            totalTokens: 0
        });

        await pool.save();

        res.status(201).json({
            success: true,
            pool,
            message: 'Pool created successfully'
        });
    } catch (error) {
        console.error('Error creating pool:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Update pool stats
router.put('/pool/:tokenMintAddress', async (req, res) => {
    try {
        const { tokenMintAddress } = req.params;
        const { totalSol, totalTokens } = req.body;

        const pool = await LiquidityPool.findOneAndUpdate(
            { tokenMintAddress },
            { totalSol, totalTokens },
            { new: true }
        );

        if (!pool) {
            return res.status(404).json({
                success: false,
                message: 'Pool not found'
            });
        }

        res.json({
            success: true,
            pool
        });
    } catch (error) {
        console.error('Error updating pool:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Add a route to get pool info
router.get('/pool/:tokenMint', async (req, res) => {
  try {
    const pool = await liquidityService.getPoolInfo(req.params.tokenMint);
    res.json({
      success: true,
      pool,
      exists: !!pool
    });
  } catch (error) {
    console.error('Get pool error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router; 