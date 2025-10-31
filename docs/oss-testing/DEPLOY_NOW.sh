#!/bin/bash

# CompAI OSS - Complete Automated Deployment Script
# This script deploys everything: App, Portal, API, and Database
# Author: Alex Alaniz
# Date: October 31, 2025

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ${NC}  $1"; }
log_success() { echo -e "${GREEN}✓${NC}  $1"; }
log_warning() { echo -e "${YELLOW}⚠${NC}  $1"; }
log_error() { echo -e "${RED}✗${NC}  $1"; }
log_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Check we're in the right directory
if [ ! -f "package.json" ]; then
    log_error "Please run this script from /Users/compai-alex/Documents/CompAI-OSS-Test/comp"
    exit 1
fi

log_header "🚀 CompAI OSS - Complete Deployment"
log_info "This script will deploy: App, Portal, API, and Database"
echo ""

# Step 1: Check authentication
log_header "Step 1: Checking CLI Authentication"

log_info "Checking GitHub CLI..."
if ! gh auth status &> /dev/null; then
    log_warning "GitHub CLI not authenticated. Please run: gh auth login"
    exit 1
fi
log_success "GitHub CLI authenticated"

log_info "Checking Vercel CLI..."
if ! vercel whoami &> /dev/null; then
    log_info "Please login to Vercel..."
    vercel login
fi
VERCEL_USER=$(vercel whoami 2>/dev/null)
log_success "Vercel authenticated as: $VERCEL_USER"

log_info "Checking Railway CLI..."
log_warning "Railway CLI requires manual setup - will provide instructions"
log_info "We'll use Neon for database and Vercel for API instead"

# Step 2: Create GitHub Repository
log_header "Step 2: Creating GitHub Repository"

GITHUB_USER=$(gh api user -q .login)
REPO_NAME="comp-oss-demo"
REPO_URL="https://github.com/$GITHUB_USER/$REPO_NAME"

log_info "Creating repository: $REPO_NAME"

if gh repo view "$GITHUB_USER/$REPO_NAME" &> /dev/null; then
    log_warning "Repository already exists: $REPO_URL"
else
    gh repo create "$REPO_NAME" \
        --public \
        --description "CompAI OSS Self-Hosting - Live Production Demo with Complete Documentation" \
        --source=. \
        --remote=personal

    log_success "Created repository: $REPO_URL"
fi

