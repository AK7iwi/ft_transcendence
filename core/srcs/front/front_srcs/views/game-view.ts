import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { SettingsService } from '../services/settings-service';
import type { GameSettings } from '../services/settings-service';

@customElement('game-view')
export class GameView extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .game-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 80vh;
      min-width: 80vw;
      box-sizing: border-box;
    }
    .responsive-canvas {
      width: 90vw;
      height: 70vh;
      max-width: 1000px;
      max-height: 700px;
      min-width: 300px;
      min-height: 200px;
      background: white;
      border: 2px solid var(--color-accent);
      display: block;
    }
    .score-display {
      color: var(--color-text);
      font-size: 2rem;
      margin: 1rem 0;
      font-family: var(--font-mono);
    }
    .controls-info {
      color: var(--color-text-secondary);
      margin-top: 1rem;
      text-align: center;
    }
  `;

  @state()
  private score = { player1: 0, player2: 0 };

  @state()
  private isGameStarted = false;

  @state()
  private isGameOver = false;

  @state()
  private winner = '';

  @state()
  private countdown = 0;

  @state()
  private isBallActive = false;

  @state()
  private isInitialCountdown = false;

  @state()
  private isPaused = false;

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationFrameId: number = 0;
  private gameLoop: boolean = false;
  private settingsService: SettingsService;
  private settings: GameSettings;

  // Game objects
  private paddle1 = { x: 0, y: 0, width: 10, height: 100, speed: 5, dy: 0 };
  private paddle2 = { x: 0, y: 0, width: 10, height: 100, speed: 5, dy: 0 };
  private ball = { x: 0, y: 0, size: 10, speed: 5, dx: 5, dy: 5 };

  constructor() {
    super();
    this.settingsService = SettingsService.getInstance();
    this.settings = this.settingsService.getSettings();
    window.addEventListener('settingsChanged', this.handleSettingsChanged);
  }

  private updateGameSettings() {
    this.paddle1.speed = this.settings.paddleSpeed;
    this.paddle2.speed = this.settings.paddleSpeed;
    this.ball.speed = this.settings.ballSpeed;
    this.ball.dx = this.settings.ballSpeed;
    this.ball.dy = this.settings.ballSpeed;
  }

  firstUpdated() {
    this.canvas = this.shadowRoot?.querySelector('canvas') as HTMLCanvasElement;
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.initGame();
      this.setupEventListeners();
    }
  }

  private initGame() {
    if (!this.canvas || !this.ctx) return;

    // Set canvas size
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;

    // Initialize paddle positions
    this.paddle1.x = 20;
    this.paddle1.y = (this.canvas.height - this.paddle1.height) / 2;
    this.paddle2.x = this.canvas.width - 30;
    this.paddle2.y = (this.canvas.height - this.paddle2.height) / 2;

    // Initialize ball position
    this.resetBall();

    // Don't start game loop automatically
    this.gameLoop = false;
    this.isGameStarted = false;
    this.isBallActive = false;
    this.updateGameSettings();
  }

  private resetBall() {
    if (!this.canvas) return;
    this.ball.x = this.canvas.width / 2;
    this.ball.y = this.canvas.height / 2;
    
    // Random angle between -60 and 60 degrees (in radians)
    const angle = (Math.random() * 120 - 60) * (Math.PI / 180);
    
    // Random direction (left or right)
    const direction = Math.random() > 0.5 ? 1 : -1;
    
    // Calculate dx and dy based on angle and constant speed
    this.ball.dx = Math.cos(angle) * this.settings.ballSpeed * direction;
    this.ball.dy = Math.sin(angle) * this.settings.ballSpeed;
    
    this.isBallActive = false;
    this.startBallCountdown();
  }

  private setupEventListeners() {
    // Keyboard controls
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key.toLowerCase() === 'p' && this.isGameStarted && !this.isGameOver) {
      this.togglePause();
      return;
    }
    if (e.key === ' ' && !this.isGameStarted && !this.isGameOver) {
      this.isInitialCountdown = true;
      this.startInitialCountdown();
      return;
    }
    if (e.key === ' ' && this.isGameOver) {
      this.resetGame();
      return;
    }
    if (!this.isGameStarted || this.isGameOver || this.isPaused) return;
    
    if (e.key.toLowerCase() === 'w') this.paddle1.dy = -this.paddle1.speed;
    if (e.key.toLowerCase() === 's') this.paddle1.dy = this.paddle1.speed;
    if (e.key === 'ArrowUp') this.paddle2.dy = -this.paddle2.speed;
    if (e.key === 'ArrowDown') this.paddle2.dy = this.paddle2.speed;
  }

  private handleKeyUp(e: KeyboardEvent) {
    if (e.key.toLowerCase() === 'w' || e.key.toLowerCase() === 's') this.paddle1.dy = 0;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') this.paddle2.dy = 0;
  }

  private startInitialCountdown() {
    this.countdown = 3;
    const countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(countdownInterval);
        this.isGameStarted = true;
        this.gameLoop = true;
        this.isBallActive = true;
        this.isInitialCountdown = false;
        this.startGameLoop();
      }
    }, 1000);
  }

  private startBallCountdown() {
    this.countdown = 3;
    const countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(countdownInterval);
        this.isBallActive = true;
      }
    }, 1000);
  }

  private startGameLoop() {
    if (!this.gameLoop || this.isPaused) return;
    this.updateGame();
    this.draw();
    this.animationFrameId = requestAnimationFrame(() => this.startGameLoop());
  }

  private updateGame() {
    if (!this.canvas) return;

    // Move paddles
    this.paddle1.y += this.paddle1.dy;
    this.paddle2.y += this.paddle2.dy;

    // Keep paddles in bounds
    this.paddle1.y = Math.max(0, Math.min(this.canvas.height - this.paddle1.height, this.paddle1.y));
    this.paddle2.y = Math.max(0, Math.min(this.canvas.height - this.paddle2.height, this.paddle2.y));

    // Move ball only if active and game is not over
    if (this.isBallActive && !this.isGameOver) {
      this.ball.x += this.ball.dx;
      this.ball.y += this.ball.dy;

      // Ball collision with top and bottom
      if (this.ball.y <= 0 || this.ball.y >= this.canvas.height) {
        this.ball.dy *= -1;
      }

      // Ball collision with paddles
      if (
        (this.ball.x <= this.paddle1.x + this.paddle1.width &&
         this.ball.y >= this.paddle1.y &&
         this.ball.y <= this.paddle1.y + this.paddle1.height) ||
        (this.ball.x + this.ball.size >= this.paddle2.x &&
         this.ball.y >= this.paddle2.y &&
         this.ball.y <= this.paddle2.y + this.paddle2.height)
      ) {
        this.ball.dx *= -1;
      }

      // Score points
      if (this.ball.x <= 0) {
        this.score.player2++;
        if (this.score.player2 >= this.settings.endScore) {
          this.endGame('Player 2');
        } else {
          this.resetBall();
        }
      } else if (this.ball.x >= this.canvas.width) {
        this.score.player1++;
        if (this.score.player1 >= this.settings.endScore) {
          this.endGame('Player 1');
        } else {
          this.resetBall();
        }
      }
    }
  }

  private endGame(winner: string) {
    this.isGameOver = true;
    this.winner = winner;
    this.gameLoop = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private resetGame() {
    this.score = { player1: 0, player2: 0 };
    this.isGameOver = false;
    this.winner = '';
    this.isGameStarted = false;
    this.isBallActive = false;
    this.initGame();
  }

  private togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
    } else {
      this.startGameLoop();
    }
  }

  private draw() {
    if (!this.ctx || !this.canvas) return;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw paddles
    this.ctx.fillStyle = this.settings.paddleColor;
    this.ctx.fillRect(this.paddle1.x, this.paddle1.y, this.paddle1.width, this.paddle1.height);
    this.ctx.fillRect(this.paddle2.x, this.paddle2.y, this.paddle2.width, this.paddle2.height);
    

    // Draw ball only if game is started and ball is active
    if (this.isGameStarted && this.isBallActive && !this.isGameOver) {
      this.ctx.beginPath();
      this.ctx.arc(this.ball.x, this.ball.y, this.ball.size / 2, 0, Math.PI * 2);
      this.ctx.fillStyle = this.settings.ballColor;
      this.ctx.fill();
      this.ctx.closePath();
    }
    

    // Draw center line
    this.ctx.beginPath();
    this.ctx.setLineDash([5, 15]);
    this.ctx.moveTo(this.canvas.width / 2, 0);
    this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
    this.ctx.strokeStyle = '#000';
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // Draw messages
    this.ctx.font = '24px Arial';
    this.ctx.fillStyle = '#000';
    this.ctx.textAlign = 'center';

    if (this.isGameOver) {
      this.ctx.font = '48px Arial';
      this.ctx.fillText(`${this.winner} Wins!`, this.canvas.width / 2, this.canvas.height / 2 - 30);
      this.ctx.font = '24px Arial';
      this.ctx.fillText('Press SPACE to Play Again', this.canvas.width / 2, this.canvas.height / 2 + 30);
    } else if (this.isPaused) {
      this.ctx.font = '48px Arial';
      this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2 - 30);
      this.ctx.font = '24px Arial';
      this.ctx.fillText('Press P to Resume', this.canvas.width / 2, this.canvas.height / 2 + 30);
    } else if (!this.isGameStarted) {
      if (this.isInitialCountdown) {
        this.ctx.font = '48px Arial';
        this.ctx.fillText(this.countdown.toString(), this.canvas.width / 2, this.canvas.height / 2);
      } else {
        this.ctx.fillText('Press SPACE to Start', this.canvas.width / 2, this.canvas.height / 2);
      }
    } else if (!this.isBallActive && this.countdown > 0) {
      this.ctx.font = '48px Arial';
      this.ctx.fillText(this.countdown.toString(), this.canvas.width / 2, this.canvas.height / 2);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.gameLoop = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('settingsChanged', this.handleSettingsChanged);
  }

  private handleSettingsChanged = (e: Event) => {
    const customEvent = e as CustomEvent<GameSettings>;
    this.settings = customEvent.detail;
    this.updateGameSettings();
  };

  render() {
    return html`
      <div class="game-container">
        <div class="score-display">
          ${this.score.player1} - ${this.score.player2}
        </div>
        <canvas class="responsive-canvas"></canvas>
        <div class="controls-info">
          ${this.isGameOver
            ? 'Press SPACE to Play Again'
            : this.isPaused
              ? 'Press P to Resume'
              : !this.isGameStarted 
                ? (this.isInitialCountdown
                    ? `Game starting in ${this.countdown}...`
                    : 'Press SPACE to Start')
                : (!this.isBallActive && this.countdown > 0
                    ? `New ball in ${this.countdown}...`
                    : 'Player 1: W/S keys | Player 2: ↑/↓ arrows | P to Pause')}
        </div>
      </div>
    `;
  }
} 