# Main target that runs everything in order
all: generate-certs build start
	@clear

# Make sure scripts directory exists and has proper permissions
setup-scripts:
	@echo "Scripts directory setup..."
	@chmod +x core/scripts/generate-certs.sh
	@chmod +x core/scripts/clean-certs.sh

# Generate SSL certificates
generate-certs: setup-scripts
	@echo "Generating SSL certificates..."
	@./core/scripts/generate-certs.sh

# Build and start containers
build:
	@echo "Build containers..."
	docker compose -f docker-compose.yml build --no-cache

# Start containers
start:
	@echo "Starting containers..."
	docker compose -f docker-compose.yml up -d

# View logs
logs:
	docker logs back
	docker logs front

# Stop and remove all containers
clean-containers:
	@echo "Stopping and removing all containers..."
	-docker stop $(shell docker ps -aq) 2>/dev/null || true
	-docker rm $(shell docker ps -aq) 2>/dev/null || true

# Clean certificates and security files
clean-certs: setup-scripts
	@echo "Cleaning certificates and security files..."
	@./core/scripts/clean-certs.sh

# Clean Docker system (images, volumes, networks)
clean-docker:
	@echo "Cleaning Docker system..."
	docker compose -f docker-compose.yml down -v
	-docker system prune -af

# Clean up containers
clean:
	docker compose -f docker-compose.yml down
	@clear

fclean: clean-containers clean-certs clean-docker
	@clear

# Rebuild everything
re: clean all

.PHONY: all logs generate-certs clean-certs clean-containers clean-docker clean fclean re build start setup-scripts