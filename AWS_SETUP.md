# AWS Meme Museum - AWS Setup Guide

This guide will walk you through setting up the AWS infrastructure for the Meme Museum application.

## Prerequisites

- AWS Account
- AWS CLI installed and configured
- Node.js installed locally

## Architecture

The application uses 4 AWS services:
- **DynamoDB** - NoSQL database for memes and users
- **SNS** - Simple Notification Service for email alerts
- **IAM** - Identity and Access Management for permissions
- **EC2** - Elastic Compute Cloud for hosting

---

## Step 1: Create DynamoDB Tables

### Create Memes Table

```bash
aws dynamodb create-table \
    --table-name MemesTable \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1
```

### Create Users Table

```bash
aws dynamodb create-table \
    --table-name UsersTable \
    --attribute-definitions \
        AttributeName=email,AttributeType=S \
    --key-schema \
        AttributeName=email,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1
```

### Verify Tables Created

```bash
aws dynamodb list-tables --region us-east-1
```

---

## Step 2: Create SNS Topic and Subscribe

### Create SNS Topic

```bash
aws sns create-topic \
    --name MemeMuseumNotifications \
    --region us-east-1
```

**Note the Topic ARN** from the output. It will look like:
```
arn:aws:sns:us-east-1:123456789012:MemeMuseumNotifications
```

### Subscribe Your Email

Replace `YOUR_EMAIL` with your actual email address:

```bash
aws sns subscribe \
    --topic-arn arn:aws:sns:us-east-1:123456789012:MemeMuseumNotifications \
    --protocol email \
    --notification-endpoint YOUR_EMAIL@example.com \
    --region us-east-1
```

**Important**: Check your email and confirm the subscription!

---

## Step 3: Create IAM Role for EC2

### Create Trust Policy

Create a file named `trust-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

### Create IAM Role

```bash
aws iam create-role \
    --role-name MemeMuseumEC2Role \
    --assume-role-policy-document file://trust-policy.json
```

### Create Permissions Policy

Create a file named `permissions-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Scan",
        "dynamodb:Query"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:*:table/MemesTable",
        "arn:aws:dynamodb:us-east-1:*:table/UsersTable"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": "arn:aws:sns:us-east-1:*:MemeMuseumNotifications"
    }
  ]
}
```

### Attach Policy to Role

```bash
aws iam put-role-policy \
    --role-name MemeMuseumEC2Role \
    --policy-name MemeMuseumPermissions \
    --policy-document file://permissions-policy.json
```

### Create Instance Profile

```bash
aws iam create-instance-profile \
    --instance-profile-name MemeMuseumEC2Profile

aws iam add-role-to-instance-profile \
    --instance-profile-name MemeMuseumEC2Profile \
    --role-name MemeMuseumEC2Role
```

---

## Step 4: Launch EC2 Instance

### Create Security Group

```bash
aws ec2 create-security-group \
    --group-name MemeMuseumSG \
    --description "Security group for Meme Museum" \
    --region us-east-1
```

**Note the Security Group ID** from the output.

### Add Inbound Rules

Replace `sg-xxxxxxxxx` with your Security Group ID:

```bash
# Allow SSH
aws ec2 authorize-security-group-ingress \
    --group-id sg-xxxxxxxxx \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0

# Allow HTTP
aws ec2 authorize-security-group-ingress \
    --group-id sg-xxxxxxxxx \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0

# Allow Custom Port 3000
aws ec2 authorize-security-group-ingress \
    --group-id sg-xxxxxxxxx \
    --protocol tcp \
    --port 3000 \
    --cidr 0.0.0.0/0
```

### Launch Instance

Replace placeholders with your values:

```bash
aws ec2 run-instances \
    --image-id ami-0c55b159cbfafe1f0 \
    --instance-type t2.micro \
    --key-name YOUR_KEY_PAIR_NAME \
    --security-group-ids sg-xxxxxxxxx \
    --iam-instance-profile Name=MemeMuseumEC2Profile \
    --region us-east-1 \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=MemeMuseumServer}]'
```

**Note the Instance ID** and wait for it to be running.

### Get Instance Public IP

```bash
aws ec2 describe-instances \
    --instance-ids i-xxxxxxxxx \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text
```

---

## Step 5: Deploy Application to EC2

### SSH into Instance

```bash
ssh -i YOUR_KEY.pem ec2-user@YOUR_INSTANCE_IP
```

### Install Node.js

```bash
# Update system
sudo yum update -y

