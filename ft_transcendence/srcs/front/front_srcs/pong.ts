window.onload = () =>
    {
        const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
        const ctx = canvas.getContext("2d");
    
        if (!ctx)
        {
            console.error("Canvas not supported.");
            return ;
        } 
        
        // Type assertion to tell TypeScript ctx is not null
        const ctxNonNull = ctx as CanvasRenderingContext2D;
        
    /*   -~-~-~-   CANVAS DRAWING    -~-~-~-   */
    
        function draw()
        {
            // background
            ctxNonNull.fillStyle = "black";
            ctxNonNull.fillRect(0, 0, canvas.width, canvas.height);
    
            // paddles
            ctxNonNull.fillStyle = "white";
            ctxNonNull.fillRect(10, leftPaddleY, paddleWidth, paddleHeight);
            ctxNonNull.fillRect(canvas.width - 15, rightPaddleY, paddleWidth, paddleHeight);
            
            // ball
            ctxNonNull.fillStyle = ballColor;
            ctxNonNull.beginPath();
            ctxNonNull.arc(ballX, ballY, 5, 0, Math.PI * 2);
            ctxNonNull.fill();
    
            // start text
            ctxNonNull.fillStyle = "white";
            ctxNonNull.font = "30px 'Gugi', sans-serif"
            ctxNonNull.textAlign = "center";
            ctxNonNull.textBaseline = "middle";
            
            if (isStopped)
            {
                if (leftScore === 5 || rightScore === 5)
                {
                    ctxNonNull.fillText(`${leftScore === 5 ? "Gaucho" : "Facho"} Wins!`, canvas.width / 2, canvas.height / 2 - 40);
                    ctxNonNull.font = "15px 'Gugi', sans-serif"
                    ctxNonNull.fillText("Press Space to Restart", canvas.width / 2, canvas.height / 2 + 40);
                }
                else if (countdown === 4)
                    ctxNonNull.fillText("Press Space to Start", canvas.width / 2, canvas.height / 2 - 40);
                else if (countdown > 0)
                    ctxNonNull.fillText(countdown.toString(), canvas.width / 2, canvas.height / 2 - 40);
                else if (countdown === 0)
                {
                    ctxNonNull.font = "50px 'Gugi', sans-serif";
                    ctxNonNull.fillText("GO !", canvas.width / 2, canvas.height / 2 - 40);
                    setTimeout(() =>
                    {
                        countdown = -1;
                    }, 1000);
                }
            }
            
            // score
            ctxNonNull.font = "20px 'Gugi', sans-serif";
            ctxNonNull.textAlign = "left";
            ctxNonNull.fillText(`Gaucho : ${leftScore}`, 20, 20);
            ctxNonNull.textAlign = "right";
            ctxNonNull.fillText(`Facho : ${rightScore}`, canvas.width - 20, 20);
        }
    
        
    /*  -~-~-~-   PADDLE PROPERTIES   -~-~-~-   */
    
        // paddle properties
        const paddleWidth = 5;
        const paddleHeight = 50;
        let leftPaddleY = (canvas.height - paddleHeight) / 2;
        let rightPaddleY = (canvas.height - paddleHeight) / 2;
        const paddleSpeed = 5;
    
        // paddle movement
        let leftPaddleUp = false, leftPaddleDown = false;
        let rightPaddleUp = false, rightPaddleDown = false;
    
        // keybinds
        document.addEventListener("keydown", (event) =>
        {
            if (event.key === "w") leftPaddleUp = true;
            if (event.key === "s") leftPaddleDown = true;
            if (event.key === "ArrowUp") rightPaddleUp = true;
            if (event.key === "ArrowDown") rightPaddleDown = true;
    
            if (event.key === " " && isStopped && !isSpacePressed && !isMenuOpen)
            {
                if (leftScore === 5 || rightScore === 5)
                    resetGame();
                startGame();
                isSpacePressed = true;
            }
    
            if (event.key === "Escape")
            {
                if (isMenuOpen)
                    closeMenu();
                else
                    openMenu();
            }
        });
    
        document.addEventListener("keyup", (event) =>
        {
            if (event.key === "w") leftPaddleUp = false;
            if (event.key === "s") leftPaddleDown = false;
            if (event.key === "ArrowUp") rightPaddleUp = false;
            if (event.key === "ArrowDown") rightPaddleDown = false;
        });
        
        
    /*   -~-~-~- BALL PROPERTIES -~-~-~-   */
        
        // ball properties
        let ballColor = "#ffffff";
        let ballX = canvas.width / 2;
        let ballY = canvas.height / 2;
        let ballSpeedX = 0;
        let ballSpeedY = 0;
        
    
    /*   -~-~-~-   SCORE & STATE   -~-~-~-   */
    
        let leftScore = 0;
        let rightScore = 0;
    
        let countdown = 4;
        let isStopped = true;
        let isSpacePressed = false;
    
    /*   -~-~-~-   MENU   -~-~-~-   */
    
        let isMenuOpen = false;
    
        function openMenu() {
            isMenuOpen = true;
            isStopped = true;
        
            const canvasContainer = document.getElementById("gameContainer");
            if (!canvasContainer)
                return;
            
            const rect = canvasContainer.getBoundingClientRect();
            
            // menu overlay
            const menu = document.createElement("div");
            menu.id = "menu";
            menu.style.position = "absolute";
            menu.style.top = rect.top + "px";
            menu.style.left = rect.left + "px";
            menu.style.width = canvas.width + "px";
            menu.style.height = canvas.height + "px";
            menu.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
            menu.style.display = "flex";
            menu.style.flexDirection = "column";
            menu.style.alignItems = "center";
            menu.style.justifyContent = "center";
            document.body.appendChild(menu);
    
            // title
            const title = document.createElement("h1");
            title.innerText = "GAME MENU";
            title.style.color = "white";
            title.style.font = "42px 'Gugi', sans-serif";
            title.style.margin = "0"; 
            title.style.textShadow = "2px 2px 4px #00ffff";
            title.style.opacity = "1";
            menu.appendChild(title);
    
            // ball color container
            const ballColorContainer = document.createElement("div");
            ballColorContainer.style.display = "flex";
            ballColorContainer.style.flexDirection = "row";
            ballColorContainer.style.alignItems = "center";
            ballColorContainer.style.gap = "15px"
    
            // ball color label (the text)
            const ballColorLabel = document.createElement("label");
            ballColorLabel.innerText = "ball color";
            ballColorLabel.style.color = "white";
            ballColorLabel.style.font = "30px 'Gugi', sans-serif";
            ballColorLabel.style.cursor = "pointer";
            ballColorLabel.style.transition = "all 0.2s ease";
            
            // hover effect
            ballColorLabel.addEventListener("mouseenter", () =>
            {
                ballColorLabel.style.transform = "scale(1.1)";
                ballColorLabel.style.textShadow = "0 0 8px #00ffff";
            });
            ballColorLabel.addEventListener("mouseleave", () =>
            {
                ballColorLabel.style.transform = "scale(1)";
                ballColorLabel.style.textShadow = "none";
            });
            
            const ballColorInput = document.createElement("input");
            ballColorInput.type = "color";
            ballColorInput.value = ballColor || "#ffffff";
            ballColorInput.style.width = "20px";
            ballColorInput.style.height = "20px";
            ballColorInput.style.borderRadius = "50%";
            ballColorInput.style.border = "2px solid white";
            ballColorInput.style.padding = "0";
            ballColorInput.style.cursor = "pointer";
            ballColorInput.style.backgroundColor = "transparent";
            ballColorInput.style.transition = "all 0.2s ease";
            ballColorInput.style.appearance = "none"; // Removes default UI
            ballColorInput.style.outline = "none"; // Prevents highlight outline
            
            // hover effect
            ballColorInput.addEventListener("mouseenter", () =>
                {
                    ballColorInput.style.transform = "scale(1.1)";
                    ballColorInput.style.textShadow = "0 0 8px #00ffff";
                });
                ballColorInput.addEventListener("mouseleave", () =>
                {
                    ballColorInput.style.transform = "scale(1)";
                    ballColorInput.style.textShadow = "none";
                });
                
            // open color picker
            const openColorPicker = () => ballColorInput.click();
            ballColorLabel.addEventListener("click", openColorPicker);
    
            // update ball color
            ballColorInput.addEventListener("input", (e) => {
                ballColor = (e.target as HTMLInputElement).value;
            });
    
            ballColorContainer.appendChild(ballColorLabel);
            ballColorContainer.appendChild(ballColorInput); // Hidden input
            menu.appendChild(ballColorContainer);
        }
    
        function closeMenu()
        {
            isMenuOpen = false;
            isStopped = false;
    
            const menu = document.getElementById("menu");
            if (menu)
                document.body.removeChild(menu);
        }
    
    /*   -~-~-~-   ACTUALLY THE GAME   -~-~-~-   */
    
        function update()
        {
            // move paddles
            if (leftPaddleUp && leftPaddleY > 0)
                leftPaddleY -= paddleSpeed;
            if (leftPaddleDown && leftPaddleY < canvas.height - paddleHeight)
                leftPaddleY += paddleSpeed;
            if (rightPaddleUp && rightPaddleY > 0)
                rightPaddleY -= paddleSpeed;
            if (rightPaddleDown && rightPaddleY < canvas.height - paddleHeight)
                rightPaddleY += paddleSpeed;
            
            // move ball
            ballX += ballSpeedX;
            ballY += ballSpeedY;
            
            // paddle collision
            if (ballX - 5 <= 15 && ballX - 5 >= 5 && ballY > leftPaddleY && ballY < leftPaddleY + paddleHeight)
            {
                ballSpeedX = -ballSpeedX;
                
                let deltaY = ballY - (leftPaddleY + paddleHeight / 2);
                ballSpeedY = deltaY * 0.2;
            }
            
            if (ballX + 5 >= canvas.width - 15 && ballX + 5 <= canvas.width - 5 && ballY > rightPaddleY && ballY < rightPaddleY + paddleHeight)
            {
                ballSpeedX = -ballSpeedX;
    
                let deltaY = ballY - (rightPaddleY + paddleHeight / 2);
                ballSpeedY =deltaY * 0.2;
            }
            
            // ball collision with bot and top walls
            if (ballY <= 0 || ballY >= canvas.height)
                ballSpeedY = -ballSpeedY;
            
            // scoring
            if (ballX <= 5)
            {
                rightScore += 1;
                resetBall();
            }
            if (ballX >= canvas.width - 5)
            {
                leftScore += 1;
                resetBall();
            }
            if (leftScore === 5 || rightScore === 5)
                isStopped = true;
        }
        
        function resetGame()
        {
            leftScore = 0;
            rightScore = 0;
            resetBall();
            isStopped = true;
            countdown = 4;
            draw();
        }
        
        function startGame()
        {
            countdown = 3;
            draw();
            
            const   countdownInterval = setInterval(() =>
            {
                if (countdown > 1)
                    countdown--;
                else
                {
                    clearInterval(countdownInterval);
                    countdown = 0;
                    draw();
                    setTimeout(() =>
                    {
                        countdown = -1;
                        ballSpeedX = Math.random() > 0.5 ? 3 : -3;
                        ballSpeedY = Math.random() * 2 + 2;
                        isStopped = false;
                        isSpacePressed = false;
                    }, 1000);
                }
            }, 1000);
        }
        
        function resetBall()
        {
            ballX = canvas.width / 2;
            ballY = canvas.height / 2;
            ballSpeedX = 0;
            ballSpeedY = 0;
            isStopped = true;
            countdown = 4;
        }
        
        function gameLoop()
        {
            update();
            draw();
            requestAnimationFrame(gameLoop);
        }
    
        gameLoop();
    }