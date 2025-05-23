all: 
	docker compose -f docker-compose.yml build --no-cache && docker compose -f docker-compose.yml up -d
	@clear
	
logs:
	docker logs back
	docker logs front

clean:
	docker compose -f docker-compose.yml down;

fclean:
	docker compose -f docker-compose.yml down -v;
	-docker system prune -af
	@clear

re: clean all

.PHONY: all logs clean fclean re