# Install Node.js 18
curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Verify installation
node --version
npm --version
```

### Clone/Upload Application

Option 1: Using Git (if your code is in a repository):
```bash
git clone YOUR_REPO_URL
cd aws-meme-museum
```

Option 2: Using SCP from your local machine:
```bash
# On your local machine
scp -i YOUR_KEY.pem -r /path/to/aws-meme-museum ec2-user@YOUR_INSTANCE_IP:~/
```

### Install Dependencies

```bash
cd aws-meme-museum
npm install
```

### Configure Environment Variables

Create `.env` file:

```bash
nano .env
```

Add the following (replace with your actual values):

```
AWS_REGION=us-east-1
DYNAMODB_MEMES_TABLE=MemesTable
DYNAMODB_USERS_TABLE=UsersTable
SNS_TOPIC_ARN=arn:aws:sns:us-east-1:123456789012:MemeMuseumNotifications
PORT=3000
```

Save and exit (Ctrl+X, then Y, then Enter).

### Start Application

```bash
# Install PM2 for process management
sudo npm install -g pm2

# Start application
pm2 start server.js --name meme-museum

# Make PM2 start on system boot
pm2 startup
pm2 save
```

### Verify Application is Running

```bash
pm2 status
pm2 logs meme-museum
```

---

## Step 6: Access Your Application

Open your browser and navigate to:
```
http://YOUR_INSTANCE_IP:3000
```

You should see the AWS Meme Museum running!

---

## Testing AWS Integration

### Test 1: Upload a Meme
1. Click "Upload Meme"
2. Fill in title, description, tags, and upload an image
3. Submit the form
4. Check your email for SNS notification
5. Verify meme appears in gallery

### Test 2: Check DynamoDB
```bash
# List all memes
aws dynamodb scan --table-name MemesTable --region us-east-1

# List all users
aws dynamodb scan --table-name UsersTable --region us-east-1
```

### Test 3: Feature a Meme
1. Click "Feature" button on a meme
2. Check your email for SNS notification
3. Verify meme shows "Featured" badge

---

## Troubleshooting

### Application won't start
```bash
# Check logs
pm2 logs meme-museum

# Check if port 3000 is in use
sudo netstat -tulpn | grep 3000
```

### DynamoDB Access Denied
- Verify IAM role is attached to EC2 instance
- Check IAM policy permissions
- Verify table names in `.env` match actual table names

### SNS Notifications Not Received
- Confirm email subscription in SNS console
- Check spam folder
- Verify SNS_TOPIC_ARN in `.env` is correct

### Can't Access from Browser
- Verify Security Group allows inbound traffic on port 3000
- Check if application is running: `pm2 status`
- Verify instance public IP is correct

---

## Cost Optimization

- **DynamoDB**: Using PAY_PER_REQUEST mode (only pay for what you use)
- **EC2**: t2.micro is free tier eligible (750 hours/month)
- **SNS**: First 1,000 email notifications free per month
- **Data Transfer**: First 1GB outbound free per month

**Estimated Monthly Cost**: $0-5 (depending on usage, mostly free tier)

---

## Cleanup (When Done Testing)

To avoid charges, delete resources when done:

```bash
# Terminate EC2 instance
aws ec2 terminate-instances --instance-ids i-xxxxxxxxx

# Delete DynamoDB tables
aws dynamodb delete-table --table-name MemesTable
aws dynamodb delete-table --table-name UsersTable

# Delete SNS topic
aws sns delete-topic --topic-arn arn:aws:sns:us-east-1:123456789012:MemeMuseumNotifications

# Delete IAM resources
aws iam remove-role-from-instance-profile --instance-profile-name MemeMuseumEC2Profile --role-name MemeMuseumEC2Role
aws iam delete-instance-profile --instance-profile-name MemeMuseumEC2Profile
aws iam delete-role-policy --role-name MemeMuseumEC2Role --policy-name MemeMuseumPermissions
aws iam delete-role --role-name MemeMuseumEC2Role

# Delete Security Group
aws ec2 delete-security-group --group-id sg-xxxxxxxxx
```

---

## Next Steps

1. **Add HTTPS**: Use AWS Certificate Manager + Application Load Balancer
2. **Add S3**: Store uploaded images in S3 instead of local filesystem
3. **Add CloudWatch**: Monitor application logs and metrics
4. **Add Auto Scaling**: Handle traffic spikes automatically
5. **Add CloudFront**: CDN for faster global access

---

## Support

For issues or questions:
- Check AWS documentation
- Review application logs: `pm2 logs meme-museum`
- Verify AWS service quotas and limits
