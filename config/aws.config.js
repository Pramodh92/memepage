// AWS Configuration
const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({
    region: process.env.AWS_REGION || 'us-east-1'
});

// Table names
const TABLES = {
    MEMES: process.env.DYNAMODB_MEMES_TABLE || 'MemesTable',
    USERS: process.env.DYNAMODB_USERS_TABLE || 'UsersTable'
};

// SNS Topic ARN
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN || '';

module.exports = {
    AWS,
    TABLES,
    SNS_TOPIC_ARN
};
