.PHONY: help dev stop clean setup test

.DEFAULT_GOAL := help

help: ## Show this help message
	@echo ''
	@echo 'CompAI OSS - Available Commands:'
	@echo ''
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ''

dev: ## Start everything (database + all apps) - THE MAGIC COMMAND ✨
	@./dev.sh

start: dev ## Alias for 'dev'

stop: ## Stop all Docker containers
	@echo "Stopping Docker containers..."
	@docker compose -f docker-compose.dev.yml down

clean: ## Stop containers and remove all data (fresh start)
	@echo "Cleaning up Docker containers and volumes..."
	@docker compose -f docker-compose.dev.yml down -v
	@echo "Cleaned! Run 'make dev' to start fresh."

db-up: ## Start only the database
	@docker compose -f docker-compose.dev.yml up -d postgres
	@echo "PostgreSQL started on localhost:5432"

db-down: ## Stop the database
	@docker compose -f docker-compose.dev.yml down

db-logs: ## View database logs
	@docker compose -f docker-compose.dev.yml logs -f postgres

db-shell: ## Open PostgreSQL shell
	@docker compose -f docker-compose.dev.yml exec postgres psql -U postgres -d comp_oss_test

db-migrate: ## Run database migrations
	@cd packages/db && bun run db:migrate

db-seed: ## Seed the database
	@cd packages/db && bun run db:seed

db-reset: ## Reset database (clean + migrate + seed)
	@make clean
	@make db-up
	@sleep 3
	@make db-migrate
	@make db-seed
	@echo "Database reset complete!"

install: ## Install dependencies
	@echo "Installing dependencies..."
	@bun install
	@echo "Dependencies installed!"

build: ## Build all applications
	@echo "Building all applications..."
	@bun run build

test: ## Run tests
	@echo "Running tests..."
	@bun run test

lint: ## Run linter
	@bun run lint

format: ## Format code
	@bun run format

setup: install ## Initial setup (install + generate Prisma clients)
	@echo "Generating Prisma clients..."
	@cd apps/app && bun run db:generate
	@cd apps/portal && bun run db:generate
	@cd apps/api && bun run db:generate
	@echo "Setup complete! Run 'make dev' to start."

health: ## Check if all services are running
	@echo "Checking service health..."
	@echo -n "Database: "
	@docker compose -f docker-compose.dev.yml ps postgres | grep -q "Up" && echo "✓ Running" || echo "✗ Not running"
	@echo -n "Main App: "
	@curl -sf http://localhost:3000/api/health > /dev/null && echo "✓ Running" || echo "✗ Not running"
	@echo -n "API: "
	@curl -sf http://localhost:3001 > /dev/null && echo "✓ Running" || echo "✗ Not running"
	@echo -n "Portal: "
	@curl -sf http://localhost:3002 > /dev/null && echo "✓ Running" || echo "✗ Not running"

logs: ## View logs from all services
	@echo "Viewing logs... (Ctrl+C to exit)"
	@docker compose -f docker-compose.dev.yml logs -f

ps: ## Show running containers
	@docker compose -f docker-compose.dev.yml ps
