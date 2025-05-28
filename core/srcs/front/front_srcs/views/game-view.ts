import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { SettingsService } from '../services/settings-service';
import type { GameSettings } from '../services/settings-service';

const COUNTDOWN_START = 3;
const CANVAS_ASPECT_RATIO = 16 / 9;
const PADDLE_MARGIN = 0.02;

@customElement('game-view')
export class GameView extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      min-height: calc(100vh - 80px);
      position: relative;
      overflow: hidden;
    }
    .game-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: calc(100vh - 80px);
      box-sizing: border-box;
      padding: 0.5rem;
      overflow: hidden;
      position: relative;
    }
    .responsive-canvas {
      width: 80%;
      height: 60vh;
      max-width: 1000px;
      max-height: 60vh;
      min-width: 300px;
      min-height: 200px;
      background: white;
      border: 2px solid var(--color-accent);
      display: block;
      margin: 0.25rem auto;
    }
    .score-display {
      color: var(--color-text);
      font-size: clamp(1.5rem, 3vw, 2rem);
      margin: 0.25rem 0;
      font-family: var(--font-mono);
    }
    .controls-info {
      color: var(--color-text-secondary);
      margin-top: 0.25rem;
      text-align: center;
      font-size: clamp(0.8rem, 1.5vw, 1rem);
    }
  `;

  @state() private score = { player1: 0, player2: 0 };
  @state() private isGameStarted = false;
  @state() private isGameOver = false;
  @state() private winner = '';
  @state() private countdown = 0;
  @state() private isBallActive = false;
  @state() private isInitialCountdown = false;
  @state() private isPaused = false;

  private keysPressed: Record<string, boolean> = {};
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationFrameId = 0;
  private gameLoop = false;
  private settingsService = SettingsService.getInstance();
  private settings: GameSettings = this.settingsService.getSettings();

  private paddle1 = { x: 0, y: 0, width: 10, height: 100, speed: 5 };
  private paddle2 = { x: 0, y: 0, width: 10, height: 100, speed: 5 };
  private ball = { x: 0, y: 0, size: 10, speed: 5, dx: 5, dy: 5 };

  constructor() {
    super();
    window.addEventListener('settingsChanged', this.handleSettingsChanged);
  }

  private clampPaddlePosition(paddle: { y: number; height: number }) {
    paddle.y = Math.max(0, Math.min(this.canvas!.height - paddle.height, paddle.y));
  }

  private drawCenteredText(text: string, size: number, y: number) {
    this.ctx!.font = `bold ${size}px Arial`;
    this.ctx!.fillText(text, this.canvas!.width / 2, y);
  }

  private updateGameSettings() {
    this.paddle1.speed = this.settings.paddleSpeed;
    this.paddle2.speed = this.settings.paddleSpeed;
    this.ball.speed = this.settings.ballSpeed;
    this.ball.dx = this.settings.ballSpeed;
    this.ball.dy = this.settings.ballSpeed;
  }

  private initGame() {
    if (!this.canvas || !this.ctx) return;
    const container = this.canvas.parentElement!;
    let width = container.clientWidth;
    let height = width / CANVAS_ASPECT_RATIO;
    if (height > container.clientHeight) {
      height = container.clientHeight;
      width = height * CANVAS_ASPECT_RATIO;
    }
    this.canvas.width = width;
    this.canvas.height = height;

    this.paddle1.x = this.canvas.width * PADDLE_MARGIN;
    this.paddle1.y = (this.canvas.height - this.paddle1.height) / 2;
    this.paddle2.x = this.canvas.width * (1 - PADDLE_MARGIN) - this.paddle2.width;
    this.paddle2.y = (this.canvas.height - this.paddle2.height) / 2;

    this.resetBall();
    this.gameLoop = false;
    this.isGameStarted = false;
    this.isBallActive = false;
    this.updateGameSettings();
  }

  private resetBall() {
    if (!this.canvas) return;
    this.ball.x = this.canvas.width / 2;
    this.ball.y = this.canvas.height / 2;
    const angle = (Math.random() * 120 - 60) * (Math.PI / 180);
    const direction = Math.random() > 0.5 ? 1 : -1;
    this.ball.dx = Math.cos(angle) * this.settings.ballSpeed * direction;
    this.ball.dy = Math.sin(angle) * this.settings.ballSpeed;
    this.isBallActive = false;
    this.startBallCountdown();
  }

  private setupEventListeners() {
    ['keydown', 'keyup'].forEach((event) =>
      window.addEventListener(event, (e) => {
        if (['w', 's', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault();
        this.keysPressed[e.key] = event === 'keydown';
        if (event === 'keydown') this.handleKeyDown(e as KeyboardEvent);
      })
    );
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key.toLowerCase() === 'p' && this.isGameStarted && !this.isGameOver) {
      this.togglePause();
    } else if (e.key === ' ' && !this.isGameStarted && !this.isGameOver) {
      this.isInitialCountdown = true;
      this.countdown = COUNTDOWN_START;
      this.startInitialCountdown();
    } else if (e.key === ' ' && this.isGameOver) {
      this.resetGame();
    }
  }

  private startInitialCountdown() {
    const interval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(interval);
        this.isGameStarted = true;
        this.gameLoop = true;
        this.isBallActive = true;
        this.isInitialCountdown = false;
        this.startGameLoop();
      }
    }, 1000);
  }

  private startBallCountdown() {
    this.countdown = COUNTDOWN_START;
    const interval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(interval);
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
    if (this.keysPressed['w']) this.paddle1.y -= this.paddle1.speed;
    if (this.keysPressed['s']) this.paddle1.y += this.paddle1.speed;
    if (this.keysPressed['ArrowUp']) this.paddle2.y -= this.paddle2.speed;
    if (this.keysPressed['ArrowDown']) this.paddle2.y += this.paddle2.speed;
    this.clampPaddlePosition(this.paddle1);
    this.clampPaddlePosition(this.paddle2);

    if (this.isBallActive && !this.isGameOver) {
      this.ball.x += this.ball.dx;
      this.ball.y += this.ball.dy;

      if (this.ball.y <= 0 || this.ball.y >= this.canvas.height) this.ball.dy *= -1;

      const ballHitsPaddle = (p: any) =>
        this.ball.y + this.ball.size / 2 >= p.y &&
        this.ball.y - this.ball.size / 2 <= p.y + p.height;

      if (
        this.ball.dx < 0 &&
        this.ball.x <= this.paddle1.x + this.paddle1.width &&
        this.ball.x >= this.paddle1.x &&
        ballHitsPaddle(this.paddle1)
      ) {
        this.ball.dx *= -1;
      } else if (
        this.ball.dx > 0 &&
        this.ball.x + this.ball.size >= this.paddle2.x &&
        this.ball.x + this.ball.size <= this.paddle2.x + this.paddle2.width &&
        ballHitsPaddle(this.paddle2)
      ) {
        this.ball.dx *= -1;
      }

      if (this.ball.x <= 0) {
        this.score.player2++;
        this.score.player2 >= this.settings.endScore ? this.endGame('Player 2') : this.resetBall();
      } else if (this.ball.x >= this.canvas.width) {
        this.score.player1++;
        this.score.player1 >= this.settings.endScore ? this.endGame('Player 1') : this.resetBall();
      }
    }
  }

  private endGame(winner: string) {
    this.isGameOver = true;
    this.winner = winner;
    this.gameLoop = false;
    cancelAnimationFrame(this.animationFrameId);
  }

  private resetGame() {
    this.score = { player1: 0, player2: 0 };
    this.isGameOver = false;
    this.winner = '';
    this.isGameStarted = false;
    this.isBallActive = false;
    this.isInitialCountdown = false;
    this.gameLoop = false;
    this.initGame();
    this.draw();
  }

  private togglePause() {
    this.isPaused = !this.isPaused;
    this.isPaused ? cancelAnimationFrame(this.animationFrameId) : this.startGameLoop();
    this.draw();
  }

  private draw() {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = this.settings.paddleColor;
    this.ctx.fillRect(this.paddle1.x, this.paddle1.y, this.paddle1.width, this.paddle1.height);
    this.ctx.fillRect(this.paddle2.x, this.paddle2.y, this.paddle2.width, this.paddle2.height);

    if (this.isGameStarted && this.isBallActive && !this.isGameOver) {
      this.ctx.beginPath();
      this.ctx.arc(this.ball.x, this.ball.y, this.ball.size / 2, 0, Math.PI * 2);
      this.ctx.fillStyle = this.settings.ballColor;
      this.ctx.fill();
      this.ctx.closePath();
    }

    this.ctx.beginPath();
    this.ctx.setLineDash([5, 15]);
    this.ctx.moveTo(this.canvas.width / 2, 0);
    this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
    this.ctx.strokeStyle = '#000';
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#000';

    if (this.isGameOver) {
      this.drawCenteredText(`${this.winner} Wins!`, 48, this.canvas.height / 2 - 30);
      this.drawCenteredText('Press SPACE to Play Again', 24, this.canvas.height / 2 + 30);
    } else if (this.isPaused) {
      this.drawCenteredText('⏸️ Paused', 48, this.canvas.height / 2 - 30);
      this.drawCenteredText('Press P to Resume', 24, this.canvas.height / 2 + 30);
    } else if (!this.isGameStarted) {
      this.drawCenteredText(
        this.isInitialCountdown ? this.countdown.toString() : 'Press SPACE to Start',
        this.isInitialCountdown ? 72 : 48,
        this.canvas.height / 2
      );
    } else if (!this.isBallActive && this.countdown > 0) {
      this.drawCenteredText(this.countdown.toString(), 72, this.canvas.height / 2);
    }

    if (!this.isGameStarted) requestAnimationFrame(() => this.draw());
  }

  private handleResize = () => {
    if (this.isGameStarted) return;
    this.initGame();
    this.draw();
  };

  firstUpdated() {
    this.canvas = this.shadowRoot?.querySelector('canvas') as HTMLCanvasElement;
    this.ctx = this.canvas?.getContext('2d') || null;
    this.initGame();
    this.setupEventListeners();
    this.draw();
    window.addEventListener('resize', this.handleResize);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.gameLoop = false;
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.handleResize);
  }

  private handleSettingsChanged = (e: Event) => {
    this.settings = (e as CustomEvent<GameSettings>).detail;
    this.updateGameSettings();
  };

  render() {
    return html`
      <div class="game-container">
       <div class="score-display">
  <span>Player 1: ${this.score.player1}</span>
  <span style="margin: 0 1rem;">|</span>
  <span>Player 2: ${this.score.player2}</span>
</div>

        <canvas class="responsive-canvas"></canvas>
        <div class="controls-info">
          Player 1: W/S keys | Player 2: ↑/↓ arrows | P to Pause
        </div>
      </div>
    `;
  }
}