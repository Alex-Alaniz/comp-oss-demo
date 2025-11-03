# CompAI AWS Self-Hosting Deployment Strategy

**Author:** Alex Alaniz
**Date:** November 3, 2025
**Purpose:** Test and document AWS self-hosting for OSS users
**Status:** Testing in Progress

---

## Executive Summary

This document outlines the complete AWS deployment strategy for CompAI OSS self-hosting, including architecture, costs, and step-by-step implementation.

### Why AWS Testing is Critical

From previous testing, Vercel deployment is straightforward but AWS is where **95% of OSS users will struggle**:

- ✅ Vercel: Managed platform, automatic SSL, simple deployment
- ⚠️ AWS: Manual infrastructure, networking, security groups, load balancers, SSL certs

**Goal**: Document every friction point so we can create guides that make AWS as easy as Vercel.

---

## Architecture Overview

### Deployment Components

```
┌─────────────────────────────────────────────────────────┐
│                     AWS Cloud                            │
│                                                          │
│  ┌────────────────┐         ┌────────────────┐         │
│  │   Route 53     │ ────→   │  ALB (HTTPS)   │         │
│  │   DNS          │         │  Load Balancer │         │
│  └────────────────┘         └────────┬───────┘         │
│                                      │                  │
│  ┌───────────────────────────────────┴────────────┐    │
│  │           VPC (10.0.0.0/16)                     │    │
│  │                                                  │    │
│  │  ┌──────────────────┐  ┌──────────────────┐   │    │
│  │  │  Public Subnet   │  │  Public Subnet   │   │    │
│  │  │  (AZ-1)          │  │  (AZ-2)          │   │    │
│  │  │                  │  │                  │   │    │
│  │  │  ┌────────────┐  │  │  ┌────────────┐  │   │    │
│  │  │  │   EC2      │  │  │  │   EC2      │  │   │    │
│  │  │  │   App      │  │  │  │   App      │  │   │    │
│  │  │  │   (Docker) │  │  │  │   (Docker) │  │   │    │
│  │  │  └────────────┘  │  │  └────────────┘  │   │    │
│  │  └──────────────────┘  └──────────────────┘   │    │
│  │                                                  │    │
│  │  ┌──────────────────┐  ┌──────────────────┐   │    │
│  │  │ Private Subnet   │  │ Private Subnet   │   │    │
│  │  │  (AZ-1)          │  │  (AZ-2)          │   │    │
│  │  │                  │  │                  │   │    │
│  │  │  ┌────────────┐  │  │  ┌────────────┐  │   │    │
│  │  │  │    RDS     │  │  │  │    RDS     │  │   │    │
│  │  │  │ PostgreSQL │  │  │  │  (Standby) │  │   │    │
│  │  │  └────────────┘  │  │  └────────────┘  │   │    │
│  │  └──────────────────┘  └──────────────────┘   │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────┐                                     │
│  │   S3 Bucket    │  (File storage)                     │
│  │   comp-files   │                                     │
│  └────────────────┘                                     │
└─────────────────────────────────────────────────────────┘
```

### Service Breakdown

**Compute:**
- EC2 t3.medium instances (2 vCPU, 4GB RAM)
- Docker containers for App, Portal, API
- Auto Scaling Group (min: 1, max: 3)

**Database:**
- RDS PostgreSQL 15 (db.t3.micro for testing)
- Multi-AZ for high availability
- Automated backups

**Storage:**
- S3 bucket for file uploads
- CloudFront CDN (optional, for performance)

**Networking:**
- Application Load Balancer (ALB) with HTTPS
- VPC with public/private subnets
- NAT Gateway for private subnet internet access
- Security Groups for access control

**Monitoring:**
- CloudWatch for logs and metrics
- SNS for alerts

---

## Cost Estimate

### Monthly AWS Costs (Minimal Production Setup)

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| **EC2** | 1x t3.medium | $30.37 |
| **RDS** | db.t3.micro PostgreSQL | $15.29 |
| **ALB** | Load Balancer | $22.50 |
| **S3** | 10GB storage + transfers | $1-5 |
| **Data Transfer** | 100GB outbound | $9.00 |
| **Route 53** | Hosted zone | $0.50 |
| **NAT Gateway** | 1 gateway | $32.85 |
| **Elastic IP** | 1 static IP | $3.60 |
| **CloudWatch** | Basic monitoring | $0-5 |
| **Total (minimum)** | | **~$115-125/month** |

### Cost Optimization Options

**Budget Option (~$60/month):**
- Single EC2 t3.small ($15)
- RDS db.t3.micro ($15)
- No ALB, use Elastic IP + Nginx ($3)
- No NAT Gateway, public subnets only ($0)
- No auto-scaling ($0)

**Production Option (~$200/month):**
- 2x EC2 t3.medium with auto-scaling ($60)
- RDS db.t3.small Multi-AZ ($60)
- ALB with SSL ($23)
- CloudFront CDN ($20)
- NAT Gateway ($33)
- Enhanced monitoring ($10)

---

## Prerequisites

### AWS Account Setup
- AWS account with billing enabled
- IAM user with administrator access
- AWS CLI installed and configured
- SSH key pair generated

### Domain Setup
- Domain name registered
- DNS pointing to AWS (Route 53 or external)

### Required Tools
- Docker
- AWS CLI
- kubectl (if using EKS)
- terraform (optional, for IaC)

---

## Deployment Steps

### Phase 1: VPC and Networking

```bash
# 1. Create VPC
aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=compai-vpc}]'

# 2. Create Internet Gateway
aws ec2 create-internet-gateway \
  --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=compai-igw}]'

# 3. Create Public Subnets (2 AZs)
aws ec2 create-subnet \
  --vpc-id vpc-xxxxx \
  --cidr-block 10.0.1.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=compai-public-1a}]'

aws ec2 create-subnet \
  --vpc-id vpc-xxxxx \
  --cidr-block 10.0.2.0/24 \
  --availability-zone us-east-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=compai-public-1b}]'

# 4. Create Private Subnets (for RDS)
aws ec2 create-subnet \
  --vpc-id vpc-xxxxx \
  --cidr-block 10.0.11.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=compai-private-1a}]'

aws ec2 create-subnet \
  --vpc-id vpc-xxxxx \
  --cidr-block 10.0.12.0/24 \
  --availability-zone us-east-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=compai-private-1b}]'
```

### Phase 2: RDS PostgreSQL Database

```bash
# 1. Create DB Subnet Group
aws rds create-db-subnet-group \
  --db-subnet-group-name compai-db-subnet-group \
  --db-subnet-group-description "CompAI database subnet group" \
  --subnet-ids subnet-xxxxx subnet-yyyyy

# 2. Create Security Group for RDS
aws ec2 create-security-group \
  --group-name compai-rds-sg \
  --description "CompAI RDS security group" \
  --vpc-id vpc-xxxxx

# Allow PostgreSQL from EC2 security group
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 5432 \
  --source-group sg-yyyyy

# 3. Create RDS Instance
aws rds create-db-instance \
  --db-instance-identifier compai-postgres \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username compai \
  --master-user-password <secure-password> \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name compai-db-subnet-group \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "mon:04:00-mon:05:00"
```

### Phase 3: S3 Bucket for File Storage

```bash
# 1. Create S3 bucket
aws s3 mb s3://compai-files-prod

# 2. Enable versioning
aws s3api put-bucket-versioning \
  --bucket compai-files-prod \
  --versioning-configuration Status=Enabled

# 3. Configure CORS
cat > cors.json <<EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://yourdomain.com"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

aws s3api put-bucket-cors \
  --bucket compai-files-prod \
  --cors-configuration file://cors.json
```

### Phase 4: EC2 Instance Setup

