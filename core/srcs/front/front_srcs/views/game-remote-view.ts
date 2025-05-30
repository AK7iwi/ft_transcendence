import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { SettingsService } from '../services/settings-service';
import type { GameSettings } from '../services/settings-service';
import { API_BASE_URL } from '../config';


@customElement('game-remote-view')
export class GameRemoteView extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      overflow: hidden;
      position: fixed;
      top: 0;
      left: 0;
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
      margin-top: 2rem;
    }
    .responsive-canvas {
      width: 768px;
      height: 432px;
      min-width: 768px;
      min-height: 432px;
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

    @media (max-width: 768px) {
      .game-container {
        padding: 0.25rem;
        height: calc(100vh - 120px);
        margin-top: 1rem;
      }
      .responsive-canvas {
        width: 95%;
        height: 50vh;
      }
      .score-display {
        margin: 0.15rem 0;
      }
      .controls-info {
        margin-top: 0.15rem;
      }
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
  private playerId: string = '';
  
  private socket: WebSocket | null = null;
  private playerRole: 'host' | 'guest' | null = null;
  
  // Game objects
  private paddle1 = { x: 0, y: 0, width: 10, height: 100, speed: 5, dy: 0 };
  private paddle2 = { x: 0, y: 0, width: 10, height: 100, speed: 5, dy: 0 };
  private ball = { x: 0, y: 0, size: 10, speed: 5, dx: 5, dy: 5 };
  
  private targetPaddle1Y = 0;
  private targetPaddle2Y = 0;

  constructor() {
    super();
    this.settingsService = SettingsService.getInstance();
    this.settings = this.settingsService.getSettings();
    window.addEventListener('settingsChanged', this.handleSettingsChanged);
  }

private initWebSocket() {
    console.log('[CLIENT] Initializing WebSocket...');
    const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
    const wsUrl = API_BASE_URL.replace(/^https?/, wsProtocol) + '/ws';
    this.socket = new WebSocket(wsUrl);
    console.log('[CLIENT] Connecting to WebSocket:', wsUrl);

    this.socket.onopen = () => {
      const token = localStorage.getItem('token');
      if (!token) console.warn('[CLIENT] No token in localStorage!');
      if (token) {
        this.socket!.send(JSON.stringify({
          type: 'auth',
          payload: { token }
        }));
      }
    };
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('[CLIENT] WebSocket message received:', event.data);
      this.handleMessage(message);
    };
    this.socket.onclose = () => {
    console.warn('[CLIENT] WebSocket closed, retrying...');
      setTimeout(() => this.initWebSocket(), 1000);
    };
    this.socket.onerror = () => {
      console.error('[CLIENT] WebSocket error:');
      this.socket?.close();
    };
  }


  private sendMessage(action: string, payload: Record<string, any> = {}) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('[CLIENT] Sending:', { type: 'game', payload: { action, ...payload } });
      this.socket.send(JSON.stringify({
        type: 'game',
        payload: { action, ...payload },
      }));
    } else {
    console.warn('[CLIENT] WebSocket not ready');
    }
  }

  private handleMessage(message: any) {
    if (message.type === 'connection')
      this.playerId = message.clientId;
    if (message.type === 'auth-success') {
      console.log(`[CLIENT] Auth success, sending join with ${message.userId}`);
      const userId = message.userId;
      this.sendMessage('join', { userId });
    }
    if (message.type === 'game') {
      const data = message.data;
      switch (data.action) {
        case 'playerJoined':
          this.playerRole = data.role;
          console.log(`🎮 You are the ${this.playerRole}`);
          break;
        case 'waiting':
          console.log(data.message);
          break;
        case 'startGame':
          if (this.playerRole === 'guest' && data.settings) {
            this.settings = data.settings;
            this.updateGameSettings();
          }
          this.isInitialCountdown = true;
          const targetStartTime = data.startAt;
          const countdownInterval = setInterval(() => {
            const now = Date.now();
            const timeRemaining = Math.ceil((targetStartTime - now) / 1000);
            this.countdown = Math.max(timeRemaining, 0);

            if (this.countdown <= 0) {
              clearInterval(countdownInterval);
              this.gameLoop = true;
              this.isGameStarted = true;
              this.isBallActive = true;
              this.isInitialCountdown = false;
              this.startGameLoop();
            }
          }, 100);
          break;
        case 'pause':
          this.togglePause();
          break;
        case 'resetGame':
          console.log("🔄 Received resetGame from server");
          this.resetGame(); // Clean up guest state
          break;
        case 'endGame':
          this.isGameOver = true;
          this.winner = data.winner;
          this.gameLoop = false;

          if (this.animationFrameId)
            cancelAnimationFrame(this.animationFrameId);

          this.draw();
          break;
        case 'ballUpdate':
          if (this.playerRole === 'guest') {
            this.ball = {
              x: data.x,
              y: data.y,
              dx: data.dx,
              dy: data.dy,
              size: data.size,
              speed: data.speed
            };
          }
          break;
        case 'movePaddle':
          console.log('move paddle');
          if (data.clientId === this.playerId) return;
          if (this.playerRole === 'host')
            this.targetPaddle2Y = data.y;
          else
            this.targetPaddle1Y = data.y;
          break;
        case 'ballReset':
          if (this.playerRole === 'guest') {
            this.ball = data;
            this.isBallActive = false;
            this.startBallCountdown();
          }
          break;
        case 'scoreUpdate':
          if (this.playerRole === 'guest') {
            this.score = data;
          }
          break;
        default:
          console.warn('⚠️ Unhandled game action:', data.action);
      }
    }
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
    this.canvas.width = 768;
    this.canvas.height = 432;

    // Initialize paddle positions
    this.paddle1.x = this.canvas.width * 0.02; // 2% from left
    this.paddle1.y = (this.canvas.height - this.paddle1.height) / 2;
    this.paddle2.x = this.canvas.width * 0.98 - this.paddle2.width; // 2% from right
    this.paddle2.y = (this.canvas.height - this.paddle2.height) / 2;

    this.targetPaddle1Y = this.paddle1.y;
    this.targetPaddle2Y = this.paddle2.y;
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

    // ✅ Only host should generate ball direction
    if (this.playerRole !== 'host') return;

    this.ball.x = this.canvas.width / 2;
    this.ball.y = this.canvas.height / 2;

    const angle = (Math.random() * 120 - 60) * (Math.PI / 180);
    const direction = Math.random() > 0.5 ? 1 : -1;

    this.ball.dx = Math.cos(angle) * this.settings.ballSpeed * direction;
    this.ball.dy = Math.sin(angle) * this.settings.ballSpeed;

    this.isBallActive = false;

    this.sendMessage('ballReset', this.ball); // 🔄 Sync ball to guest
    this.startBallCountdown(); // ⏱ Start countdown locally
  }

  private setupEventListeners() {
    // Keyboard controls
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));
  }

  private handleKeyDown(e: KeyboardEvent) {
    console.log("🔑 Key pressed:", e.key, "Role:", this.playerRole);
    // if (!this.isGameStarted || this.isGameOver || this.isPaused) return;
    // pause
    if (e.key.toLowerCase() === 'g' && this.isGameStarted && !this.isGameOver) {
      this.sendMessage('pause');
      return;
    }
    // start
    if (e.key === 'Enter' && !this.isGameStarted && !this.isGameOver && this.playerRole === 'host') {
      const startAt = Date.now() + 3000;
      this.sendMessage('startGame', {
        settings: this.settings,
        startAt,
      });
      return;
    }
    if (e.key === 'Enter' && this.isGameOver && this.playerRole === 'host') {
      this.sendMessage('resetGame');

      // 👇 Host re-broadcasts startGame trigger
      const startAt = Date.now() + 3000;
      this.sendMessage('startGame', {
        settings: this.settings,
        startAt,
      });

      return;
    }
    if (e.key === 'Enter' && this.isGameOver && this.playerRole !== 'host') {
      // ❌ Guest should not start anything on space
      return;
    }
    // HOST CONTROLS PADDLE 1
    if (this.playerRole === 'host') {
      if (e.key.toLowerCase() === 'w') {
        this.paddle1.dy = -this.paddle1.speed;
      } else if (e.key.toLowerCase() === 's') {
        this.paddle1.dy = this.paddle1.speed;
      }
      return;
    }

    // GUEST CONTROLS PADDLE 2
    if (this.playerRole === 'guest') {
      if (e.key === 'o') {
        this.paddle2.dy = -this.paddle2.speed;
      } else if (e.key === 'k') {
        this.paddle2.dy = this.paddle2.speed;
      }
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    if (this.playerRole === 'host' && (e.key.toLowerCase() === 'w' || e.key.toLowerCase() === 's'))
      this.paddle1.dy = 0;
    if (this.playerRole === 'guest' && (e.key === 'o' || e.key === 'k'))
      this.paddle2.dy = 0;
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
    if (!this.gameLoop || this.isPaused) {
      console.log('🚫 Game loop blocked. gameLoop:', this.gameLoop, 'isPaused:', this.isPaused);
      return;
    }
    this.updateGame();
    this.draw();
    this.animationFrameId = requestAnimationFrame(() => this.startGameLoop());
  }

private updateGame() {
  if (!this.canvas) return;

  // Paddle movement
  if (this.playerRole === 'host') {
    const prevY = this.paddle1.y;
    this.paddle1.y += this.paddle1.dy;
    if (prevY !== this.paddle1.y) {
      this.sendMessage('movePaddle', { y: this.paddle1.y });
    }
    this.paddle2.y += (this.targetPaddle2Y - this.paddle2.y) * 0.2;
  }
  if (this.playerRole === 'guest') {
    const prevY = this.paddle2.y;
    this.paddle2.y += this.paddle2.dy;
    if (prevY !== this.paddle2.y) {
      this.sendMessage('movePaddle', { y: this.paddle2.y });
    }
    this.paddle1.y += (this.targetPaddle1Y - this.paddle1.y) * 0.2;
  }

  // Clamp paddle positions
  this.paddle1.y = Math.max(0, Math.min(this.canvas.height - this.paddle1.height, this.paddle1.y));
  this.paddle2.y = Math.max(0, Math.min(this.canvas.height - this.paddle2.height, this.paddle2.y));

  // 🚫 Skip ball and scoring logic if inactive or game over
  if (!this.isBallActive || this.isGameOver) return;

  // Ball movement
  this.ball.x += this.ball.dx;
  this.ball.y += this.ball.dy;

  if (this.playerRole === 'host') {
    this.sendMessage('ballUpdate', this.ball);
  }

  // Ball collision with top/bottom
  if (this.ball.y <= 0 || this.ball.y >= this.canvas.height) {
    this.ball.dy *= -1;
  }

  // Ball collision with paddles
  if (this.ball.dx < 0) {
    if (
      this.ball.x <= this.paddle1.x + this.paddle1.width &&
      this.ball.x >= this.paddle1.x &&
      this.ball.y + this.ball.size / 2 >= this.paddle1.y &&
      this.ball.y - this.ball.size / 2 <= this.paddle1.y + this.paddle1.height
    ) {
      this.ball.dx *= -1;
    }
  } else {
    if (
      this.ball.x + this.ball.size >= this.paddle2.x &&
      this.ball.x + this.ball.size <= this.paddle2.x + this.paddle2.width &&
      this.ball.y + this.ball.size / 2 >= this.paddle2.y &&
      this.ball.y - this.ball.size / 2 <= this.paddle2.y + this.paddle2.height
    ) {
      this.ball.dx *= -1;
    }
  }

  // Score check (host only)
  if (this.playerRole === 'host') {
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
    this.sendMessage('scoreUpdate', this.score);
  }
}


  private endGame(winner: string) {
    this.isGameOver = true;
    this.winner = winner;
    this.sendMessage('endGame', { winner });
    this.gameLoop = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private resetGame() {
    // Reset all game states
    console.log("trying to reset game ...");
    this.score = { player1: 0, player2: 0 };
    this.isGameOver = false;
    this.winner = '';
    this.isGameStarted = false;
    this.isBallActive = false;
    this.isInitialCountdown = false;
    this.gameLoop = false;
    
    // Reinitialize the game
    this.initGame();
    
    // Draw the initial state
    this.draw();
  }

  private togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
      this.draw();
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

    // Draw messages with improved visibility
    this.ctx.textAlign = 'center'; 
    this.ctx.fillStyle = '#000';

    if (this.isGameOver) {
      this.ctx.font = 'bold 48px Arial';
      const message = `${this.winner} Wins!`;
      this.ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2 - 30);
      this.ctx.font = 'bold 24px Arial';
      this.ctx.fillText('Press ENTER to Play Again', this.canvas.width / 2, this.canvas.height / 2 + 30);
    } else if (this.isPaused) {
      this.ctx.font = 'bold 48px Arial';
      this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2 - 30);
      this.ctx.font = 'bold 24px Arial';
      this.ctx.fillText('Press P to Resume', this.canvas.width / 2, this.canvas.height / 2 + 30);
    } else if (!this.isGameStarted) {
      if (this.isInitialCountdown) {
        this.ctx.font = 'bold 72px Arial';
        this.ctx.fillText(this.countdown.toString(), this.canvas.width / 2, this.canvas.height / 2);
      } else {
        this.ctx.font = 'bold 48px Arial';
        this.ctx.fillText('Press ENTER to Start', this.canvas.width / 2, this.canvas.height / 2);
      }
    } else if (!this.isBallActive && this.countdown > 0) {
      this.ctx.font = 'bold 72px Arial';
      this.ctx.fillText(this.countdown.toString(), this.canvas.width / 2, this.canvas.height / 2);
    }

    // Request next frame if game is not started
    // if (!this.isGameStarted) {
      requestAnimationFrame(() => this.draw());
    // }
  }

  // Add resize handler
  private handleResize = () => {
    if (this.isGameStarted) return; // Don't resize during gameplay
    this.initGame();
    this.draw();
  };

  firstUpdated() {
    this.canvas = this.shadowRoot?.querySelector('canvas') as HTMLCanvasElement;
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.initGame();
      this.setupEventListeners();
      this.initWebSocket();
      this.ball.x = this.canvas.width / 2;
      this.ball.y = this.canvas.height / 2;
      this.draw();
      window.addEventListener('resize', this.handleResize);
    }
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
          Player 1: W/S keys | Player 2: O/K keys | G to Pause
        </div>
      </div>
    `;
  }
} 