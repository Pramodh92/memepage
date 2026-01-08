# AWS Meme Museum - Console Deployment Guide

**Complete step-by-step guide to deploy using only the AWS Console (no CLI required)**

---

## Prerequisites

- AWS Account (create one at https://aws.amazon.com)
- Project files ready on your local machine
- Email address for SNS notifications

**Estimated Time:** 30-45 minutes

---

## Step 1: Create DynamoDB Tables

### 1.1 Create MemesTable

1. **Open AWS Console** → https://console.aws.amazon.com
2. **Sign in** to your AWS account
3. **Search for "DynamoDB"** in the top search bar → Click **DynamoDB**
4. Click **"Create table"** (orange button)
5. **Configure table:**
   - **Table name:** `MemesTable`
   - **Partition key:** `id` (Type: **String**)
   - **Table settings:** Select **"Customize settings"**
   - **Read/write capacity settings:** Select **"On-demand"**
   - **Encryption:** Leave as default (AWS owned key)
6. Click **"Create table"** (bottom right)
7. **Wait** for table status to show "Active" (30-60 seconds)

### 1.2 Create UsersTable

1. Click **"Create table"** again
2. **Configure table:**
   - **Table name:** `UsersTable`
   - **Partition key:** `email` (Type: **String**)
   - **Table settings:** Select **"Customize settings"**
   - **Read/write capacity settings:** Select **"On-demand"**
3. Click **"Create table"**
4. **Wait** for table status to show "Active"

✅ **Checkpoint:** You should now see 2 tables in DynamoDB

---

## Step 2: Create SNS Topic and Subscribe

### 2.1 Create SNS Topic

1. **Search for "SNS"** in the top search bar → Click **Simple Notification Service**
2. In the left sidebar, click **"Topics"**
3. Click **"Create topic"** (orange button)
4. **Configure topic:**
   - **Type:** Select **"Standard"**
   - **Name:** `MemeMuseumNotifications`
   - **Display name:** `Meme Museum` (optional)
5. Scroll down and click **"Create topic"**
6. **IMPORTANT:** Copy the **Topic ARN** (looks like `arn:aws:sns:us-east-1:123456789012:MemeMuseumNotifications`)
   - Save this somewhere - you'll need it later!

### 2.2 Subscribe Your Email

1. On the topic details page, click **"Create subscription"**
2. **Configure subscription:**
   - **Protocol:** Select **"Email"**
   - **Endpoint:** Enter your email address
3. Click **"Create subscription"**
4. **Check your email** → You'll receive a confirmation email
5. **Click the confirmation link** in the email
6. Refresh the SNS subscriptions page → Status should show **"Confirmed"**

✅ **Checkpoint:** You should see your email subscription with "Confirmed" status

---

## Step 3: Create IAM Role for EC2

### 3.1 Start Creating IAM Role

1. **Search for "IAM"** in the top search bar → Click **IAM**
2. In the left sidebar, click **"Roles"**
3. Click **"Create role"** (blue button)

### 3.2 Select Trusted Entity

1. **Trusted entity type:** Select **"AWS service"**
2. **Service or use case:** 
   - Under "Use cases for other AWS services", find and click **"EC2"**
   - It should show "EC2" with description "Allows EC2 instances to call AWS services on your behalf"
3. Click **"Next"** (bottom right)

### 3.3 Create Custom Policy (Before Attaching)

> **Note:** We need to create a custom policy first, then attach it to the role

1. On the "Add permissions" page, you'll see a search box and list of policies
2. **DO NOT select any existing policies yet**
3. Click **"Create policy"** (blue link on the right side)
   - This will open a **new browser tab**
4. In the new tab, click the **"JSON"** tab (next to "Visual")
5. **Delete** all the existing JSON code
6. **Copy and paste** this policy:

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

7. Click **"Next"** (bottom right)
8. **Name the policy:**
   - **Policy name:** `MemeMuseumPolicy`
   - **Description:** `Permissions for Meme Museum app to access DynamoDB and SNS`
9. Click **"Create policy"** (bottom right)
10. You'll see a success message
11. **Close this tab** and return to the "Create role" tab

### 3.4 Attach Policy to Role

1. Back on the "Add permissions" page, click the **refresh icon** (circular arrow) next to "Create policy"
2. In the search box, type: `MemeMuseumPolicy`
3. **Check the box** next to `MemeMuseumPolicy` (you should see it in the list now)
4. Click **"Next"** (bottom right)

### 3.5 Name and Create Role

1. **Role details:**
   - **Role name:** `MemeMuseumEC2Role`
   - **Description:** `IAM role for Meme Museum EC2 instance with DynamoDB and SNS access`
2. **Review** the settings:
   - Trusted entity: AWS service: ec2.amazonaws.com
   - Permissions: MemeMuseumPolicy
3. Scroll down and click **"Create role"** (bottom right)
4. You'll see a success message

✅ **Checkpoint:** You should see `MemeMuseumEC2Role` in the roles list

---

## Step 4: Launch EC2 Instance

### 4.1 Create Security Group

1. **Search for "EC2"** in the top search bar → Click **EC2**
2. In the left sidebar, scroll down to **"Network & Security"** → Click **"Security Groups"**
3. Click **"Create security group"** (orange button)
4. **Basic details:**
   - **Security group name:** `MemeMuseumSG`
   - **Description:** `Security group for Meme Museum`
   - **VPC:** Leave as default
5. **Inbound rules** - Click **"Add rule"** three times and configure:

   **Rule 1:**
   - **Type:** SSH
   - **Source:** My IP (or Anywhere for testing)
   
   **Rule 2:**
   - **Type:** HTTP
   - **Source:** Anywhere-IPv4
   
   **Rule 3:**
   - **Type:** Custom TCP
   - **Port range:** 3000
   - **Source:** Anywhere-IPv4

6. Click **"Create security group"**

### 4.2 Launch EC2 Instance

1. In the left sidebar, click **"Instances"**
2. Click **"Launch instances"** (orange button)
3. **Name and tags:**
   - **Name:** `MemeMuseumServer`
4. **Application and OS Images:**
   - **Quick Start:** Select **"Amazon Linux"**
   - **Amazon Machine Image (AMI):** Select **"Amazon Linux 2023 AMI"** (Free tier eligible)
5. **Instance type:**
   - Select **"t2.micro"** (Free tier eligible)
6. **Key pair:**
   - Click **"Create new key pair"**
   - **Key pair name:** `meme-museum-key`
   - **Key pair type:** RSA
   - **Private key file format:** .pem
   - Click **"Create key pair"**
   - **IMPORTANT:** Save the downloaded .pem file securely!
7. **Network settings:**
   - Click **"Edit"**
   - **Firewall (security groups):** Select **"Select existing security group"**
   - **Security groups:** Select `MemeMuseumSG`
8. **Configure storage:**
   - Leave as default (8 GB)
9. **Advanced details:**
   - **IAM instance profile:** Select `MemeMuseumEC2Role`
10. Click **"Launch instance"** (orange button)
11. Click **"View all instances"**
12. **Wait** for Instance State to show **"Running"** (2-3 minutes)
13. **Copy the Public IPv4 address** - you'll need this!

✅ **Checkpoint:** Instance should be running with a public IP address

---

## Step 5: Connect to EC2 and Deploy Application

### 5.1 Connect Using EC2 Instance Connect

1. **Select your instance** (check the box)
2. Click **"Connect"** (top right)
3. Click the **"EC2 Instance Connect"** tab
4. Click **"Connect"** (orange button)
5. A new browser tab will open with a terminal

### 5.2 Install Node.js

In the terminal, run these commands one by one:

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

You should see version numbers (e.g., v18.x.x)

### 5.3 Upload Application Files

**Option A: Using Git (if your code is in GitHub/GitLab)**

```bash
git clone YOUR_REPOSITORY_URL
cd aws-meme-museum
```

**Option B: Manual Upload (recommended)**

1. On your local machine, **compress** the `aws-meme-museum` folder to a ZIP file
2. Upload to a file hosting service (Google Drive, Dropbox, etc.) and get a download link
3. In the EC2 terminal:

```bash
# Download the zip file (replace URL with your link)
wget "YOUR_DOWNLOAD_LINK" -O meme-museum.zip

# Install unzip
sudo yum install -y unzip

# Extract files
unzip meme-museum.zip

# Navigate to folder
cd aws-meme-museum
```

**Option C: Use SCP from local machine** (if you have the .pem key)

Open a new terminal on your local machine:

```bash
# Replace YOUR_INSTANCE_IP with your EC2 public IP
scp -i meme-museum-key.pem -r /path/to/aws-meme-museum ec2-user@YOUR_INSTANCE_IP:~/
```

Then in EC2 terminal:
```bash
cd aws-meme-museum
```

### 5.4 Install Dependencies

```bash
npm install
```

### 5.5 Configure Environment Variables

```bash
# Create .env file
nano .env
```

Paste this content (replace `YOUR_SNS_TOPIC_ARN` with the ARN you copied earlier):

```
AWS_REGION=us-east-1
DYNAMODB_MEMES_TABLE=MemesTable
DYNAMODB_USERS_TABLE=UsersTable
SNS_TOPIC_ARN=YOUR_SNS_TOPIC_ARN
PORT=3000
```

**Save and exit:**
- Press `Ctrl + X`
- Press `Y`
- Press `Enter`

### 5.6 Start the Application

```bash
# Install PM2 for process management
sudo npm install -g pm2

# Start application
pm2 start server.js --name meme-museum

# Make PM2 start on system boot
pm2 startup
# Copy and run the command it outputs

pm2 save

# Check status
pm2 status
```

You should see the app running!

✅ **Checkpoint:** PM2 should show the app as "online"

---

## Step 6: Access Your Application

1. **Open your browser**
2. **Navigate to:** `http://YOUR_INSTANCE_IP:3000`
   - Replace `YOUR_INSTANCE_IP` with your EC2 public IP
3. You should see the **AWS Meme Museum** homepage!

---

## Step 7: Test AWS Integration

### 7.1 Test Meme Upload

1. Click **"Upload Meme"**
2. Fill in:
   - **Title:** "My First AWS Meme"
   - **Description:** "Testing DynamoDB and SNS integration"
   - **Tags:** "AWS, Test, DynamoDB"
   - **Upload an image**
3. Click **"Upload Meme"**
4. **Check your email** - you should receive an SNS notification!
5. **Verify in DynamoDB:**
   - Go to AWS Console → DynamoDB → Tables → MemesTable
   - Click **"Explore table items"**
   - You should see your meme!

### 7.2 Test Trending Tab

1. Click the **"Trending"** tab
2. Memes should be sorted by likes

### 7.3 Test Feature Function

1. Click **"Feature"** on a meme
2. **Check your email** - you should receive another SNS notification!
3. The meme should now show a "Featured" badge

---

## Troubleshooting

### Application won't start

```bash
# Check logs
pm2 logs meme-museum

# Restart application
pm2 restart meme-museum
```

### Can't access from browser

1. **Check Security Group:**
   - EC2 → Security Groups → MemeMuseumSG
   - Verify port 3000 is open
2. **Check if app is running:**
   ```bash
   pm2 status
   ```

### DynamoDB errors

1. **Verify IAM role is attached:**
   - EC2 → Instances → Select instance → Actions → Security → Modify IAM role
   - Should show `MemeMuseumEC2Role`
2. **Check table names in .env match DynamoDB tables**

### SNS notifications not received

1. **Check email subscription:**
   - SNS → Topics → MemeMuseumNotifications → Subscriptions
   - Status should be "Confirmed"
2. **Check spam folder**
3. **Verify SNS_TOPIC_ARN in .env is correct**

---

## Useful Commands

```bash
# View application logs
pm2 logs meme-museum

# Restart application
pm2 restart meme-museum

# Stop application
pm2 stop meme-museum

# Check application status
pm2 status

# View environment variables
cat .env
```

---

## Cleanup (When Done Testing)

To avoid charges, delete resources when finished:

### 1. Terminate EC2 Instance
- EC2 → Instances → Select instance → Instance state → Terminate instance

### 2. Delete DynamoDB Tables
- DynamoDB → Tables → Select MemesTable → Delete
- Repeat for UsersTable

### 3. Delete SNS Topic
- SNS → Topics → Select MemeMuseumNotifications → Delete

### 4. Delete IAM Role
- IAM → Roles → Select MemeMuseumEC2Role → Delete

### 5. Delete Security Group
- EC2 → Security Groups → Select MemeMuseumSG → Actions → Delete

---

## Cost Estimate

With Free Tier:
- **EC2 t2.micro:** 750 hours/month FREE
- **DynamoDB:** 25 GB storage + 25 WCU/RCU FREE
- **SNS:** 1,000 email notifications FREE
- **Data Transfer:** 1 GB outbound FREE

**Total Cost:** $0-2/month (mostly free tier)

---

## Next Steps

1. ✅ **Add HTTPS** - Use AWS Certificate Manager + Application Load Balancer
2. ✅ **Store images in S3** - Instead of local filesystem
3. ✅ **Add CloudWatch** - Monitor logs and metrics
4. ✅ **Add domain name** - Use Route 53 for custom domain
5. ✅ **Add auto-scaling** - Handle traffic spikes

---

## Support

**Need help?**
- Check PM2 logs: `pm2 logs meme-museum`
- Verify AWS resources are created correctly
- Ensure IAM role has proper permissions
- Check security group allows traffic on port 3000

**Common Issues:**
- **Port 3000 blocked:** Add inbound rule to security group
- **IAM permissions:** Verify role is attached to EC2 instance
- **SNS not working:** Confirm email subscription
- **DynamoDB errors:** Check table names match .env file

---

🎉 **Congratulations!** Your AWS Meme Museum is now live on AWS!

Access it at: `http://YOUR_INSTANCE_IP:3000`
