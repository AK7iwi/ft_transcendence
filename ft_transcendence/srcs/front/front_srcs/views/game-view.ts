import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

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
      gap: var(--spacing-lg);
    }

    .game-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      max-width: 800px;
    }

    .score {
      font-size: 2rem;
      font-weight: 700;
      color: var(--color-text);
    }

    .game-canvas {
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      border: 2px solid var(--color-border);
      box-shadow: var(--shadow-lg);
    }

    .controls {
      display: flex;
      gap: var(--spacing-md);
      margin-top: var(--spacing-lg);
    }

    .game-info {
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      padding: var(--spacing-lg);
      margin-top: var(--spacing-lg);
      border: 1px solid var(--color-border);
    }

    .game-info h3 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: var(--spacing-md);
      color: var(--color-text);
    }

    .game-info p {
      color: var(--color-text-secondary);
      margin-bottom: var(--spacing-sm);
    }
  `;

  @state()
  private score = { player1: 0, player2: 0 };

  @state()
  private gameStarted = false;

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationFrameId: number | null = null;

  // Game objects
  private ball = {
    x: 400,
    y: 300,
    radius: 10,
    speed: 5,
    dx: 5,
    dy: 5
  };

  private paddle1 = {
    x: 50,
    y: 250,
    width: 10,
    height: 100,
    dy: 8
  };

  private paddle2 = {
    x: 740,
    y: 250,
    width: 10,
    height: 100,
    dy: 8
  };

  private keys = {
    w: false,
    s: false,
    ArrowUp: false,
    ArrowDown: false
  };

  firstUpdated() {
    this.canvas = this.shadowRoot?.querySelector('canvas') as HTMLCanvasElement;
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.setupEventListeners();
      this.draw();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopGame();
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  private setupEventListeners() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key in this.keys) {
      this.keys[e.key as keyof typeof this.keys] = true;
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    if (e.key in this.keys) {
      this.keys[e.key as keyof typeof this.keys] = false;
    }
  };

  private startGame() {
    if (!this.gameStarted) {
      this.gameStarted = true;
      this.gameLoop();
    }
  }

  private stopGame() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.gameStarted = false;
  }

  private resetGame() {
    this.ball.x = 400;
    this.ball.y = 300;
    this.ball.dx = 5;
    this.ball.dy = 5;
    this.paddle1.y = 250;
    this.paddle2.y = 250;
    this.score = { player1: 0, player2: 0 };
  }

  private gameLoop = () => {
    this.update();
    this.draw();
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  private update() {
    // Move paddles
    if (this.keys.w && this.paddle1.y > 0) {
      this.paddle1.y -= this.paddle1.dy;
    }
    if (this.keys.s && this.paddle1.y < 500) {
      this.paddle1.y += this.paddle1.dy;
    }
    if (this.keys.ArrowUp && this.paddle2.y > 0) {
      this.paddle2.y -= this.paddle2.dy;
    }
    if (this.keys.ArrowDown && this.paddle2.y < 500) {
      this.paddle2.y += this.paddle2.dy;
    }

    // Move ball
    this.ball.x += this.ball.dx;
    this.ball.y += this.ball.dy;

    // Ball collision with top and bottom
    if (this.ball.y - this.ball.radius < 0 || this.ball.y + this.ball.radius > 600) {
      this.ball.dy *= -1;
    }

    // Ball collision with paddles
    if (
      this.ball.x - this.ball.radius < this.paddle1.x + this.paddle1.width &&
      this.ball.y > this.paddle1.y &&
      this.ball.y < this.paddle1.y + this.paddle1.height
    ) {
      this.ball.dx *= -1;
    }

    if (
      this.ball.x + this.ball.radius > this.paddle2.x &&
      this.ball.y > this.paddle2.y &&
      this.ball.y < this.paddle2.y + this.paddle2.height
    ) {
      this.ball.dx *= -1;
    }

    // Score points
    if (this.ball.x + this.ball.radius > 800) {
      this.score.player1++;
      this.resetBall();
    }
    if (this.ball.x - this.ball.radius < 0) {
      this.score.player2++;
      this.resetBall();
    }
  }

  private resetBall() {
    this.ball.x = 400;
    this.ball.y = 300;
    this.ball.dx *= -1;
    this.ball.dy = Math.random() > 0.5 ? 5 : -5;
  }

  private draw() {
    if (!this.ctx || !this.canvas) return;

    // Clear canvas
    this.ctx.fillStyle = 'var(--color-surface)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw center line
    this.ctx.setLineDash([10, 10]);
    this.ctx.beginPath();
    this.ctx.moveTo(400, 0);
    this.ctx.lineTo(400, 600);
    this.ctx.strokeStyle = 'var(--color-border)';
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // Draw ball
    this.ctx.beginPath();
    this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = 'var(--color-accent)';
    this.ctx.fill();
    this.ctx.closePath();

    // Draw paddles
    this.ctx.fillStyle = 'var(--color-text)';
    this.ctx.fillRect(this.paddle1.x, this.paddle1.y, this.paddle1.width, this.paddle1.height);
    this.ctx.fillRect(this.paddle2.x, this.paddle2.y, this.paddle2.width, this.paddle2.height);
  }

  render() {
    return html`
      <base-view>
        <div class="game-container">
          <div class="game-header">
            <div class="score">${this.score.player1}</div>
            <div class="controls">
              <button 
                @click=${this.startGame}
                class="btn btn-primary"
                ?disabled=${this.gameStarted}
              >
                Start Game
              </button>
              <button 
                @click=${this.stopGame}
                class="btn btn-secondary"
                ?disabled=${!this.gameStarted}
              >
                Stop Game
              </button>
              <button 
                @click=${this.resetGame}
                class="btn btn-secondary"
              >
                Reset
              </button>
            </div>
            <div class="score">${this.score.player2}</div>
          </div>

          <canvas 
            width="800" 
            height="600" 
            class="game-canvas"
          ></canvas>

          <div class="game-info">
            <h3>How to Play</h3>
            <p>Player 1: Use W and S keys to move up and down</p>
            <p>Player 2: Use Arrow Up and Arrow Down keys to move up and down</p>
            <p>First player to reach 5 points wins!</p>
          </div>
        </div>
      </base-view>
    `;
  }
} 