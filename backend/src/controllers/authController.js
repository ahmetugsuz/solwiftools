// src/controllers/authController.js
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const nacl = require('tweetnacl');
const bs58 = require('bs58');
const License = require('../models/License');

// In-memory store for challenges (for demo; use Redis in prod)
const walletChallenges = {};

// GET /api/auth/challenge?wallet=ADDRESS
exports.getChallenge = async (req, res) => {
  const { wallet: rawWallet } = req.query;
  const wallet = rawWallet ? rawWallet.trim() : rawWallet;
  if (!wallet) return res.status(400).json({ error: 'Wallet address required' });
  const challenge = `Sign this message to login: ${Math.random().toString(36).slice(2)}-${Date.now()}`;
  walletChallenges[wallet] = challenge;
  res.json({ challenge });
};

// POST /api/auth/verify
exports.verifySignature = async (req, res) => {
  const { walletAddress: rawWalletAddress, signature } = req.body;
  const walletAddress = rawWalletAddress ? String(rawWalletAddress).trim() : rawWalletAddress;
  console.log('Raw walletAddress:', JSON.stringify(rawWalletAddress));
  console.log('Cleaned walletAddress:', JSON.stringify(walletAddress));
  console.log('Wallet length:', walletAddress ? walletAddress.length : 0);
  if (!walletAddress || !signature) return res.status(400).json({ error: 'Missing walletAddress or signature' });
  const challenge = walletChallenges[walletAddress];
  if (!challenge) return res.status(400).json({ error: 'No challenge found for wallet' });
  // Verify signature
  try {
    const pubkeyBytes = bs58.decode(walletAddress);
    const msgBytes = new TextEncoder().encode(challenge);
    const sigBytes = bs58.decode(signature);
    const valid = nacl.sign.detached.verify(msgBytes, sigBytes, pubkeyBytes);
    if (!valid) return res.status(401).json({ error: 'Invalid signature' });

    // Only after signature is valid, check/create user
    let user = await User.findOne({ wallets: { $in: [walletAddress] } });
    console.log("User found with $in:", user);
    if (!user) {
      // Create new user if not found
      user = await User.create({
        wallets: [walletAddress],
        name: '',
        email: '',
        license: null
      });
      console.log('Created new user:', user);
    }
    console.log('User successfully logged in. User DB entry:', user);
    // Check for valid license
    console.log('Looking up license for walletAddress:', walletAddress);
    // 1. Get the user and their current license
    let currentLicense = null;
    if (user.license) {
      currentLicense = await License.findById(user.license);
    }
    // 2. If the current license is not active, set to null
    if (!currentLicense || !currentLicense.isActive) {
      await User.updateOne(
        { wallets: walletAddress },
        { $set: { license: null } }
      );
    }
    // 3. Find any other active license for this wallet
    const activeLicense = await License.findOne({ walletAddress, isActive: true });
    if (!activeLicense) {
      // Return success with no license instead of error
      const token = jwt.sign({ id: user._id, wallet: walletAddress }, process.env.JWT_SECRET, { expiresIn: '1d' });
      delete walletChallenges[walletAddress];
      return res.json({ token, license: null });
    }
    const now = new Date();
    if (activeLicense.type === 'RENTAL' && activeLicense.expiryDate && now > activeLicense.expiryDate) {
      return res.status(403).json({ error: 'Your rental license has expired' });
    }
    // Update user to point to the active license
    await User.updateOne(
      { wallets: walletAddress },
      { $set: { license: activeLicense._id } }
    );
    // Issue JWT
    const token = jwt.sign({ id: user._id, wallet: walletAddress }, process.env.JWT_SECRET, { expiresIn: '1d' });
    delete walletChallenges[walletAddress];
    res.json({ token, license: activeLicense });
  } catch (err) {
    res.status(500).json({ error: 'Signature verification failed', details: err.message });
  }
};