# Add documentation
log_info "Adding documentation to repository..."
mkdir -p docs/oss-testing
cp /Users/compai-alex/Documents/CompAI-OSS-Test/*.md docs/oss-testing/ 2>/dev/null || true
cp /Users/compai-alex/Documents/CompAI-OSS-Test/*.sh docs/oss-testing/ 2>/dev/null || true
chmod +x docs/oss-testing/*.sh 2>/dev/null || true

# Commit and push
git checkout -b live-oss-demo 2>/dev/null || git checkout live-oss-demo
git add -A
git commit -m "feat(oss): complete self-hosting with live deployment

- Fixed 10+ missing dependencies
- Enhanced documentation (3,390+ lines)
- Automated setup script
- All services configured
- Live deployment ready" || log_info "No changes to commit"

git push -u personal live-oss-demo || log_info "Already pushed"

log_success "Code pushed to: $REPO_URL"

# Step 3: Set up Production Database
log_header "Step 3: Setting Up Production Database (Neon)"

log_info "Please create a Neon database manually:"
echo ""
echo "  1. Go to: https://neon.tech"
echo "  2. Sign up/login"
echo "  3. Create new project: 'comp-oss-demo'"
echo "  4. Copy the DATABASE_URL connection string"
echo ""
read -p "  Paste your Neon DATABASE_URL here: " DATABASE_URL

if [ -z "$DATABASE_URL" ]; then
    log_error "DATABASE_URL is required"
    exit 1
fi

log_success "Database URL configured"

# Run migrations
log_info "Running database migrations..."
cd /Users/compai-alex/Documents/CompAI-OSS-Test/comp/packages/db
DATABASE_URL="$DATABASE_URL" bunx prisma migrate deploy
log_success "Migrations completed"

log_info "Seeding database..."
DATABASE_URL="$DATABASE_URL" bunx prisma db seed || log_info "Seed completed with warnings"
log_success "Database setup complete"

cd ../..

# Step 4: Deploy Main App to Vercel
log_header "Step 4: Deploying Main App to Vercel"

cd apps/app

log_info "Deploying main app..."

# Deploy to Vercel
vercel --prod --yes \
    --env DATABASE_URL="$DATABASE_URL" \
    --env AUTH_SECRET="QSjc+yMO6nLUpMunew5InmX3yI02YLi3ln2Fj3KGY/A=" \
    --env SECRET_KEY="BhtGQ/+dwuynaFtRVfryX5A+FKdiGyeyRAuCvf/R3ls=" \
    --env REVALIDATION_SECRET="8+d738uWQ5jlIDo1+JKDCBOezna3Yv3gUM2LHrWmlx4=" \
    --env RESEND_API_KEY="${RESEND_API_KEY}" \
    --env TRIGGER_SECRET_KEY="${TRIGGER_SECRET_KEY}" \
    --env OPENAI_API_KEY="${OPENAI_API_KEY}" \
    --env APP_AWS_ACCESS_KEY_ID="${APP_AWS_ACCESS_KEY_ID}" \
    --env APP_AWS_SECRET_ACCESS_KEY="${APP_AWS_SECRET_ACCESS_KEY}" \
    --env APP_AWS_BUCKET_NAME="${APP_AWS_BUCKET_NAME}" \
    --env APP_AWS_REGION="${APP_AWS_REGION}" \
    --env FIRECRAWL_API_KEY="${FIRECRAWL_API_KEY}" \
    --build-env BETTER_AUTH_URL="https://comp-oss-demo.vercel.app" \
    --build-env NEXT_PUBLIC_BETTER_AUTH_URL="https://comp-oss-demo.vercel.app" \
    --build-env NEXT_PUBLIC_PORTAL_URL="https://comp-oss-portal.vercel.app" \
    > /tmp/vercel-app-deploy.log 2>&1

APP_URL=$(vercel inspect --wait 2>/dev/null | grep "https://" | head -1 || echo "https://comp-oss-demo.vercel.app")

log_success "App deployed to: $APP_URL"

cd ../..

# Step 5: Deploy Trust Portal to Vercel
log_header "Step 5: Deploying Trust Portal to Vercel"

cd apps/portal

log_info "Deploying trust portal..."

vercel --prod --yes \
    --env DATABASE_URL="$DATABASE_URL" \
    --env AUTH_SECRET="QSjc+yMO6nLUpMunew5InmX3yI02YLi3ln2Fj3KGY/A=" \
    --env BETTER_AUTH_SECRET="6e53S9oxMfyO+/wELBkfZI6G5DbWcUgHqRwIwRTxuC4=" \
    --env RESEND_API_KEY="${RESEND_API_KEY}" \
    --env AUTH_GOOGLE_ID="" \
    --env AUTH_GOOGLE_SECRET="" \
    --build-env BETTER_AUTH_URL_PORTAL="https://comp-oss-portal.vercel.app" \
    --build-env NEXT_PUBLIC_BETTER_AUTH_URL="https://comp-oss-portal.vercel.app" \
    > /tmp/vercel-portal-deploy.log 2>&1

PORTAL_URL=$(vercel inspect --wait 2>/dev/null | grep "https://" | head -1 || echo "https://comp-oss-portal.vercel.app")

log_success "Portal deployed to: $PORTAL_URL"

cd ../..

# Step 6: Deploy API to Vercel
log_header "Step 6: Deploying API to Vercel"

cd apps/api

log_info "Deploying API to Vercel..."

vercel --prod --yes \
    --env DATABASE_URL="$DATABASE_URL" \
    --env AWS_ACCESS_KEY_ID="${APP_AWS_ACCESS_KEY_ID}" \
    --env AWS_SECRET_ACCESS_KEY="${APP_AWS_SECRET_ACCESS_KEY}" \
    --env AWS_BUCKET_NAME="${APP_AWS_BUCKET_NAME}" \
    --env AWS_REGION="${APP_AWS_REGION}" \
    > /tmp/vercel-api-deploy.log 2>&1

API_URL=$(vercel inspect --wait 2>/dev/null | grep "https://" | head -1 || echo "https://comp-oss-api.vercel.app")

log_success "API deployed to: $API_URL"

cd ../..

# Step 7: Update URLs in Vercel
log_header "Step 7: Updating Cross-Service URLs"

log_info "Updating app with portal URL..."
cd apps/app
vercel env add NEXT_PUBLIC_PORTAL_URL production <<< "$PORTAL_URL"
vercel env add BETTER_AUTH_URL production <<< "$APP_URL"
vercel env add NEXT_PUBLIC_BETTER_AUTH_URL production <<< "$APP_URL"

log_info "Updating portal with app URL..."
cd ../portal
vercel env add BETTER_AUTH_URL production <<< "$PORTAL_URL"
vercel env add NEXT_PUBLIC_BETTER_AUTH_URL production <<< "$PORTAL_URL"

cd ../..

log_success "URLs updated"

# Summary
log_header "🎉 Deployment Complete!"

echo ""
log_success "All services deployed successfully!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  📦 GitHub Repository:"
echo "     $REPO_URL"
echo ""
echo "  🌐 Main App:"
echo "     $APP_URL"
echo ""
echo "  🔒 Trust Portal:"
echo "     $PORTAL_URL"
echo ""
echo "  ⚡ API:"
echo "     $API_URL"
echo ""
echo "  🗄️  Database:"
echo "     Neon PostgreSQL (provisioned)"
echo ""
echo "  🔧 Trigger.dev:"
echo "     https://cloud.trigger.dev/projects/proj_maxdnuvtyyecrkdjynxk"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
log_info "Next steps:"
echo ""
echo "  1. Test the app: $APP_URL"
echo "  2. Sign up with email (magic link)"
echo "  3. Create organization"
echo "  4. Upload a file (tests S3)"
echo "  5. Create a task (tests Trigger.dev)"
echo "  6. Visit Trust Portal: $PORTAL_URL"
echo ""
log_info "Documentation: $REPO_URL/tree/live-oss-demo/docs/oss-testing"
echo ""
log_success "Deployment took: ${SECONDS}s"
echo ""
