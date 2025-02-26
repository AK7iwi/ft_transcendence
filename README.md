Makefile: 

docker system prune -af is used to clean up your Docker environment by forcefully removing unused objects

- docker system prune: 

This command removes unused data including stopped containers, unused networks, and dangling images (those that are not tagged and not referenced by any container)

- -a / --all: 

By default, Docker only removes dangling images. Adding -a tells Docker to remove all unused images, even if they are tagged

- -f / --force: This flag forces the prune operation without prompting for confirmation, which makes the process non-interactive

Docker:

