# Build et lancement complet
all:
	docker compose -f ./srcs/docker-compose.yml build --no-cache
	docker compose -f ./srcs/docker-compose.yml up -d
	@clear

# Logs back + front
logs:
	docker logs back
	docker logs front

# Arrête les conteneurs, garde les volumes et données persistantes
clean:
	docker compose -f ./srcs/docker-compose.yml down

# Arrête tout, supprime volumes, cache Docker et fichiers persistants
fclean:
	docker compose -f ./srcs/docker-compose.yml down -v
	-docker volume rm $(docker volume ls -qf "name=sqlite_data") || true
	-docker system prune -af --volumes
	@clear

# Clean puis rebuild
re: clean all

.PHONY: all logs clean fclean re
