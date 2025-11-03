# CompAI OSS - Quick Start Guide ⚡

Get the entire CompAI stack running locally with a single command!

## 🎯 What You'll Get

Running `./dev.sh` will automatically:

- ✅ Start PostgreSQL database in Docker
- ✅ Install all dependencies
- ✅ Generate Prisma clients
- ✅ Run database migrations
- ✅ Seed initial data
- ✅ Start all 3 applications:
  - Main App (http://localhost:3000)
  - Trust Portal (http://localhost:3002)
  - API (http://localhost:3001)

## 📋 Prerequisites

Before running the magic setup, ensure you have:

1. **Docker & Docker Compose** - [Install Docker](https://docs.docker.com/get-docker/)
2. **Bun** - [Install Bun](https://bun.sh)
3. **Git** - For cloning the repository

## 🚀 Quick Setup (3 Steps)

### Step 1: Clone the Repository

```bash
git clone https://github.com/trycompai/comp.git
cd comp
```

### Step 2: Configure Environment Variables

Create and configure your environment files:

```bash
# Copy example files
cp apps/app/.env.example apps/app/.env
cp apps/portal/.env.example apps/portal/.env
cp apps/api/.env.example apps/api/.env
cp packages/db/.env.example packages/db/.env
```

**Minimum Required Configuration:**

Edit each `.env` file and set these values:

**packages/db/.env:**
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/comp_oss_test"
```

**apps/app/.env:**
```bash
# Database (uses local PostgreSQL started by dev.sh)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/comp_oss_test"

# Auth (generate with: openssl rand -base64 32)
AUTH_SECRET="your-generated-secret-here"
SECRET_KEY="your-generated-secret-here"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"
REVALIDATION_SECRET="your-generated-secret-here"

# Email (get free API key from resend.com)
RESEND_API_KEY="your-resend-api-key"

# Background Jobs (get free account from trigger.dev)
TRIGGER_SECRET_KEY="your-trigger-dev-key"

# AI (get API key from openai.com)
OPENAI_API_KEY="your-openai-api-key"

# File Storage (create AWS S3 bucket)
APP_AWS_ACCESS_KEY_ID="your-aws-access-key"
APP_AWS_SECRET_ACCESS_KEY="your-aws-secret"
APP_AWS_BUCKET_NAME="your-bucket-name"
APP_AWS_REGION="us-east-1"

# Portal URL
NEXT_PUBLIC_PORTAL_URL="http://localhost:3002"

# Optional: Vendor Research
FIRECRAWL_API_KEY=""
```

**apps/portal/.env:**
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/comp_oss_test"
AUTH_SECRET="different-secret-than-app"
BETTER_AUTH_SECRET="another-different-secret"
BETTER_AUTH_URL="http://localhost:3002"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3002"
RESEND_API_KEY="your-resend-api-key"
```

**apps/api/.env:**
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/comp_oss_test"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_BUCKET_NAME="your-bucket-name"
AWS_REGION="us-east-1"
```

> **💡 Tip:** For development, you can skip optional services like Firecrawl. The app will work without them.

### Step 3: Run the Magic Setup! ✨

```bash
./dev.sh
```

That's it! The script will:
1. Verify all prerequisites
2. Start PostgreSQL in Docker
3. Install dependencies
4. Run migrations and seed data
5. Start all applications

You'll see a beautiful output showing the progress, and when complete, all services will be running!

## 🌐 Access Your Services

Once running, access these URLs:

- **Main App:** http://localhost:3000
- **Trust Portal:** http://localhost:3002
- **API:** http://localhost:3001
- **Health Check:** http://localhost:3000/api/health

## 📚 Service Setup Guides

### Required Services (Free Tiers Available)

#### 1. Resend (Email Delivery)
1. Sign up at https://resend.com
2. Create an API key
3. Add to `RESEND_API_KEY` in your .env files

#### 2. Trigger.dev (Background Jobs)
1. Sign up at https://trigger.dev
2. Create a new project
3. Copy your dev secret key to `TRIGGER_SECRET_KEY`

#### 3. AWS S3 (File Storage)
1. Create an AWS account
2. Create an S3 bucket
3. Create an IAM user with S3 access
4. Add credentials to AWS_* variables

#### 4. OpenAI (AI Features)
1. Sign up at https://platform.openai.com
2. Create an API key
3. Add to `OPENAI_API_KEY`

### Optional Services

#### Firecrawl (Vendor Research)
1. Sign up at https://firecrawl.dev
2. Get API key
3. Add to `FIRECRAWL_API_KEY`

#### Fleet MDM (Device Management)
To enable Fleet MDM locally, uncomment the fleet services in `docker-compose.dev.yml` and add:

```bash
FLEET_URL="http://localhost:8080"
FLEET_TOKEN="your-fleet-token"
```

## 🛠️ Useful Commands

### Stop Everything
```bash
# Stop apps (Ctrl+C in the terminal where dev.sh is running)
# Stop database
docker compose -f docker-compose.dev.yml down
```

### Clean Database (Start Fresh)
```bash
docker compose -f docker-compose.dev.yml down -v
./dev.sh  # Run again to recreate everything
```

### View Logs
The dev.sh script shows all logs in real-time. Each service is color-coded.

### Run Individual Services

If you prefer to run services separately:

```bash
# Start database only
docker compose -f docker-compose.dev.yml up -d postgres

# Run migrations
cd packages/db && bun run db:migrate && cd ../..

# Start individual apps
cd apps/app && bun run dev        # Main app on :3000
cd apps/portal && bun run dev     # Portal on :3002
cd apps/api && bun run dev        # API on :3001
```

## 🐛 Troubleshooting

### Port Already in Use

If you get port conflicts:
```bash
# Check what's using the port
lsof -i :3000  # Or :3002, :3001, :5432

# Stop conflicting services
docker compose -f docker-compose.dev.yml down
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker compose -f docker-compose.dev.yml ps

# View database logs
docker compose -f docker-compose.dev.yml logs postgres

# Restart database
docker compose -f docker-compose.dev.yml restart postgres
```

### Missing Dependencies

```bash
# Clean install
rm -rf node_modules
bun install
./dev.sh
```

### Prisma Client Issues

```bash
# Regenerate Prisma clients
cd apps/app && bun run db:generate
cd apps/portal && bun run db:generate
cd apps/api && bun run db:generate
```

## 🎓 Next Steps

After getting everything running:

1. **Create an Account**
   - Visit http://localhost:3000
   - Sign up with email (magic link sent via Resend)

2. **Create an Organization**
   - Complete onboarding flow
   - Select compliance frameworks

3. **Explore Features**
   - Navigate through frameworks, controls, policies
   - Upload files to test S3 integration
   - Create tasks to test Trigger.dev
   - Test the Trust Portal at :3002

4. **Deploy to Production**
   - See [DEPLOYMENT_STRATEGY.md](docs/oss-testing/DEPLOYMENT_STRATEGY.md)
   - Follow Vercel deployment guide

## 📖 Additional Resources

- [Full Setup Documentation](SELF_HOSTING.md)
- [Deployment Strategy](docs/oss-testing/DEPLOYMENT_STRATEGY.md)
- [Friction Points Analysis](docs/oss-testing/FRICTION_POINTS.md)
- [OSS Improvements Proposal](docs/oss-testing/OSS_IMPROVEMENTS_PROPOSAL.md)

## 💬 Getting Help

- **Issues:** [GitHub Issues](https://github.com/trycompai/comp/issues)
- **Discord:** [Join our community](https://discord.gg/comp)
- **Docs:** [docs.trycomp.ai](https://docs.trycomp.ai)

---

**Happy Hacking! 🚀**

If you encounter any issues, please let us know by creating an issue on GitHub.
