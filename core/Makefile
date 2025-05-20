all: 
	docker compose -f ./srcs/docker-compose.yml build --no-cache && docker compose -f ./srcs/docker-compose.yml up -d
	@clear
	
logs:
	docker logs back
	docker logs front

clean:
	docker compose -f ./srcs/docker-compose.yml down;

fclean:
	docker compose -f ./srcs/docker-compose.yml down -v;
	-docker system prune -af
	@clear

re: fclean all

.PHONY: all logs clean fclean re