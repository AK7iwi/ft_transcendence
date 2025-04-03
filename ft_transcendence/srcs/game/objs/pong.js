/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   pong.ts                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: marvin <marvin@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/03/18 23:38:46 by marvin            #+#    #+#             */
/*   Updated: 2025/04/03 06:14:26 by marvin           ###   ########.fr       */
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
        ctx.beginPath();
        ctx.arc(ballX, ballY, 5, 0, Math.PI * 2);
        ctx.fill();
        // start text
        ctx.fillStyle = "white";
        ctx.font = "30px 'Roboto', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (isStopped) {
            if (leftScore === 5 || rightScore === 5) {
                ctx.fillText("".concat(leftScore === 5 ? "Gaucho" : "Facho", " Wins!"), canvas.width / 2, canvas.height / 2 - 40);
                ctx.font = "15px 'Roboto', sans-serif";
                ctx.fillText("Press Space to Restart", canvas.width / 2, canvas.height / 2 + 40);
            }
            else if (countdown === 4)
                ctx.fillText("Press Space to Start", canvas.width / 2, canvas.height / 2 - 40);
            else if (countdown > 0)
                ctx.fillText(countdown.toString(), canvas.width / 2, canvas.height / 2 - 40);
            else if (countdown === 0) {
                ctx.font = "50px 'Roboto', sans-serif";
                ctx.fillText("GO !", canvas.width / 2, canvas.height / 2 - 40);
                setTimeout(function () {
                    countdown = -1;
                }, 1000);
            }
        }
        // score
        ctx.font = "20px 'Roboto', sans-serif";
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
    document.addEventListener("keydown", function (event) {
        if (event.key === "w")
            leftPaddleUp = true;
        if (event.key === "s")
            leftPaddleDown = true;
        if (event.key === "ArrowUp")
            rightPaddleUp = true;
        if (event.key === "ArrowDown")
            rightPaddleDown = true;
        if (event.key === " " && isStopped && !isSpacePressed) {
            if (leftScore === 5 || rightScore === 5)
                resetGame();
            startGame();
            isSpacePressed = true;
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
