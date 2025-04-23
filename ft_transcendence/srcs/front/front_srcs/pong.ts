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
        ctx.beginPath();
        ctx.arc(ballX, ballY, 5, 0, Math.PI * 2);
        ctx.fill();

        // start text
        ctx.fillStyle = "white";
        ctx.font = "30px 'Roboto', sans-serif"
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        if (isStopped)
        {
            if (countdown === 4)
                ctx.fillText("Press Space to Start", canvas.width / 2, canvas.height / 2 - 40);
            else if (countdown > 0)
                ctx.fillText(countdown.toString(), canvas.width / 2, canvas.height / 2 - 40);
            else if (countdown === 0)
            {
                ctx.font = "50px 'Roboto', sans-serif";
                ctx.fillText("GO !", canvas.width / 2, canvas.height / 2 - 40);
                setTimeout(() =>
                {
                    countdown = -1;
                }, 1000);
            }
        }
        
        // score
        ctx.font = "20px 'Roboto', sans-serif";
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

    document.addEventListener("keydown", (event) =>
    {
        if (event.key === "w") leftPaddleUp = true;
        if (event.key === "s") leftPaddleDown = true;
        if (event.key === "ArrowUp") rightPaddleUp = true;
        if (event.key === "ArrowDown") rightPaddleDown = true;

        if (event.key === " " && isStopped && !isSpacePressed)
        {
            startGame();
            isSpacePressed = true;
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