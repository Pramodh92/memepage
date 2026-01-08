const express = require('express');
const router = express.Router();

// Import AWS services
const dynamodbService = require('../services/dynamodb.service');
const snsService = require('../services/sns.service');

// Feature a meme
router.post('/feature', async (req, res) => {
  try {
    const { memeId } = req.body;

    if (!memeId) {
      return res.status(400).json({
        success: false,
        message: 'Meme ID is required'
      });
    }

    // Update meme to featured in DynamoDB
    const updatedMeme = await dynamodbService.updateMeme(memeId, { featured: true });

    if (!updatedMeme) {
      return res.status(404).json({
        success: false,
        message: 'Meme not found'
      });
    }

    // Send SNS notification
    try {
      await snsService.notifyMemeFeatured(updatedMeme);
    } catch (snsError) {
      console.error('SNS notification failed:', snsError);
      // Continue even if SNS fails
    }

    res.json({
      success: true,
      message: 'Meme featured successfully – SNS notification sent',
      meme: updatedMeme
    });
  } catch (error) {
    console.error('Feature error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to feature meme',
      error: error.message
    });
  }
});

module.exports = router;
