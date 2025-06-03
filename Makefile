all: generate-certs build start
	@clear	

setup-scripts:
	@echo "Scripts directory setup..."
	@chmod +x ./core/scripts/generate-certs.sh

# Generate SSL certificates
generate-certs: setup-scripts
	@echo "Generating SSL certificates..."
	@./core/scripts/generate-certs.sh

# Build and start containers
build:
	@echo "Build containers..."
	docker compose -f ./docker-compose.yml build --no-cache

# Start containers
start:
	@echo "Starting containers..."
	docker compose -f ./docker-compose.yml up -d

# Logs back + front
logs:
	docker logs back
	docker logs front

# Arrête les conteneurs, garde les volumes et données persistantes
clean:
	docker compose -f ./docker-compose.yml down

# Arrête tout, supprime volumes, cache Docker et fichiers persistants
fclean:
	docker compose -f ./docker-compose.yml down -v
	-docker volume rm $(docker volume ls -qf "name=sqlite_data") || true
	-docker system prune -af --volumes
	@clear

# Clean puis rebuild
re: clean all

.PHONY: all logs clean fclean re
