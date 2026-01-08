const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Import AWS services
const dynamodbService = require('../services/dynamodb.service');
const snsService = require('../services/sns.service');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Upload endpoint - Create new meme
router.post('/upload', upload.single('memeFile'), async (req, res) => {
  try {
    const { title, author, description, tags } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded'
      });
    }

    // Parse tags if it's a string (from form data)
    let parsedTags = [];
    if (tags) {
      parsedTags = typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : tags;
    }

    // Create meme in DynamoDB
    const newMeme = await dynamodbService.createMeme({
      title: title || 'New Meme',
      description: description || 'No description provided',
      tags: parsedTags,
      imageUrl: `/uploads/${req.file.filename}`,
      author: author || 'Anonymous'
    });

    // Send SNS notification
    try {
      await snsService.notifyMemeUploaded(newMeme);
    } catch (snsError) {
      console.error('SNS notification failed:', snsError);
      // Continue even if SNS fails
    }

    res.json({
      success: true,
      message: 'Meme uploaded successfully!',
      meme: newMeme
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload meme',
      error: error.message
    });
  }
});

// Update endpoint - Update existing meme
router.put('/update/:id', upload.single('memeFile'), async (req, res) => {
  try {
    const memeId = req.params.id;
    const { title, author, description, tags } = req.body;

    // Build updates object
    const updates = {};
    if (title) updates.title = title;
    if (author) updates.author = author;
    if (description) updates.description = description;

    // Parse and update tags
    if (tags) {
      updates.tags = typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : tags;
    }

    // Update image if a new file was uploaded
    if (req.file) {
      updates.imageUrl = `/uploads/${req.file.filename}`;
    }

    // Update meme in DynamoDB
    const updatedMeme = await dynamodbService.updateMeme(memeId, updates);

    if (!updatedMeme) {
      return res.status(404).json({
        success: false,
        message: 'Meme not found'
      });
    }

    res.json({
      success: true,
      message: 'Meme updated successfully!',
      meme: updatedMeme
    });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update meme',
      error: error.message
    });
  }
});

// Gallery endpoint - Get all memes
router.get('/gallery', async (req, res) => {
  try {
    const memes = await dynamodbService.getAllMemes();

    res.json({
      success: true,
      memes: memes,
      count: memes.length
    });
  } catch (error) {
    console.error('Gallery error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load gallery',
      error: error.message
    });
  }
});

// Trending endpoint - Get memes sorted by likes
router.get('/trending', async (req, res) => {
  try {
    const trendingMemes = await dynamodbService.getTrendingMemes();

    res.json({
      success: true,
      memes: trendingMemes,
      count: trendingMemes.length
    });
  } catch (error) {
    console.error('Trending error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load trending memes',
      error: error.message
    });
  }
});

module.exports = router;

