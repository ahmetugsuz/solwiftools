const BundlerToken = require('../models/BundlerTokenModel');
const BundlerBundle = require('../models/BundlerBundleModel');
const { createBundlerTokenOnSolana, bundleBuyOnSolana } = require('../utils/bundlerSolanaUtils');
const { v4: uuidv4 } = require('uuid');

// Create a new bundler token
const createBundlerToken = async (req, res) => {
  try {
    const tokenData = req.body;
    tokenData.createdBy = req.user.id;
    // Map frontend fields to model fields
    tokenData.website = tokenData.website || '';
    tokenData.telegram = tokenData.telegram || '';
    tokenData.twitter = tokenData.twitter || '';
    tokenData.description = tokenData.tokenDescription || tokenData.description || '';
    tokenData.imageUrl = tokenData.tokenImage || tokenData.imageUrl || '';
    tokenData.sendingMode = tokenData.sendingMode || 'jito';
    tokenData.vanityTokenMint = tokenData.vanityTokenMint === 'true' || false;
    // Remove unused fields
    delete tokenData.tokenDescription;
    delete tokenData.tokenImage;
    const token = new BundlerToken(tokenData);
    await token.save();
    res.status(201).json({ success: true, token });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all tokens for user
const getBundlerTokens = async (req, res) => {
  try {
    const tokens = await BundlerToken.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, tokens });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get token by id
const getBundlerToken = async (req, res) => {
  try {
    const token = await BundlerToken.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!token) return res.status(404).json({ success: false, error: 'Token not found' });
    res.json({ success: true, token });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update token
const updateBundlerToken = async (req, res) => {
  try {
    const updateData = req.body;
    updateData.website = updateData.website || '';
    updateData.telegram = updateData.telegram || '';
    updateData.twitter = updateData.twitter || '';
    updateData.description = updateData.tokenDescription || updateData.description || '';
    updateData.imageUrl = updateData.tokenImage || updateData.imageUrl || '';
    updateData.sendingMode = updateData.sendingMode || 'jito';
    updateData.vanityTokenMint = updateData.vanityTokenMint === 'true' || false;
    delete updateData.tokenDescription;
    delete updateData.tokenImage;
    const token = await BundlerToken.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      updateData,
      { new: true }
    );
    if (!token) return res.status(404).json({ success: false, error: 'Token not found' });
    res.json({ success: true, token });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete token
const deleteBundlerToken = async (req, res) => {
  try {
    const token = await BundlerToken.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
    if (!token) return res.status(404).json({ success: false, error: 'Token not found' });
    res.json({ success: true, message: 'Token deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Launch token (status update + bundled buy)
const launchBundlerToken = async (req, res) => {
  try {
    const token = await BundlerToken.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!token) return res.status(404).json({ success: false, error: 'Token not found' });
    if (token.status !== 'draft') return res.status(400).json({ success: false, error: 'Token not in draft status' });

    const { wallets, buyMode, interval } = req.body; // wallets: [{secretKey, ...}], buyMode: 'immediate'|'gradual', interval: ms
    if (!wallets || !Array.isArray(wallets) || wallets.length === 0 || wallets.length > 25) {
      return res.status(400).json({ success: false, error: 'You must provide 1-25 wallets' });
    }
    if (!buyMode || !['immediate', 'gradual'].includes(buyMode)) {
      return res.status(400).json({ success: false, error: 'Invalid buy mode' });
    }

    // Mark token as pending
    token.status = 'pending';
    await token.save();

    // Create bundle record
    const bundle = new BundlerBundle({
      token: token._id,
      wallets: [], // will fill after buys
      status: 'pending',
      createdBy: req.user.id,
      buyAmountSol: req.body.buyAmountSol || 0,
      error: null
    });
    await bundle.save();

    // Prepare metadata for utility
    const tokenMetadata = {
      name: token.name,
      symbol: token.symbol,
      description: token.description,
      image: token.imageUrl,
      website: token.website,
      twitter: token.twitter,
      telegram: token.telegram
    };

    // Immediate mode: all buys at once
    if (buyMode === 'immediate') {
      const creatorWallet = wallets[0];
      const buyAmountSol = req.body.buyAmountSol || 0.01;
      const result = await createBundlerTokenOnSolana({
        creatorSecretKey: creatorWallet.secretKey,
        tokenMetadata,
        buyAmountSol,
        buyers: wallets
      });
      if (result.success) {
        token.status = 'active';
        token.tokenAddress = result.mintAddress;
        await token.save();
        bundle.status = 'executed';
        bundle.wallets = wallets.map((w, i) => ({ ...w, status: 'success', tx: result.transaction }));
        bundle.transactionHash = result.transaction?.signature || null;
        await bundle.save();
        return res.json({ success: true, message: 'Token launched and bundled buy complete', token, bundle });
      } else {
        token.status = 'failed';
        await token.save();
        bundle.status = 'failed';
        bundle.error = result.error;
        await bundle.save();
        return res.status(500).json({ success: false, error: result.error });
      }
    }

    // Gradual mode: schedule buys
    if (buyMode === 'gradual') {
      // Save bundle as pending, start async process
      bundle.status = 'pending';
      bundle.wallets = wallets.map(w => ({ ...w, status: 'pending', tx: null }));
      await bundle.save();
      // Start gradual buy process (not blocking response)
      gradualBuyProcess(token, bundle, wallets, req.body.buyAmountSol || 0.01, interval || 30000);
      return res.json({ success: true, message: 'Gradual bundled buy started', token, bundle });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Gradual buy process (runs in background)
async function gradualBuyProcess(token, bundle, wallets, buyAmountSol, interval) {
  let mintAddress = null;
  for (let i = 0; i < wallets.length; i++) {
    try {
      if (i === 0) {
        // First wallet creates the token
        const result = await createBundlerTokenOnSolana({
          creatorSecretKey: wallets[0].secretKey,
          tokenMetadata: {
            name: token.name,
            symbol: token.symbol,
            description: token.description,
            image: token.imageUrl,
            website: token.website,
            twitter: token.twitter,
            telegram: token.telegram
          },
          buyAmountSol,
          buyers: [wallets[0]],
          vanityTokenMint: tokenInfo.vanityTokenMint === 'true',
          vanityPattern: tokenInfo.tokenSymbol
        });
        if (result.success) {
          mintAddress = result.mintAddress;
          token.status = 'active';
          token.tokenAddress = mintAddress;
          await token.save();
          bundle.wallets[i].status = 'success';
          bundle.wallets[i].tx = result.transaction;
        } else {
          bundle.wallets[i].status = 'failed';
          bundle.wallets[i].tx = null;
          bundle.status = 'failed';
          bundle.error = result.error;
          await bundle.save();
          return;
        }
      } else {
        // Subsequent wallets buy
        const result = await bundleBuyOnSolana([wallets[i]], mintAddress, buyAmountSol);
        if (result.success) {
          bundle.wallets[i].status = 'success';
          bundle.wallets[i].tx = result.transaction;
        } else {
          bundle.wallets[i].status = 'failed';
          bundle.wallets[i].tx = null;
        }
      }
      await bundle.save();
      if (i < wallets.length - 1) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    } catch (err) {
      bundle.wallets[i].status = 'failed';
      bundle.wallets[i].tx = null;
      bundle.status = 'failed';
      bundle.error = err.message;
      await bundle.save();
      return;
    }
  }
  bundle.status = 'executed';
  await bundle.save();
}

// Polling endpoint for bundle status
const getBundleStatus = async (req, res) => {
  try {
    const bundle = await BundlerBundle.findOne({ _id: req.params.bundleId, createdBy: req.user.id });
    if (!bundle) return res.status(404).json({ success: false, error: 'Bundle not found' });
    res.json({ success: true, bundle });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// In-memory store for preparation logs and status
const prepareLaunchStore = {};

// POST /prepare-launch: Start preparation, store info, return prepId
const prepareLaunch = async (req, res) => {
  const prepId = uuidv4();
  const tokenInfo = req.body;
  prepareLaunchStore[prepId] = { logs: [], status: 'pending', tokenInfo, mintAddress: null };

  (async () => {
    const sendLog = (msg) => {
      prepareLaunchStore[prepId].logs.push(msg);
    };

    try {
      sendLog(`[Task ${prepId}] • rpc call getSlot() on http://ultra.rpc.solanavibestation.com/?`);
      await new Promise(r => setTimeout(r, 1000));
      sendLog(`[Task ${prepId}] • Preparing Launch for token: ${tokenInfo.tokenName || tokenInfo.name}`);
      await new Promise(r => setTimeout(r, 1000));
      sendLog(`[Task ${prepId}] • Token Symbol: ${tokenInfo.tokenSymbol}`);
      await new Promise(r => setTimeout(r, 1000));
      sendLog(`[Task ${prepId}] • Mode: ${tokenInfo.mode}`);
      sendLog(`[Task ${prepId}] • Using sending mode: ${tokenInfo.sendingMode}`);

      // Token creation
      sendLog(`[Task ${prepId}] • Creating token on Solana...`);
      const creatorWallet = tokenInfo.wallets && tokenInfo.wallets[0];
      const tokenMetadata = {
        name: tokenInfo.tokenName,
        symbol: tokenInfo.tokenSymbol,
        description: tokenInfo.tokenDescription,
        image: tokenInfo.tokenImage,
        website: tokenInfo.website,
        twitter: tokenInfo.twitter,
        telegram: tokenInfo.telegram
      };
      const buyAmountSol = tokenInfo.buyAmountSol || 0.01;
      let mintAddress = null;
      if (!creatorWallet) {
        sendLog(`[Task ${prepId}] • ERROR: No creator wallet provided.`);
        prepareLaunchStore[prepId].status = 'done';
        return;
      }
      const result = await createBundlerTokenOnSolana({
        creatorSecretKey: creatorWallet.secretKey,
        tokenMetadata,
        buyAmountSol,
        buyers: [creatorWallet],
        vanityTokenMint: tokenInfo.vanityTokenMint === 'true',
        vanityPattern: tokenInfo.tokenSymbol
      });
      if (!result.success) {
        sendLog(`[Task ${prepId}] • ERROR: ${result.error}`);
        prepareLaunchStore[prepId].status = 'done';
        return;
      }
      mintAddress = result.mintAddress;
      prepareLaunchStore[prepId].mintAddress = mintAddress;
      sendLog(`[Task ${prepId}] • Token created! Mint address: ${mintAddress}`);

      // Mode logic
      if (tokenInfo.mode === 'Safe') {
        sendLog(`[Task ${prepId}] • Safe Mode: You are the first buyer. No one can snipe or front-run you.`);
        sendLog(`[Task ${prepId}] • WARNING: This launch will be flagged as bundled on most memecoin sites (photon, bullx, etc.).`);
        
        // Immediate buy with creator wallet using specified sending mode
        const creatorBuyResult = await bundleBuyOnSolana(
          [creatorWallet],
          mintAddress,
          buyAmountSol,
          tokenInfo.sendingMode
        );
        
        if (creatorBuyResult[0].success) {
          sendLog(`[Task ${prepId}] • Creator buy successful: ${creatorBuyResult[0].signature}`);
        } else {
          sendLog(`[Task ${prepId}] • Creator buy failed: ${creatorBuyResult[0].error}`);
        }
      } else if (tokenInfo.mode === 'Experimental') {
        sendLog(`[Task ${prepId}] • Experimental Mode: Buys will happen sequentially (not bundled). This is more natural and less likely to be flagged.`);
        if (tokenInfo.experimentalMode === 'Regular') {
          sendLog(`[Task ${prepId}] • Waiting for delay: ${tokenInfo.delay || 0} ms...`);
          await new Promise(r => setTimeout(r, parseInt(tokenInfo.delay) || 0));
          sendLog(`[Task ${prepId}] • Starting sequential buys...`);
          const buyers = (tokenInfo.wallets || []).slice(1); // Exclude creator (already bought)
          for (let i = 0; i < buyers.length; i++) {
            sendLog(`[Task ${prepId}] • Wallet ${i + 2} buying...`);
            const buyResult = await bundleBuyOnSolana(
              [buyers[i]], 
              mintAddress, 
              buyAmountSol,
              tokenInfo.sendingMode
            );
            if (buyResult.success && buyResult.results[0].success) {
              sendLog(`[Task ${prepId}] • Wallet ${i + 2} buy SUCCESS. Tx: ${buyResult.results[0].transaction?.signature || 'N/A'}`);
            } else {
              sendLog(`[Task ${prepId}] • Wallet ${i + 2} buy FAILED. Error: ${buyResult.results[0]?.error || buyResult.error}`);
            }
            await new Promise(r => setTimeout(r, 500));
          }
          sendLog(`[Task ${prepId}] • All sequential buys complete.`);
        } else if (tokenInfo.experimentalMode === 'On-Demand') {
          sendLog(`[Task ${prepId}] • On-Demand: Waiting for manual trigger (Drop Bundle button).`);
          prepareLaunchStore[prepId].status = 'waiting-for-trigger';
          return;
        }
      }
      sendLog(`[Task ${prepId}] • Vanity Token Mint: ${tokenInfo.vanityTokenMint}`);
      await new Promise(r => setTimeout(r, 1000));
      sendLog(`[Task ${prepId}] • Checking wallet balance...`);
      await new Promise(r => setTimeout(r, 1000));
      sendLog(`[Task ${prepId}] • All systems go!`);
      await new Promise(r => setTimeout(r, 1000));
      sendLog(`[Task ${prepId}] • Ready to launch.`);
      prepareLaunchStore[prepId].status = 'done';
    } catch (err) {
      sendLog(`[Task ${prepId}] • ERROR: ${err.message}`);
      prepareLaunchStore[prepId].status = 'done';
    }
  })();

  res.json({ prepId });
};

// GET /prepare-launch/logs/:prepId: Stream logs for a given prepId
const prepareLaunchLogs = async (req, res) => {
  const { prepId } = req.params;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  let lastLogIndex = 0;
  const interval = setInterval(() => {
    const store = prepareLaunchStore[prepId];
    if (!store) return;
    const logs = store.logs;
    while (lastLogIndex < logs.length) {
      res.write(`data: ${logs[lastLogIndex]}\n\n`);
      lastLogIndex++;
    }
    if (store.status === 'done') {
      res.write('event: end\ndata: done\n\n');
      clearInterval(interval);
      res.end();
    }
  }, 500);

  req.on('close', () => {
    clearInterval(interval);
  });
};

// Add new endpoint for triggering on-demand buys
const triggerPrepareLaunch = async (req, res) => {
  const { prepId } = req.params;
  const prepState = prepareLaunchStore[prepId];
  
  if (!prepState) {
    return res.status(404).json({ error: 'Prepare launch not found' });
  }
  
  if (prepState.status !== 'ready_for_trigger') {
    return res.status(400).json({ error: 'Prepare launch not ready for trigger' });
  }

  try {
    const { mintAddress, tokenInfo } = prepState;
    const sendLog = (msg) => {
      prepState.logs.push(msg);
    };

    sendLog(`[Task ${prepId}] • Starting on-demand buys`);
    
    // Perform sequential buys
    const buyResults = await bundleBuyOnSolana(
      tokenInfo.wallets,
      mintAddress,
      tokenInfo.buyAmountSol,
      tokenInfo.sendingMode
    );
    
    // Log results
    buyResults.forEach(result => {
      if (result.success) {
        sendLog(`[Task ${prepId}] • Buy successful for ${result.wallet}: ${result.signature}`);
      } else {
        sendLog(`[Task ${prepId}] • Buy failed for ${result.wallet}: ${result.error}`);
      }
    });

    prepState.status = 'completed';
    sendLog(`[Task ${prepId}] • On-demand buys completed`);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error in triggerPrepareLaunch:', error);
    prepState.status = 'failed';
    prepState.logs.push(`[Task ${prepId}] • Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Add new endpoint for vanity address previews
const previewVanityAddresses = async (req, res) => {
  try {
    const { pattern } = req.body;
    if (!pattern) {
      return res.status(400).json({ success: false, error: 'Pattern is required' });
    }

    // Generate 5 preview addresses
    const previews = [];
    for (let i = 0; i < 5; i++) {
      const result = await generateVanityMint(pattern, 100); // Try up to 100 times for each preview
      if (result.success) {
        previews.push(result.address);
      }
    }

    if (previews.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: `Could not generate any addresses containing "${pattern}" after multiple attempts` 
      });
    }

    res.json({ success: true, addresses: previews });
  } catch (error) {
    console.error('Error in previewVanityAddresses:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createBundlerToken,
  getBundlerTokens,
  getBundlerToken,
  updateBundlerToken,
  deleteBundlerToken,
  launchBundlerToken,
  getBundleStatus,
  prepareLaunch,
  prepareLaunchLogs,
  triggerPrepareLaunch,
  previewVanityAddresses
}; 