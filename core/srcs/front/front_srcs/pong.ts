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
let waitingForSpace = false;
let isMenuOpen = true;
let isSettingsOpen = false;

// Settings state
let gameSettings = {
    ballColor: "white",
    paddleColor: "white",
    endScore: 3,
    ballSpeed: BALL_SPEED,
    paddleSpeed: PADDLE_SPEED
};

// Color options
const colorOptions = ["white", "red", "blue", "green", "yellow", "purple"];

// Menu button dimensions
const BUTTON_WIDTH = 200;
const BUTTON_HEIGHT = 50;
const BUTTON_MARGIN = 20;
const SETTINGS_BUTTON_WIDTH = 150;

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

    // Menu buttons
    const menuButtons = [
        { text: "Quick Play", y: GAME_HEIGHT / 2 - BUTTON_HEIGHT - BUTTON_MARGIN },
        { text: "Tournament", y: GAME_HEIGHT / 2 },
        { text: "Settings", y: GAME_HEIGHT / 2 + BUTTON_HEIGHT + BUTTON_MARGIN }
    ];

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

    function drawMenu() {
        if (!ctx) return;

        // Semi-transparent background
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Draw buttons
        menuButtons.forEach(button => {
            // Button background
            ctx.fillStyle = "white";
            ctx.fillRect(
                GAME_WIDTH / 2 - BUTTON_WIDTH / 2,
                button.y,
                BUTTON_WIDTH,
                BUTTON_HEIGHT
            );

            // Button text
            ctx.fillStyle = "black";
            ctx.font = "24px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(
                button.text,
                GAME_WIDTH / 2,
                button.y + BUTTON_HEIGHT / 2
            );
        });
    }

    function isMouseOverButton(mouseY: number, buttonY: number): boolean {
        return mouseY >= buttonY && mouseY <= buttonY + BUTTON_HEIGHT;
    }

    function startGame() {
        isMenuOpen = false;
        resetGame();
        startCountdown();
    }

    // Add mouse event listeners for menu
    canvas.addEventListener("click", (e) => {
        if (!isMenuOpen) return;

        const rect = canvas.getBoundingClientRect();
        const mouseY = e.clientY - rect.top;

        menuButtons.forEach(button => {
            if (isMouseOverButton(mouseY, button.y)) {
                if (button.text === "Quick Play") {
                    startGame();
                } else if (button.text === "Tournament") {
                    console.log("Tournament mode selected"); // To be implemented
                } else if (button.text === "Settings") {
                    console.log("Settings selected"); // To be implemented
                }
            }
        });
    });

    function drawSettings() {
        if (!ctx) return;

        // Semi-transparent background
        ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Draw title
        ctx.fillStyle = "white";
        ctx.font = "32px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Settings", GAME_WIDTH / 2, 50);

        // Draw color options for ball
        ctx.font = "20px Arial";
        ctx.fillText("Ball Color:", GAME_WIDTH / 2 - 100, 100);
        colorOptions.forEach((color, index) => {
            const x = GAME_WIDTH / 2 - 150 + (index * 50);
            const y = 130;
            
            // Draw color button
            ctx.fillStyle = color;
            ctx.fillRect(x, y, 35, 35);
            
            // Draw border if selected
            if (color === gameSettings.ballColor) {
                ctx.strokeStyle = "white";
                ctx.lineWidth = 2;
                ctx.strokeRect(x - 2, y - 2, 39, 39);
            }
        });

        // Draw color options for paddles
        ctx.fillStyle = "white";
        ctx.fillText("Paddle Color:", GAME_WIDTH / 2 - 100, 180);
        colorOptions.forEach((color, index) => {
            const x = GAME_WIDTH / 2 - 150 + (index * 50);
            const y = 210;
            
            // Draw color button
            ctx.fillStyle = color;
            ctx.fillRect(x, y, 35, 35);
            
            // Draw border if selected
            if (color === gameSettings.paddleColor) {
                ctx.strokeStyle = "white";
                ctx.lineWidth = 2;
                ctx.strokeRect(x - 2, y - 2, 39, 39);
            }
        });

        // Draw end score options
        ctx.fillStyle = "white";
        ctx.fillText("End Score:", GAME_WIDTH / 2 - 100, 260);
        [3, 5, 7, 10].forEach((score, index) => {
            const x = GAME_WIDTH / 2 - 100 + (index * 70);
            const y = 290;
            
            // Draw score button
            ctx.fillStyle = "white";
            ctx.fillRect(x, y, 50, 35);
            
            // Draw score text
            ctx.fillStyle = "black";
            ctx.font = "18px Arial";
            ctx.fillText(score.toString(), x + 25, y + 22);
            
            // Draw border if selected
            if (score === gameSettings.endScore) {
                ctx.strokeStyle = "white";
                ctx.lineWidth = 2;
                ctx.strokeRect(x - 2, y - 2, 54, 39);
            }
        });

        // Draw ball speed options
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.fillText("Ball Speed:", GAME_WIDTH / 2 - 100, 340);
        [3, 5, 7, 9].forEach((speed, index) => {
            const x = GAME_WIDTH / 2 - 100 + (index * 70);
            const y = 370;
            
            // Draw speed button
            ctx.fillStyle = "white";
            ctx.fillRect(x, y, 50, 35);
            
            // Draw speed text
            ctx.fillStyle = "black";
            ctx.font = "18px Arial";
            ctx.fillText(speed.toString(), x + 25, y + 22);
            
            // Draw border if selected
            if (speed === gameSettings.ballSpeed) {
                ctx.strokeStyle = "white";
                ctx.lineWidth = 2;
                ctx.strokeRect(x - 2, y - 2, 54, 39);
            }
        });

        // Draw paddle speed options
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.fillText("Paddle Speed:", GAME_WIDTH / 2 - 100, 420);
        [3, 5, 7, 9].forEach((speed, index) => {
            const x = GAME_WIDTH / 2 - 100 + (index * 70);
            const y = 450;
            
            // Draw speed button
            ctx.fillStyle = "white";
            ctx.fillRect(x, y, 50, 35);
            
            // Draw speed text
            ctx.fillStyle = "black";
            ctx.font = "18px Arial";
            ctx.fillText(speed.toString(), x + 25, y + 22);
            
            // Draw border if selected
            if (speed === gameSettings.paddleSpeed) {
                ctx.strokeStyle = "white";
                ctx.lineWidth = 2;
                ctx.strokeRect(x - 2, y - 2, 54, 39);
            }
        });

        // Draw back button
        ctx.fillStyle = "white";
        ctx.fillRect(GAME_WIDTH / 2 - 60, 520, 120, 35);
        ctx.fillStyle = "black";
        ctx.font = "20px Arial";
        ctx.fillText("Back", GAME_WIDTH / 2, 542);
    }

    function isMouseOverSettingsButton(mouseX: number, mouseY: number, x: number, y: number, width: number, height: number): boolean {
        return mouseX >= x && mouseX <= x + width && mouseY >= y && mouseY <= y + height;
    }

    // Update click handler for settings
    canvas.addEventListener("click", (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (isSettingsOpen) {
            // Handle color selection for ball
            colorOptions.forEach((color, index) => {
                const x = GAME_WIDTH / 2 - 150 + (index * 50);
                const y = 130;
                if (isMouseOverSettingsButton(mouseX, mouseY, x, y, 35, 35)) {
                    gameSettings.ballColor = color;
                }
            });

            // Handle color selection for paddles
            colorOptions.forEach((color, index) => {
                const x = GAME_WIDTH / 2 - 150 + (index * 50);
                const y = 210;
                if (isMouseOverSettingsButton(mouseX, mouseY, x, y, 35, 35)) {
                    gameSettings.paddleColor = color;
                }
            });

            // Handle end score selection
            [3, 5, 7, 10].forEach((score, index) => {
                const x = GAME_WIDTH / 2 - 100 + (index * 70);
                const y = 290;
                if (isMouseOverSettingsButton(mouseX, mouseY, x, y, 50, 35)) {
                    gameSettings.endScore = score;
                }
            });

            // Handle ball speed selection
            [3, 5, 7, 9].forEach((speed, index) => {
                const x = GAME_WIDTH / 2 - 100 + (index * 70);
                const y = 370;
                if (isMouseOverSettingsButton(mouseX, mouseY, x, y, 50, 35)) {
                    gameSettings.ballSpeed = speed;
                }
            });

            // Handle paddle speed selection
            [3, 5, 7, 9].forEach((speed, index) => {
                const x = GAME_WIDTH / 2 - 100 + (index * 70);
                const y = 450;
                if (isMouseOverSettingsButton(mouseX, mouseY, x, y, 50, 35)) {
                    gameSettings.paddleSpeed = speed;
                }
            });

            // Handle back button
            if (isMouseOverSettingsButton(mouseX, mouseY, GAME_WIDTH / 2 - 60, 520, 120, 35)) {
                isSettingsOpen = false;
                isMenuOpen = true;
            }
        } else if (isMenuOpen) {
            menuButtons.forEach(button => {
                if (isMouseOverButton(mouseY, button.y)) {
                    if (button.text === "Quick Play") {
                        startGame();
                    } else if (button.text === "Tournament") {
                        console.log("Tournament mode selected");
                    } else if (button.text === "Settings") {
                        isMenuOpen = false;
                        isSettingsOpen = true;
                    }
                }
            });
        }
    });

    function draw() {
        if (!ctx) return;

        // Clear canvas
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        if (isSettingsOpen) {
            drawSettings();
        } else if (isMenuOpen) {
            drawMenu();
        } else {
            // Draw game elements
            // Draw paddles with custom color
            ctx.fillStyle = gameSettings.paddleColor;
            ctx.fillRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height);
            ctx.fillRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height);

            // Draw ball with custom color
            if (isGameActive) {
                ctx.beginPath();
                ctx.fillStyle = gameSettings.ballColor;
                ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
                ctx.fill();
            }

            // Draw scores with custom color
            ctx.font = "32px Arial";
            ctx.textAlign = "left";
            ctx.fillStyle = gameSettings.paddleColor;
            ctx.fillText(leftScore.toString(), GAME_WIDTH / 4, 50);
            ctx.fillText(rightScore.toString(), (GAME_WIDTH / 4) * 3, 50);

            // Draw countdown or press space message
            if (countdown > 0) {
                ctx.font = "64px Arial";
                ctx.textAlign = "center";
                ctx.fillStyle = "white";
                if (waitingForSpace) {
                    ctx.fillText("Press SPACE to Start", GAME_WIDTH / 2, GAME_HEIGHT / 2);
                } else {
                    ctx.fillText(countdown.toString(), GAME_WIDTH / 2, GAME_HEIGHT / 2);
                }
                ctx.textAlign = "left";
            }
        }
    }

    function startCountdownInterval() {
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

    function startCountdown() {
        isGameActive = false;
        countdown = 3;
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }

        if (leftScore === 0 && rightScore === 0) {
            waitingForSpace = true;
        } 
        else {
            startCountdownInterval();
        }
    }

    function update() {
        // Toggle menu with M key
        if (keys["m"] || keys["M"]) {
            isMenuOpen = !isMenuOpen;
            keys["m"] = false;  // Reset the key state
            keys["M"] = false;
        }

        if (isMenuOpen) return;  // Don't update game if menu is open

        if (waitingForSpace && keys[" "]) {
            waitingForSpace = false;
            startCountdownInterval();
        }

        if (!isGameActive) return;

        // Move paddles with custom speed
        if ((keys["w"] || keys["W"]) && leftPaddle.y > 0) leftPaddle.y -= gameSettings.paddleSpeed;
        if ((keys["s"] || keys["S"]) && leftPaddle.y < GAME_HEIGHT - leftPaddle.height) leftPaddle.y += gameSettings.paddleSpeed;
        if (keys["ArrowUp"] && rightPaddle.y > 0) rightPaddle.y -= gameSettings.paddleSpeed;
        if (keys["ArrowDown"] && rightPaddle.y < GAME_HEIGHT - rightPaddle.height) rightPaddle.y += gameSettings.paddleSpeed;

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

        // Check for game end with custom end score
        if (leftScore >= gameSettings.endScore || rightScore >= gameSettings.endScore) {
            handleGameEnd();
        }
    }

    function setBallTrajectory() {
        const angle = (Math.random() * 55 + 15) * Math.PI / 180;
        const directionX = Math.random() > 0.5 ? 1 : -1;
        const directionY = Math.random() > 0.5 ? 1 : -1;
        
        ball.dx = gameSettings.ballSpeed * Math.cos(angle) * directionX;
        ball.dy = gameSettings.ballSpeed * Math.sin(angle) * directionY;
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