```bash
# 1. Create Security Group for EC2
aws ec2 create-security-group \
  --group-name compai-ec2-sg \
  --description "CompAI EC2 security group" \
  --vpc-id vpc-xxxxx

# Allow HTTP/HTTPS from anywhere
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# Allow SSH from your IP
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 22 \
  --cidr YOUR_IP/32

# 2. Launch EC2 Instance
aws ec2 run-instances \
  --image-id ami-xxxxx \
  --instance-type t3.medium \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxx \
  --subnet-id subnet-xxxxx \
  --user-data file://user-data.sh \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=compai-app}]'
```

### Phase 5: Docker Setup on EC2

```bash
# SSH into EC2 instance
ssh -i your-key.pem ec2-user@ec2-ip-address

# Install Docker
sudo yum update -y
sudo yum install docker -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Bun (for build)
curl -fsSL https://bun.sh/install | bash
```

### Phase 6: Application Deployment

```bash
# 1. Clone repository
git clone https://github.com/Alex-Alaniz/comp-oss-demo.git
cd comp-oss-demo

# 2. Create environment files
# Copy all .env.example to .env and fill with AWS credentials

# 3. Build Docker images
docker build -t compai-app:latest -f Dockerfile .

# 4. Run with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

### Phase 7: Load Balancer Setup

```bash
# 1. Create Target Group
aws elbv2 create-target-group \
  --name compai-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxxxx \
  --health-check-path /api/health \
  --health-check-interval-seconds 30

# 2. Register EC2 instances
aws elbv2 register-targets \
  --target-group-arn arn:aws:elasticloadbalancing:... \
  --targets Id=i-xxxxx

# 3. Create Application Load Balancer
aws elbv2 create-load-balancer \
  --name compai-alb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --security-groups sg-xxxxx

# 4. Create HTTPS listener (requires SSL certificate)
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:... \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

### Phase 8: SSL Certificate Setup

```bash
# Request certificate from ACM
aws acm request-certificate \
  --domain-name yourdomain.com \
  --subject-alternative-names www.yourdomain.com \
  --validation-method DNS

# Follow DNS validation instructions in ACM console
```

---

## Known Friction Points to Test

Based on previous local testing, these are areas where AWS deployment will likely cause issues:

### 1. Environment Variables
- ❓ How do we securely manage secrets in EC2?
- ❓ Should we use AWS Secrets Manager or Parameter Store?
- ❓ How do containers access environment variables?

### 2. Database Migrations
- ❓ How do we run migrations on RDS?
- ❓ Connection pooling configuration?
- ❓ SSL/TLS requirements for RDS?

### 3. File Storage
- ❓ S3 presigned URL generation in production?
- ❓ IAM roles vs access keys for EC2?
- ❓ Cross-region replication needs?

### 4. Networking
- ❓ Private vs public subnets - what's actually needed?
- ❓ NAT Gateway cost - is it required?
- ❓ Security group rules - minimal but secure?

### 5. Monitoring
- ❓ How to access application logs?
- ❓ Database connection monitoring?
- ❓ Error alerting setup?

### 6. Costs
- ❓ Can we get under $50/month?
- ❓ What's the minimum viable AWS setup?
- ❓ Where are the hidden costs?

---

## Testing Checklist

- [ ] Document actual AWS console steps (not just CLI)
- [ ] Test with minimal AWS knowledge (what breaks?)
- [ ] Measure time to deploy from scratch
- [ ] Document every error encountered
- [ ] Test all application features work on AWS
- [ ] Verify file uploads to S3
- [ ] Verify background jobs work
- [ ] Test database backups and restore
- [ ] Verify SSL certificates work
- [ ] Check actual monthly costs

---

## Next Steps

1. **Set up minimal AWS infrastructure** (VPC, EC2, RDS, S3)
2. **Deploy application and document every issue**
3. **Create simplified deployment guide for OSS users**
4. **Compare AWS vs Vercel deployment difficulty**
5. **Recommend optimal path for different user types**

---

**Status:** Ready to begin AWS deployment testing
