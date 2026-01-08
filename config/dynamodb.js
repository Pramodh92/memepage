const { AWS } = require('./aws.config');

const dynamodb = new AWS.DynamoDB.DocumentClient();

module.exports = dynamodb;
