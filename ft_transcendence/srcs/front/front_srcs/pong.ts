// Game constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const BALL_SIZE = 10;
const PADDLE_SPEED = 5;
const BALL_SPEED = 5;

// Game state
let leftScore = 0;
let rightScore = 0;
let isGameActive = false;
let countdown = 0;
let countdownInterval: number | null = null;

// Initialize game
window.onload = () => {
    const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
        console.error("Canvas not supported.");
        throw new Error("Canvas not supported");
    }

    // Set canvas dimensions
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;

    // Game objects
    const leftPaddle = {
        x: 0,
        y: GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
        dy: 0
    };

    const rightPaddle = {
        x: GAME_WIDTH - PADDLE_WIDTH,
        y: GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
        dy: 0
    };

    const ball = {
        x: GAME_WIDTH / 2,
        y: GAME_HEIGHT / 2,
        size: BALL_SIZE,
        dx: 0,
        dy: 0   
    };

    // Keyboard controls
    const keys: { [key: string]: boolean } = {};
    document.addEventListener("keydown", (e) => keys[e.key] = true);
    document.addEventListener("keyup", (e) => keys[e.key] = false);


    // Game functions
    function draw() {
        if (!ctx) return;

        // Clear canvas
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Draw paddles
        ctx.fillStyle = "white";
        ctx.fillRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height);
        ctx.fillRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height);

        // Draw ball only when game is active
        if (isGameActive) {
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw scores
        ctx.font = "32px Arial";
        ctx.fillText(leftScore.toString(), GAME_WIDTH / 4, 50);
        ctx.fillText(rightScore.toString(), (GAME_WIDTH / 4) * 3, 50);

        // Draw countdown
        if (countdown > 0) {
            ctx.font = "64px Arial";
            ctx.textAlign = "center";
            ctx.fillText(countdown.toString(), GAME_WIDTH / 2, GAME_HEIGHT / 2);
            ctx.textAlign = "left";
        }
    }

    function update() {
        if (!isGameActive) return;

        // Move paddles
        if ((keys["w"] || keys["W"]) && leftPaddle.y > 0) leftPaddle.y -= PADDLE_SPEED;
        if ((keys["s"] || keys["S"]) && leftPaddle.y < GAME_HEIGHT - leftPaddle.height) leftPaddle.y += PADDLE_SPEED;
        if (keys["ArrowUp"] && rightPaddle.y > 0) rightPaddle.y -= PADDLE_SPEED;
        if (keys["ArrowDown"] && rightPaddle.y < GAME_HEIGHT - rightPaddle.height) rightPaddle.y += PADDLE_SPEED;

        // Move ball
        ball.x += ball.dx;
        ball.y += ball.dy;

        // Ball collision with top and bottom
        if (ball.y <= 0 || ball.y >= GAME_HEIGHT) {
            ball.dy = -ball.dy;
        }

        // Ball collision with paddles
        if (ball.x <= leftPaddle.x + leftPaddle.width &&
            ball.y >= leftPaddle.y &&
            ball.y <= leftPaddle.y + leftPaddle.height) {
            ball.dx = -ball.dx;
        }

        if (ball.x >= rightPaddle.x &&
            ball.y >= rightPaddle.y &&
            ball.y <= rightPaddle.y + rightPaddle.height) {
            ball.dx = -ball.dx;
        }

        // Score points
        if (ball.x <= 0) {
            rightScore++;
            resetObjects();
            startCountdown();
        }
        
        if (ball.x >= GAME_WIDTH) {
            leftScore++;
            resetObjects();
            startCountdown();
        }

        // Check for game end
        if (leftScore >= 3 || rightScore >= 3) {
            handleGameEnd();
        }
    }

    function startCountdown() {
        isGameActive = false;
        countdown = 3;
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }

        countdownInterval = window.setInterval(() => {
            countdown--;
            if (countdown <= 0) {
                if (countdownInterval) {
                    clearInterval(countdownInterval);
                    countdownInterval = null;
                }
                isGameActive = true;
            }
        }, 1000);
    }

    function setBallTrajectory() {
        const angle = (Math.random() * 55 + 15) * Math.PI / 180;
        const directionX = Math.random() > 0.5 ? 1 : -1;
        const directionY = Math.random() > 0.5 ? 1 : -1;
        
        ball.dx = BALL_SPEED * Math.cos(angle) * directionX;
        ball.dy = BALL_SPEED * Math.sin(angle) * directionY;
    }

    function resetBall() {
        ball.x = GAME_WIDTH / 2;
        ball.y = GAME_HEIGHT / 2;
        setBallTrajectory();
    }

    function resetPaddles() {
        leftPaddle.y = GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2;
        rightPaddle.y = GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    }

    function resetScores() {
        leftScore = 0;
        rightScore = 0;
    }

    function resetObjects() {
        resetBall();
        resetPaddles();
    }

    function resetGame() {
        resetObjects();
        resetScores();
    }

    function handleGameEnd() {
        isGameActive = false;
        const winner = leftScore > rightScore ? 1 : 2;
        alert(`Player ${winner} wins!`);
        
        resetGame();
        startCountdown();
    }

    // Game loop
    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    setBallTrajectory();
    startCountdown();
    gameLoop();
};
