NAME		=	pong
TS_COMPILER	=	tsc
SRCS_DIR	=	srcs
OBJS_DIR	=	objs
HTML		=	index.html
BROWSER		=	cmd.exe /c start
TS_FILES	=	$(wildcard $(SRCS_DIR)/*.ts)
JS_FILES	=	$(TS_FILES:$(SRCS_DIR)/%.ts=$(OBJS_DIR)/%.js)

RM			=	rm -rf

all:	$(NAME)

$(OBJS_DIR)/%.js: $(SRCS_DIR)/%.ts | $(OBJS_DIR)
	$(TS_COMPILER) --outDir $(OBJS_DIR) $<

$(OBJS_DIR):
	mkdir -p $(OBJS_DIR)

$(NAME):	$(JS_FILES)
	$(BROWSER) $(HTML)

run:
	$(BROWSER) $(HTML)
	
clean:
	$(RM) $(OBJS_DIR)

fclean:	clean
	$(RM) $(NAME)

re: fclean all

.PHONY: all clean fclean re