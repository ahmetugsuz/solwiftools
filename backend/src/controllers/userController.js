const User = require('../models/userModel');
const { v4: uuidv4 } = require('uuid'); // For generating unique user identifiers

// 1. Login or Register User (based on wallet address)
exports.loginOrRegister = async (req, res) => {
    const { walletAddress, name, email } = req.body;

    if (!walletAddress) {
        return res.status(400).json({ error: 'Wallet address is required!' });
    }

    try {
        // Find the user by wallet address
        let user = await User.findOne({ wallets: walletAddress });

        // If user doesn't exist, create a new one
        if (!user) {
            user = new User({
                wallets: [walletAddress], // Save the wallet address as the primary identifier
                name: name || 'Anonymous',
                email: email || '',
            });
            await user.save();
        }

        // Respond with user data
        res.status(200).json({
            message: 'Login successful',
            userId: user._id,
            wallets: user.wallets
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred during login', details: err.message });
    }
};

// 2. Link Another Wallet to Existing User
exports.linkWallet = async (req, res) => {
    const { userId, walletAddress } = req.body;

    if (!walletAddress || !userId) {
        return res.status(400).json({ error: 'User ID and wallet address are required!' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found!' });
        }

        // Ensure the wallet address is not already linked
        if (user.wallets.includes(walletAddress)) {
            return res.status(400).json({ error: 'Wallet already linked!' });
        }

        // Add the new wallet address
        user.wallets.push(walletAddress);
        await user.save();

        res.status(200).json({
            message: 'Wallet linked successfully',
            wallets: user.wallets
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error linking wallet', details: err.message });
    }
};

// 3. Fetch User Profile (by userId)
exports.getUserProfile = async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found!' });
        }

        res.status(200).json({
            message: 'User profile fetched successfully',
            user
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching user profile', details: err.message });
    }
};

// GET /api/users/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// PUT /api/users/profile
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user.id, req.body, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
