all: 
	docker compose -f ./srcs/docker-compose.yml up --build -d
	@clear

logs:
	docker logs back
	docker logs front

clean:
	docker compose -f ./srcs/docker-compose.yml down;

# clean up your Docker environment by forcefully removing unused data (including stopped containers, unused networks, and dangling images)
fclean: clean
	-docker system prune -af
	@clear

re: fclean all

.PHONY: all logs clean fclean re