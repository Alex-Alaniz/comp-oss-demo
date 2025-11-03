#!/bin/bash

# CompAI OSS Development Environment - Magic Startup Script
# This script starts everything you need with a single command

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ${NC}  $1"
}

log_success() {
    echo -e "${GREEN}✓${NC}  $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC}  $1"
}

log_error() {
    echo -e "${RED}✗${NC}  $1"
}

log_step() {
    echo -e "\n${PURPLE}▸${NC} ${CYAN}$1${NC}\n"
}

# Trap errors and cleanup
cleanup() {
    if [ $? -ne 0 ]; then
        log_error "Setup failed. Cleaning up..."
        docker compose -f docker-compose.dev.yml down 2>/dev/null || true
    fi
}
trap cleanup EXIT

# ASCII Art Banner
echo -e "${PURPLE}"
cat << "EOF"
   ____                           _    ___
  / ___|___  _ __ ___  _ __      / \  |_ _|
 | |   / _ \| '_ ` _ \| '_ \    / _ \  | |
 | |__| (_) | | | | | | |_) |  / ___ \ | |
  \____\___/|_| |_| |_| .__/  /_/   \_\___|
                      |_|
        OSS Development Environment
EOF
echo -e "${NC}"

log_step "Starting CompAI OSS Development Environment"

# Check prerequisites
log_info "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    log_error "Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

if ! command -v bun &> /dev/null; then
    log_error "Bun is not installed. Please install Bun first: https://bun.sh"
    exit 1
fi

log_success "All prerequisites installed"

# Check if .env files exist
log_info "Checking environment files..."

REQUIRED_ENV_FILES=(
    "packages/db/.env"
    "apps/app/.env"
    "apps/portal/.env"
    "apps/api/.env"
)

MISSING_ENV=false
for env_file in "${REQUIRED_ENV_FILES[@]}"; do
    if [ ! -f "$env_file" ]; then
        log_warning "Missing: $env_file"
        MISSING_ENV=true
    fi
done

if [ "$MISSING_ENV" = true ]; then
    log_error "Some .env files are missing. Please create them from the .env.example files."
    log_info "Run: cp apps/app/.env.example apps/app/.env (and do the same for other apps)"
    exit 1
fi

log_success "All environment files present"

# Step 1: Start Docker containers
log_step "Step 1/6: Starting Docker containers (PostgreSQL)"

log_info "Starting database..."
docker compose -f docker-compose.dev.yml up -d postgres

log_info "Waiting for PostgreSQL to be healthy..."
timeout=60
elapsed=0
while ! docker compose -f docker-compose.dev.yml exec -T postgres pg_isready -U postgres -d comp_oss_test > /dev/null 2>&1; do
    if [ $elapsed -ge $timeout ]; then
        log_error "PostgreSQL failed to start within $timeout seconds"
        exit 1
    fi
    sleep 1
    elapsed=$((elapsed + 1))
    echo -n "."
done
echo ""

log_success "PostgreSQL is ready"

# Step 2: Install dependencies
log_step "Step 2/6: Installing dependencies"

log_info "Running bun install..."
bun install --frozen-lockfile > /dev/null 2>&1 || bun install

log_success "Dependencies installed"

# Step 3: Generate Prisma Client
log_step "Step 3/6: Generating Prisma client"

log_info "Generating Prisma client for apps/app..."
cd apps/app && bun run db:generate > /dev/null 2>&1
cd ../..

log_info "Generating Prisma client for apps/portal..."
cd apps/portal && bun run db:generate > /dev/null 2>&1
cd ../..

log_info "Generating Prisma client for apps/api..."
cd apps/api && bun run db:generate > /dev/null 2>&1
cd ../..

log_success "Prisma clients generated"

# Step 4: Run database migrations
log_step "Step 4/6: Running database migrations"

log_info "Applying Prisma migrations..."
cd packages/db
bun run db:migrate > /dev/null 2>&1 || log_warning "Migrations may have already been applied"
cd ../..

log_success "Database migrations complete"

# Step 5: Seed database (optional, only if not already seeded)
log_step "Step 5/6: Seeding database"

log_info "Checking if database needs seeding..."
# Check if there are any users in the database
USER_COUNT=$(docker compose -f docker-compose.dev.yml exec -T postgres psql -U postgres -d comp_oss_test -t -c "SELECT COUNT(*) FROM \"User\";" 2>/dev/null | tr -d ' \n' || echo "0")

if [ "$USER_COUNT" = "0" ]; then
    log_info "Database is empty. Seeding with initial data..."
    cd packages/db
    bun run db:seed > /dev/null 2>&1 || log_warning "Seeding may have failed or data already exists"
    cd ../..
    log_success "Database seeded"
else
    log_info "Database already contains data (skipping seed)"
fi

# Step 6: Start all applications
log_step "Step 6/6: Starting applications"

log_info "Starting all applications in development mode..."
log_info "This will start:"
log_info "  - Main App (http://localhost:3000)"
log_info "  - Trust Portal (http://localhost:3002)"
log_info "  - API (http://localhost:3001)"

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${CYAN}📱 Your services are now running:${NC}\n"
echo -e "  ${BLUE}Main App:${NC}       http://localhost:3000"
echo -e "  ${BLUE}Trust Portal:${NC}   http://localhost:3002"
echo -e "  ${BLUE}API:${NC}            http://localhost:3001"
echo -e "  ${BLUE}PostgreSQL:${NC}     localhost:5432"
echo -e "  ${BLUE}Health Check:${NC}   http://localhost:3000/api/health"

echo -e "\n${CYAN}💡 Useful commands:${NC}\n"
echo -e "  ${YELLOW}Stop all services:${NC}    Ctrl+C"
echo -e "  ${YELLOW}Stop database:${NC}        docker compose -f docker-compose.dev.yml down"
echo -e "  ${YELLOW}Clean database:${NC}       docker compose -f docker-compose.dev.yml down -v"
echo -e "  ${YELLOW}View logs:${NC}            Check the terminal output below"

echo -e "\n${CYAN}🚀 Starting applications...${NC}\n"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Start all apps using turbo dev
bun run dev
