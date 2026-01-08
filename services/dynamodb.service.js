const dynamodb = require('../config/dynamodb');
const { TABLES } = require('../config/aws.config');
const { v4: uuidv4 } = require('uuid');

// ==================== MEME OPERATIONS ====================

/**
 * Create a new meme in DynamoDB
 */
exports.createMeme = async (memeData) => {
  const params = {
    TableName: TABLES.MEMES,
    Item: {
      id: uuidv4(),
      title: memeData.title,
      description: memeData.description || '',
      tags: memeData.tags || [],
      imageUrl: memeData.imageUrl,
      author: memeData.author,
      likes: 0,
      featured: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  };

  await dynamodb.put(params).promise();
  return params.Item;
};

/**
 * Get a single meme by ID
 */
exports.getMeme = async (id) => {
  const params = {
    TableName: TABLES.MEMES,
    Key: { id }
  };

  const result = await dynamodb.get(params).promise();
  return result.Item;
};

/**
 * Get all memes (scan operation)
 */
exports.getAllMemes = async () => {
  const params = {
    TableName: TABLES.MEMES
  };

  const result = await dynamodb.scan(params).promise();
  return result.Items || [];
};

/**
 * Get trending memes (sorted by likes, descending)
 */
exports.getTrendingMemes = async () => {
  const memes = await exports.getAllMemes();
  // Sort by likes in descending order
  return memes.sort((a, b) => b.likes - a.likes);
};

/**
 * Get featured memes
 */
exports.getFeaturedMemes = async () => {
  const memes = await exports.getAllMemes();
  return memes.filter(meme => meme.featured);
};

/**
 * Update a meme
 */
exports.updateMeme = async (id, updates) => {
  const updateExpressions = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};

  // Build update expression dynamically
  Object.keys(updates).forEach((key, index) => {
    const attrName = `#attr${index}`;
    const attrValue = `:val${index}`;
    updateExpressions.push(`${attrName} = ${attrValue}`);
    expressionAttributeNames[attrName] = key;
    expressionAttributeValues[attrValue] = updates[key];
  });

  // Always update the updatedAt timestamp
  updateExpressions.push('#updatedAt = :updatedAt');
  expressionAttributeNames['#updatedAt'] = 'updatedAt';
  expressionAttributeValues[':updatedAt'] = Date.now();

  const params = {
    TableName: TABLES.MEMES,
    Key: { id },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW'
  };

  const result = await dynamodb.update(params).promise();
  return result.Attributes;
};

/**
 * Delete a meme
 */
exports.deleteMeme = async (id) => {
  const params = {
    TableName: TABLES.MEMES,
    Key: { id }
  };

  await dynamodb.delete(params).promise();
  return { success: true, id };
};

/**
 * Increment meme likes
 */
exports.incrementLikes = async (id) => {
  const params = {
    TableName: TABLES.MEMES,
    Key: { id },
    UpdateExpression: 'SET likes = likes + :inc, updatedAt = :updatedAt',
    ExpressionAttributeValues: {
      ':inc': 1,
      ':updatedAt': Date.now()
    },
    ReturnValues: 'ALL_NEW'
  };

  const result = await dynamodb.update(params).promise();
  return result.Attributes;
};

// ==================== USER OPERATIONS ====================

/**
 * Create a new user
 */
exports.createUser = async (userData) => {
  const params = {
    TableName: TABLES.USERS,
    Item: {
      email: userData.email,
      username: userData.username,
      createdAt: Date.now()
    }
  };

  await dynamodb.put(params).promise();
  return params.Item;
};

/**
 * Get a user by email
 */
exports.getUser = async (email) => {
  const params = {
    TableName: TABLES.USERS,
    Key: { email }
  };

  const result = await dynamodb.get(params).promise();
  return result.Item;
};

/**
 * Check if user exists
 */
exports.userExists = async (email) => {
  const user = await exports.getUser(email);
  return !!user;
};
