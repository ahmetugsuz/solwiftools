// src/controllers/bundlerController.js
const Bundler = require('../models/Bundler');

exports.subscribeBundler = async (req, res) => {
  const { userId } = req.body;

  try {
    const existingSubscription = await Bundler.findOne({ user: userId });

    if (existingSubscription) {
      return res.status(400).json({ error: 'User already subscribed.' });
    }

    const newBundler = new Bundler({
      user: userId,
      isPremium: true,
      lifetimeAccess: true,
    });

    await newBundler.save();

    res.status(200).json({ message: 'Bundler subscription successful!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Subscription failed' });
  }
};
