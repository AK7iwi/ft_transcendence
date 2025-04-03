/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   pong.ts                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: marvin <marvin@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/03/18 23:38:46 by marvin            #+#    #+#             */
/*   Updated: 2025/04/03 15:20:18 by marvin           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
window.onload = function () {
    var canvas = document.getElementById("gameCanvas");
    var ctx = canvas.getContext("2d");
    if (!ctx) {
        console.error("Canvas not supported.");
        return;
    }
    /*   -~-~-~-   CANVAS DRAWING    -~-~-~-   */
    function draw() {
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
        ctx.font = "30px 'Gugi', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (isStopped) {
            if (leftScore === 5 || rightScore === 5) {
                ctx.fillText("".concat(leftScore === 5 ? "Gaucho" : "Facho", " Wins!"), canvas.width / 2, canvas.height / 2 - 40);
                ctx.font = "15px 'Gugi', sans-serif";
                ctx.fillText("Press Space to Restart", canvas.width / 2, canvas.height / 2 + 40);
            }
            else if (countdown === 4)
                ctx.fillText("Press Space to Start", canvas.width / 2, canvas.height / 2 - 40);
            else if (countdown > 0)
                ctx.fillText(countdown.toString(), canvas.width / 2, canvas.height / 2 - 40);
            else if (countdown === 0) {
                ctx.font = "50px 'Gugi', sans-serif";
                ctx.fillText("GO !", canvas.width / 2, canvas.height / 2 - 40);
                setTimeout(function () {
                    countdown = -1;
                }, 1000);
            }
        }
        // score
        ctx.font = "20px 'Gugi', sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("Gaucho : ".concat(leftScore), 20, 20);
        ctx.textAlign = "right";
        ctx.fillText("Facho : ".concat(rightScore), canvas.width - 20, 20);
    }
    /*  -~-~-~-   PADDLE PROPERTIES   -~-~-~-   */
    // paddle properties
    var paddleWidth = 5;
    var paddleHeight = 50;
    var leftPaddleY = (canvas.height - paddleHeight) / 2;
    var rightPaddleY = (canvas.height - paddleHeight) / 2;
    var paddleSpeed = 5;
    // paddle movement
    var leftPaddleUp = false, leftPaddleDown = false;
    var rightPaddleUp = false, rightPaddleDown = false;
    // keybinds
    document.addEventListener("keydown", function (event) {
        if (event.key === "w")
            leftPaddleUp = true;
        if (event.key === "s")
            leftPaddleDown = true;
        if (event.key === "ArrowUp")
            rightPaddleUp = true;
        if (event.key === "ArrowDown")
            rightPaddleDown = true;
        if (event.key === " " && isStopped && !isSpacePressed && !isMenuOpen) {
            if (leftScore === 5 || rightScore === 5)
                resetGame();
            startGame();
            isSpacePressed = true;
        }
        if (event.key === "Escape") {
            if (isMenuOpen)
                closeMenu();
            else
                openMenu();
        }
    });
    document.addEventListener("keyup", function (event) {
        if (event.key === "w")
            leftPaddleUp = false;
        if (event.key === "s")
            leftPaddleDown = false;
        if (event.key === "ArrowUp")
            rightPaddleUp = false;
        if (event.key === "ArrowDown")
            rightPaddleDown = false;
    });
    /*   -~-~-~- BALL PROPERTIES -~-~-~-   */
    // ball properties
    var ballColor = "#ffffff";
    var ballX = canvas.width / 2;
    var ballY = canvas.height / 2;
    var ballSpeedX = 0;
    var ballSpeedY = 0;
    /*   -~-~-~-   SCORE & STATE   -~-~-~-   */
    var leftScore = 0;
    var rightScore = 0;
    var countdown = 4;
    var isStopped = true;
    var isSpacePressed = false;
    /*   -~-~-~-   MENU   -~-~-~-   */
    var isMenuOpen = false;
    function openMenu() {
        isMenuOpen = true;
        isStopped = true;
        var canvasContainer = document.getElementById("gameContainer");
        if (!canvasContainer)
            return;
        var rect = canvasContainer.getBoundingClientRect();
        // menu overlay
        var menu = document.createElement("div");
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
        var title = document.createElement("h1");
        title.innerText = "GAME MENU";
        title.style.color = "white";
        title.style.font = "42px 'Gugi', sans-serif";
        title.style.margin = "0";
        title.style.textShadow = "2px 2px 4px #00ffff";
        title.style.opacity = "1";
        menu.appendChild(title);
        // ball color container
        var ballColorContainer = document.createElement("div");
        ballColorContainer.style.display = "flex";
        ballColorContainer.style.flexDirection = "row";
        ballColorContainer.style.alignItems = "center";
        ballColorContainer.style.gap = "15px";
        // ball color label (the text)
        var ballColorLabel = document.createElement("label");
        ballColorLabel.innerText = "ball color";
        ballColorLabel.style.color = "white";
        ballColorLabel.style.font = "30px 'Gugi', sans-serif";
        ballColorLabel.style.cursor = "pointer";
        ballColorLabel.style.transition = "all 0.2s ease";
        // hover effect
        ballColorLabel.addEventListener("mouseenter", function () {
            ballColorLabel.style.transform = "scale(1.1)";
            ballColorLabel.style.textShadow = "0 0 8px #00ffff";
        });
        ballColorLabel.addEventListener("mouseleave", function () {
            ballColorLabel.style.transform = "scale(1)";
            ballColorLabel.style.textShadow = "none";
        });
        var ballColorInput = document.createElement("input");
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
        ballColorInput.addEventListener("mouseenter", function () {
            ballColorInput.style.transform = "scale(1.1)";
            ballColorInput.style.textShadow = "0 0 8px #00ffff";
        });
        ballColorInput.addEventListener("mouseleave", function () {
            ballColorInput.style.transform = "scale(1)";
            ballColorInput.style.textShadow = "none";
        });
        // open color picker
        var openColorPicker = function () { return ballColorInput.click(); };
        ballColorLabel.addEventListener("click", openColorPicker);
        // update ball color
        ballColorInput.addEventListener("input", function (e) {
            ballColor = e.target.value;
        });
        ballColorContainer.appendChild(ballColorLabel);
        ballColorContainer.appendChild(ballColorInput); // Hidden input
        menu.appendChild(ballColorContainer);
    }
    function closeMenu() {
        isMenuOpen = false;
        isStopped = false;
        var menu = document.getElementById("menu");
        if (menu)
            document.body.removeChild(menu);
    }
    /*   -~-~-~-   ACTUALLY THE GAME   -~-~-~-   */
    function update() {
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
        if (ballX - 5 <= 15 && ballX - 5 >= 5 && ballY > leftPaddleY && ballY < leftPaddleY + paddleHeight) {
            ballSpeedX = -ballSpeedX;
            var deltaY = ballY - (leftPaddleY + paddleHeight / 2);
            ballSpeedY = deltaY * 0.2;
        }
        if (ballX + 5 >= canvas.width - 15 && ballX + 5 <= canvas.width - 5 && ballY > rightPaddleY && ballY < rightPaddleY + paddleHeight) {
            ballSpeedX = -ballSpeedX;
            var deltaY = ballY - (rightPaddleY + paddleHeight / 2);
            ballSpeedY = deltaY * 0.2;
        }
        // ball collision with bot and top walls
        if (ballY <= 0 || ballY >= canvas.height)
            ballSpeedY = -ballSpeedY;
        // scoring
        if (ballX <= 5) {
            rightScore += 1;
            resetBall();
        }
        if (ballX >= canvas.width - 5) {
            leftScore += 1;
            resetBall();
        }
        if (leftScore === 5 || rightScore === 5)
            isStopped = true;
    }
    function resetGame() {
        leftScore = 0;
        rightScore = 0;
        resetBall();
        isStopped = true;
        countdown = 4;
        draw();
    }
    function startGame() {
        countdown = 3;
        draw();
        var countdownInterval = setInterval(function () {
            if (countdown > 1)
                countdown--;
            else {
                clearInterval(countdownInterval);
                countdown = 0;
                draw();
                setTimeout(function () {
                    countdown = -1;
                    ballSpeedX = Math.random() > 0.5 ? 3 : -3;
                    ballSpeedY = Math.random() * 2 + 2;
                    isStopped = false;
                    isSpacePressed = false;
                }, 1000);
            }
        }, 1000);
    }
    function resetBall() {
        ballX = canvas.width / 2;
        ballY = canvas.height / 2;
        ballSpeedX = 0;
        ballSpeedY = 0;
        isStopped = true;
        countdown = 4;
    }
    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
    gameLoop();
};
