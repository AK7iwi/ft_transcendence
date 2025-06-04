# Main target that runs everything in order
all: generate-certs build start
	@clear

# Make sure scripts directory exists and has proper permissions
setup-scripts:
	@echo "Scripts directory setup..."
	@chmod +x core/scripts/generate-certs.sh

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

# Clean up containers
clean:
	docker compose -f docker-compose.yml down

fclean:
	docker compose -f docker-compose.yml down -v;
	-docker system prune -af
	@clear

# Rebuild everything
re: fclean all

.PHONY: all logs generate-certs clean fclean re build start setup-scripts