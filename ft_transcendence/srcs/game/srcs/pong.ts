/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   pong.ts                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: marvin <marvin@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/03/18 23:38:46 by marvin            #+#    #+#             */
/*   Updated: 2025/04/03 09:43:41 by marvin           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

window.onload = () =>
{
    const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");

    if (!ctx)
    {
        console.error("Canvas not supported.");
        return ;
    } 
    
/*   -~-~-~-   CANVAS DRAWING    -~-~-~-   */

    function draw()
    {
        // background
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // paddles
        ctx.fillStyle = "white";
        ctx.fillRect(10, leftPaddleY, paddleWidth, paddleHeight);
        ctx.fillRect(canvas.width - 15, rightPaddleY, paddleWidth, paddleHeight);
        
        // ball
        ctx.fillStyle = ballColor;
        ctx.beginPath();
        ctx.arc(ballX, ballY, 5, 0, Math.PI * 2);
        ctx.fill();

        // start text
        ctx.fillStyle = "white";
        ctx.font = "30px 'Gugi', sans-serif"
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        if (isStopped)
        {
            if (leftScore === 5 || rightScore === 5)
            {
                ctx.fillText(`${leftScore === 5 ? "Gaucho" : "Facho"} Wins!`, canvas.width / 2, canvas.height / 2 - 40);
                ctx.font = "15px 'Gugi', sans-serif"
                ctx.fillText("Press Space to Restart", canvas.width / 2, canvas.height / 2 + 40);
            }
            else if (countdown === 4)
                ctx.fillText("Press Space to Start", canvas.width / 2, canvas.height / 2 - 40);
            else if (countdown > 0)
                ctx.fillText(countdown.toString(), canvas.width / 2, canvas.height / 2 - 40);
            else if (countdown === 0)
            {
                ctx.font = "50px 'Gugi', sans-serif";
                ctx.fillText("GO !", canvas.width / 2, canvas.height / 2 - 40);
                setTimeout(() =>
                {
                    countdown = -1;
                }, 1000);
            }
        }
        
        // score
        ctx.font = "20px 'Gugi', sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(`Gaucho : ${leftScore}`, 20, 20);
        ctx.textAlign = "right";
        ctx.fillText(`Facho : ${rightScore}`, canvas.width - 20, 20);
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

        // Ball Color Picker
        const ballColorContainer = document.createElement("div");
        ballColorContainer.style.display = "flex";
        ballColorContainer.style.flexDirection = "column";
        ballColorContainer.style.alignItems = "center";
        ballColorContainer.style.gap = "20px"

        const ballColorLabel = document.createElement("label");
        ballColorLabel.innerText = "ball color";
        ballColorLabel.style.color = "white";
        ballColorLabel.style.font = "30px 'Gugi', sans-serif";
        ballColorLabel.style.cursor = "pointer";
        ballColorLabel.style.transition = "all 0.2s ease";
        
        // Hover effect
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
        ballColorInput.style.borderRadius = "30px"; // Set a good size
        ballColorInput.style.height = "20px";
        ballColorInput.style.width = "20px";
        ballColorInput.style.border = "none";
        ballColorInput.style.cursor = "pointer";
        ballColorInput.style.background = "transparent";
        ballColorInput.style.padding = "0";
        ballColorInput.style.outline = "none";
        
        // Click handler for the label
        ballColorLabel.addEventListener("click", () =>
        {
            ballColorInput.click();
        });
        
        // Color change handler
        ballColorInput.addEventListener("input", (e) =>
        {
            const target = e.target as HTMLInputElement;
            ballColor = target.value;
        });
        
        ballColorContainer.appendChild(ballColorLabel);
        ballColorContainer.appendChild(ballColorInput);
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