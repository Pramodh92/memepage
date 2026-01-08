const express = require('express');
const router = express.Router();

// Import AWS services
const dynamodbService = require('../services/dynamodb.service');

// User signup
router.post('/signup', async (req, res) => {
  try {
    const { username, email } = req.body;

    if (!username || !email) {
      return res.status(400).json({
        success: false,
        message: 'Username and email are required'
      });
    }

    // Check if user already exists
    const existingUser = await dynamodbService.getUser(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user in DynamoDB
    const newUser = await dynamodbService.createUser({ username, email });

    res.json({
      success: true,
      message: 'User signed up successfully',
      user: newUser,
      token: 'mock-jwt-token-' + Date.now()
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sign up',
      error: error.message
    });
  }
});

// User login
router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Get user from DynamoDB
    const user = await dynamodbService.getUser(email);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User logged in successfully',
      user: user,
      token: 'mock-jwt-token-' + Date.now()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to login',
      error: error.message
    });
  }
});

module.exports = router;
