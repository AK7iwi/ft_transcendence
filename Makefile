all: 
	docker compose -f ./srcs/docker-compose.yml up --build -d
	@clear

clean:
	docker compose -f ./srcs/docker-compose.yml down;

fclean: clean
	-docker system prune -af
	@clear	

re: fclean all

.Phony: all logs clean fclean