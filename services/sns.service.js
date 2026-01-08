const sns = require('../config/sns');
const { SNS_TOPIC_ARN } = require('../config/aws.config');

/**
 * Send a notification to SNS topic
 */
const publishToTopic = async (subject, message) => {
  if (!SNS_TOPIC_ARN) {
    console.warn('SNS_TOPIC_ARN not configured. Skipping notification.');
    return;
  }

  const params = {
    TopicArn: SNS_TOPIC_ARN,
    Subject: subject,
    Message: typeof message === 'string' ? message : JSON.stringify(message, null, 2)
  };

  try {
    await sns.publish(params).promise();
    console.log(`SNS notification sent: ${subject}`);
  } catch (error) {
    console.error('Error sending SNS notification:', error);
    throw error;
  }
};

/**
 * Notify when a new meme is uploaded
 */
exports.notifyMemeUploaded = async (meme) => {
  const subject = '🎨 New Meme Uploaded to AWS Meme Museum!';
  const message = `
A new meme has been uploaded to the AWS Meme Museum!

Title: ${meme.title}
Author: ${meme.author}
Description: ${meme.description}
Tags: ${meme.tags ? meme.tags.join(', ') : 'None'}
Uploaded: ${new Date(meme.createdAt).toLocaleString()}

Check it out at the AWS Meme Museum!
  `.trim();

  await publishToTopic(subject, message);
};

/**
 * Notify when a meme is featured
 */
exports.notifyMemeFeatured = async (meme) => {
  const subject = '⭐ Meme Featured in AWS Meme Museum!';
  const message = `
A meme has been featured in the AWS Meme Museum!

Title: ${meme.title}
Author: ${meme.author}
Likes: ${meme.likes}
Tags: ${meme.tags ? meme.tags.join(', ') : 'None'}

This meme is now showcased in the featured section!
  `.trim();

  await publishToTopic(subject, message);
};

/**
 * Notify when a meme reaches a milestone
 */
exports.notifyMilestone = async (meme, milestone) => {
  const subject = `🎉 Meme Reached ${milestone} Likes!`;
  const message = `
Congratulations! A meme has reached ${milestone} likes!

Title: ${meme.title}
Author: ${meme.author}
Current Likes: ${meme.likes}
Tags: ${meme.tags ? meme.tags.join(', ') : 'None'}

This meme is trending in the AWS Meme Museum!
  `.trim();

  await publishToTopic(subject, message);
};

/**
 * Generic notification sender
 */
exports.sendNotification = async (subject, message) => {
  await publishToTopic(subject, message);
};
