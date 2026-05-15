const express = require('express');
const cryptoRouter = express.Router();
const cryptoUtils = require('../utils/crypto');
const User = require('../models/User');

// Generate and store a new key pair for the authenticated user
cryptoRouter.post('/generate-key-pair', async (req, res) => {
  try {
    if (!req.session || !req.session.isLoggedIn) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.session.user.id;
    
    // Generate new key pair
    const { publicKey, privateKey } = await cryptoUtils.generateKeyPair();
    
    // Update user with public key (private key should be stored client-side)
    await User.updatePublicKey(userId, publicKey);
    
    // Return both keys to client - in a real app, private key would be handled differently
    // For this implementation, we're sending it back so client can store it securely
    res.json({ publicKey, privateKey });
  } catch (err) {
    console.error('Error generating key pair:', err);
    res.status(500).json({ error: 'Failed to generate key pair' });
  }
});

// Get public key for a user by ID
cryptoRouter.get('/public-key/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ publicKey: user.publicKey || null });
  } catch (err) {
    console.error('Error fetching public key:', err);
    res.status(500).json({ error: 'Failed to fetch public key' });
  }
});

module.exports = cryptoRouter;