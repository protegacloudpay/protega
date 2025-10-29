.PHONY: help run build stop clean logs test

help: ## Show this help message
	@echo "Protega CloudPay - Make Commands"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

run: ## Start all services
	docker compose up --build

up: run ## Alias for run

stop: ## Stop all services
	docker compose down

clean: ## Stop services and remove volumes
	docker compose down -v

logs: ## Show logs from all services
	docker compose logs -f

logs-api: ## Show API logs only
	docker compose logs -f api

logs-web: ## Show web logs only
	docker compose logs -f web

logs-db: ## Show database logs only
	docker compose logs -f db

restart: stop run ## Restart all services

shell-api: ## Open shell in API container
	docker compose exec api /bin/bash

shell-web: ## Open shell in web container
	docker compose exec web /bin/sh

db-shell: ## Open PostgreSQL shell
	docker compose exec db psql -U protega -d protega

seed: ## Seed test merchant data
	docker compose exec api python -m protega_api.seed

migrate: ## Run database migrations
	docker compose exec api alembic upgrade head

migration: ## Create a new migration
	@read -p "Enter migration message: " msg; \
	docker compose exec api alembic revision --autogenerate -m "$$msg"

