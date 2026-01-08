const { AWS } = require('./aws.config');

const sns = new AWS.SNS();

module.exports = sns;
