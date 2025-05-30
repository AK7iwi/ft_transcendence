import { SettingsService } from '../services/settings-service';
import type { GameSettings } from '../services/settings-service';
import { API_BASE_URL } from '../config';

class GameRemoteView extends HTMLElement {
  private score = { player1: 0, player2: 0 };
  private isGameStarted = false;
  private isGameOver = false;
  private winner = '';
  private countdown = 0;
  private isBallActive = false;
  private isInitialCountdown = false;
  private isPaused = false;

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationFrameId = 0;
  private gameLoop = false;

  private settingsService = SettingsService.getInstance();
  private settings: GameSettings = this.settingsService.getSettings();

  private playerId = '';
  private userId = 0;
  private playerRole: 'host' | 'guest' | null = null;
  private socket: WebSocket | null = null;

  private paddle1 = { x: 0, y: 0, width: 10, height: 100, speed: 5, dy: 0 };
  private paddle2 = { x: 0, y: 0, width: 10, height: 100, speed: 5, dy: 0 };
  private ball = { x: 0, y: 0, size: 10, speed: 5, dx: 5, dy: 5 };

  private targetPaddle1Y = 0;
  private targetPaddle2Y = 0;

  constructor() {
    super();
    window.addEventListener('settingsChanged', this.handleSettingsChanged);
  }

  connectedCallback() {
    this.render();
    // 1. Hook canvas / WS / events existants
    this.canvas = this.querySelector('canvas');
    this.ctx    = this.canvas?.getContext('2d') || null;
    this.initGame();
    this.setupEventListeners();
    this.initWebSocket();
    this.draw();
    // 2. Leave game button
    this.querySelector('#leaveBtn')!
        .addEventListener('click', this.handleLeaveGame);
    window.addEventListener('resize', this.handleResize);
  }


  disconnectedCallback() {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('settingsChanged', this.handleSettingsChanged);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.socket?.close();
    cancelAnimationFrame(this.animationFrameId);
  }

  private render() {
    this.innerHTML = `
      <div class="flex flex-col items-center justify-center w-full min-h-[calc(100vh-80px)] p-4 bg-gray-100 relative">
        <div class="relative flex justify-center items-center w-full max-w-[1000px] mb-4">
          <span class="absolute left-0 px-4 py-2 bg-gradient-to-r from-white via-pink-100 to-purple-200 text-slate-900 rounded-full text-sm font-semibold">
            Player 1
          </span>
          <span id="score" class="px-8 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-full text-2xl font-bold mx-20">
            0 - 0
          </span>
          <span class="absolute right-0 px-4 py-2 bg-gradient-to-r from-white via-pink-100 to-purple-200 text-slate-900 rounded-full text-sm font-semibold">
            Player 2
          </span>
        </div>
        <div class="relative w-4/5 max-w-[1000px] min-w-[300px] rounded-xl p-[5px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-xl">
          <div class="bg-white rounded-xl overflow-hidden relative">
            <canvas class="w-full h-[60vh] min-h-[200px] responsive-canvas border-2 border-indigo-600"></canvas>
          </div>
        </div>
        <div class="flex flex-wrap justify-center gap-4 mt-6">
          <span class="px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-sm rounded-full shadow-md">
            Player 1:
            <span class="inline-block px-2 py-1 bg-white text-slate-900 rounded shadow-inner font-bold text-xs">W</span>
            <span class="inline-block px-2 py-1 bg-white text-slate-900 rounded shadow-inner font-bold text-xs">S</span>
          </span>
          <span class="px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-sm rounded-full shadow-md">
            Pause:
            <span class="inline-block px-2 py-1 bg-white text-slate-900 rounded shadow-inner font-bold text-xs">P</span>
          </span>
          <span class="px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-sm rounded-full shadow-md">
            Player 2:
            <span class="inline-block px-2 py-1 bg-white text-slate-900 rounded shadow-inner font-bold text-xs">O</span>
            <span class="inline-block px-2 py-1 bg-white text-slate-900 rounded shadow-inner font-bold text-xs">K</span>
          </span>
        </div>
      </div>
    `;
  }

  private updateScoreDisplay() {
    const scoreEl = this.querySelector('#score');
    if (scoreEl) {
      scoreEl.textContent = `${this.score.player1} - ${this.score.player2}`;
    }
  }

  private handleSettingsChanged = (e: Event) => {
    const customEvent = e as CustomEvent<GameSettings>;
    this.settings = customEvent.detail;
    this.updateGameSettings();
  };

  private handleResize = () => {
    if (this.isGameStarted) return; // éviter glitch en plein jeu
    this.initGame();
    this.draw();
  };

  private setupEventListeners() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    console.log('🔑 Key pressed:', e.key, 'Role:', this.playerRole);
    if (e.key.toLowerCase() === 'p' && this.isGameStarted && !this.isGameOver) {
      this.sendMessage('pause');
      return;
    }
    if (e.key === ' ' && !this.isGameStarted && !this.isGameOver && this.playerRole === 'host') {
      const startAt = Date.now() + 3000;
      this.sendMessage('startGame', {
        settings: this.settings,
        startAt,
      });
      return;
    }
    if (e.key === ' ' && this.isGameOver && this.playerRole === 'host') {
      this.sendMessage('resetGame');
      const startAt = Date.now() + 3000;
      this.sendMessage('startGame', {
        settings: this.settings,
        startAt,
      });
      return;
    }
    if (e.key === ' ' && this.isGameOver && this.playerRole !== 'host') {
      return;
    }
    if (this.playerRole === 'host') {
      if (e.key.toLowerCase() === 'w') this.paddle1.dy = -this.paddle1.speed;
      else if (e.key.toLowerCase() === 's') this.paddle1.dy = this.paddle1.speed;
      return;
    }
    if (this.playerRole === 'guest') {
      if (e.key === 'o') this.paddle2.dy = -this.paddle2.speed;
      else if (e.key === 'k') this.paddle2.dy = this.paddle2.speed;
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    if (this.playerRole === 'host' && (e.key.toLowerCase() === 'w' || e.key.toLowerCase() === 's'))
      this.paddle1.dy = 0;
    if (this.playerRole === 'guest' && (e.key === 'o' || e.key === 'k'))
      this.paddle2.dy = 0;
  };

  private initWebSocket() {
    const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
    const wsUrl = API_BASE_URL.replace(/^https?/, wsProtocol) + '/ws';
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      const token = localStorage.getItem('token');
      if (token) {
        this.socket!.send(
          JSON.stringify({ type: 'auth', payload: { token } }),
        );
      } else {
        console.warn('[CLIENT] No token in localStorage!');
      }
    };

    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('[CLIENT] WebSocket message received:', message);
      this.handleMessage(message);
    };

    this.socket.onclose = () => {
      console.warn('[CLIENT] WebSocket closed, retrying...');
      setTimeout(() => this.initWebSocket(), 1000);
    };

    this.socket.onerror = () => {
      console.error('[CLIENT] WebSocket error');
      this.socket?.close();
    };
  }

  private sendMessage(action: string, payload: Record<string, any> = {}) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({ type: 'game', payload: { action, ...payload } }),
      );
    } else {
      console.warn('[CLIENT] WebSocket not ready');
    }
  }

private handleMessage(message: any) {
  if (message.type === 'connection') {
    this.playerId = message.clientId;
  }
  if (message.type === 'auth-success') {
    this.userId = message.userId;
    this.sendMessage('join', { userId: this.userId });
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
        // ─── NOUVEAU: si je suis l'hôte, je reset la balle et j'envoie ballReset ───
        if (this.playerRole === 'host') {
          this.resetBall();
        }
        // ────────────────────────────────────────────────────────────────────────────

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
        console.log('🔄 Received resetGame from server');
        this.resetGame();
        break;

      case 'endGame':
        this.isGameOver = true;
        this.winner = data.winner;
        this.gameLoop = false;
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        this.draw();
        break;

      case 'ballUpdate':
        if (this.playerRole === 'guest') {
          this.ball = { ...data };
        }
        break;
        case 'resetGame':
      console.log('🔄 Received resetGame from server');
      this.resetGame();
      // ➡️ Réinscription pour recevoir à nouveau playerJoined
      this.sendMessage('join', { userId: this.userId });
      break;

      case 'movePaddle':
        if (data.clientId === this.playerId) return;
        if (this.playerRole === 'host') {
          this.targetPaddle2Y = data.y;
        } else {
          this.targetPaddle1Y = data.y;
        }
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
          this.updateScoreDisplay();
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

    const container = this.canvas.parentElement!;
    let width = container.clientWidth;
    let height = width / (16 / 9);

    if (height > container.clientHeight) {
      height = container.clientHeight;
      width = height * (16 / 9);
    }

    this.canvas.width = width;
    this.canvas.height = height;

    this.paddle1.x = this.canvas.width * 0.02;
    this.paddle1.y = (this.canvas.height - this.paddle1.height) / 2;

    this.paddle2.x = this.canvas.width * 0.98 - this.paddle2.width;
    this.paddle2.y = (this.canvas.height - this.paddle2.height) / 2;

    this.targetPaddle1Y = this.paddle1.y;
    this.targetPaddle2Y = this.paddle2.y;

    this.resetBall();

    this.gameLoop = false;
    this.isGameStarted = false;
    this.isBallActive = false;

    this.updateGameSettings();
  }

  private resetBall() {
    if (!this.canvas) return;
    if (this.playerRole !== 'host') return;

    this.ball.x = this.canvas.width / 2;
    this.ball.y = this.canvas.height / 2;

    const angle = (Math.random() * 120 - 60) * (Math.PI / 180);
    const direction = Math.random() > 0.5 ? 1 : -1;

    this.ball.dx = Math.cos(angle) * this.settings.ballSpeed * direction;
    this.ball.dy = Math.sin(angle) * this.settings.ballSpeed;

    this.isBallActive = false;

    this.sendMessage('ballReset', this.ball);
    this.startBallCountdown();
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

private startGameLoop = () => {
  if (!this.gameLoop || this.isPaused) {
    console.log('🚫 Game loop blocked.', this.gameLoop, this.isPaused);
    return;
  }
  this.updateGame();
  this.draw();
  this.animationFrameId = requestAnimationFrame(this.startGameLoop);
};

  private endGame = (winner: string) => {
    this.isGameOver = true;
    this.winner = winner;
    this.gameLoop = false;
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    this.sendMessage('endGame', { winner });
  };
  
 private updateGame = () => {
    if (!this.canvas) return;
console.log('updateGame this.endGame =', this.endGame);

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

    this.paddle1.y = Math.max(0, Math.min(this.canvas.height - this.paddle1.height, this.paddle1.y));
    this.paddle2.y = Math.max(0, Math.min(this.canvas.height - this.paddle2.height, this.paddle2.y));

    if (!this.isBallActive || this.isGameOver) return;

    this.ball.x += this.ball.dx;
    this.ball.y += this.ball.dy;

    if (this.ball.y <= 0 || this.ball.y >= this.canvas.height) {
      this.ball.dy *= -1;
    }

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

    if (this.playerRole === 'host') {
      if (this.ball.x <= 0) {
        this.score.player2++;
        if (this.score.player2 >= this.settings.endScore) this.endGame('Player 2');
        else this.resetBall();
        this.updateScoreDisplay();
      } else if (this.ball.x >= this.canvas.width) {
        this.score.player1++;
        if (this.score.player1 >= this.settings.endScore) this.endGame('Player 1');
        else this.resetBall();
        this.updateScoreDisplay();
      }
      this.sendMessage('scoreUpdate', this.score);
    }
  }

private resetGame = () => {
  this.score = { player1: 0, player2: 0 };
  this.isGameStarted = false;
  this.isGameOver = false;
  this.winner = '';
  this.countdown = 0;
  this.isBallActive = false;
  this.isInitialCountdown = false;
  this.isPaused = false;
  this.gameLoop = false;

  this.initGame();
  this.draw();
};


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
      this.ctx.font = 'bold 48px Arial';
      this.ctx.fillText(`${this.winner} Wins!`, this.canvas.width / 2, this.canvas.height / 2 - 30);
      this.ctx.font = 'bold 24px Arial';
      this.ctx.fillText('Press SPACE to Play Again', this.canvas.width / 2, this.canvas.height / 2 + 30);
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
        this.ctx.fillText('Press SPACE to Start', this.canvas.width / 2, this.canvas.height / 2);
      }
    } else if (!this.isBallActive && this.countdown > 0) {
      this.ctx.font = 'bold 72px Arial';
      this.ctx.fillText(this.countdown.toString(), this.canvas.width / 2, this.canvas.height / 2);
    }

    if (!this.isGameStarted) {
      requestAnimationFrame(() => this.draw());
    }
  }
}

customElements.define('game-remote-view', GameRemoteView);


// import { LitElement, html, css } from 'lit';
// import { customElement, state } from 'lit/decorators.js';
// import { SettingsService } from '../services/settings-service';
// import type { GameSettings } from '../services/settings-service';
// import { API_BASE_URL } from '../config';


// @customElement('game-remote-view')
// export class GameRemoteView extends LitElement {
//   static styles = css`
//     :host {
//       display: block;
//       width: 100%;
//       height: 100%;
//       overflow: hidden;
//       position: fixed;
//       top: 0;
//       left: 0;
//     }
//     .game-container {
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       justify-content: center;
//       width: 100%;
//       height: calc(100vh - 80px);
//       box-sizing: border-box;
//       padding: 0.5rem;
//       overflow: hidden;
//       position: relative;
//       margin-top: 2rem;
//     }
//     .responsive-canvas {
//       width: 768px;
//       height: 432px;
//       min-width: 768px;
//       min-height: 432px;
//       background: white;
//       border: 2px solid var(--color-accent);
//       display: block;
//       margin: 0.25rem auto;
//     }
//     .score-display {
//       color: var(--color-text);
//       font-size: clamp(1.5rem, 3vw, 2rem);
//       margin: 0.25rem 0;
//       font-family: var(--font-mono);
//     }
//     .controls-info {
//       color: var(--color-text-secondary);
//       margin-top: 0.25rem;
//       text-align: center;
//       font-size: clamp(0.8rem, 1.5vw, 1rem);
//     }

//     @media (max-width: 768px) {
//       .game-container {
//         padding: 0.25rem;
//         height: calc(100vh - 120px);
//         margin-top: 1rem;
//       }
//       .responsive-canvas {
//         width: 95%;
//         height: 50vh;
//       }
//       .score-display {
//         margin: 0.15rem 0;
//       }
//       .controls-info {
//         margin-top: 0.15rem;
//       }
//     }
//   `;

//   @state()
//   private score = { player1: 0, player2: 0 };

//   @state()
//   private isGameStarted = false;

//   @state()
//   private isGameOver = false;

//   @state()
//   private winner = '';

//   @state()
//   private countdown = 0;

//   @state()
//   private isBallActive = false;

//   @state()
//   private isInitialCountdown = false;

//   @state()
//   private isPaused = false;
  
  
//   private canvas: HTMLCanvasElement | null = null;
//   private ctx: CanvasRenderingContext2D | null = null;
//   private animationFrameId: number = 0;
//   private gameLoop: boolean = false;
//   private settingsService: SettingsService;
//   private settings: GameSettings;
//   private playerId: string = '';
  
//   private socket: WebSocket | null = null;
//   private playerRole: 'host' | 'guest' | null = null;
  
//   // Game objects
//   private paddle1 = { x: 0, y: 0, width: 10, height: 100, speed: 5, dy: 0 };
//   private paddle2 = { x: 0, y: 0, width: 10, height: 100, speed: 5, dy: 0 };
//   private ball = { x: 0, y: 0, size: 10, speed: 5, dx: 5, dy: 5 };
  
//   private targetPaddle1Y = 0;
//   private targetPaddle2Y = 0;

//   constructor() {
//     super();
//     this.settingsService = SettingsService.getInstance();
//     this.settings = this.settingsService.getSettings();
//     window.addEventListener('settingsChanged', this.handleSettingsChanged);
//   }

// private initWebSocket() {
//     console.log('[CLIENT] Initializing WebSocket...');
//     const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
//     const wsUrl = API_BASE_URL.replace(/^https?/, wsProtocol) + '/ws';
//     this.socket = new WebSocket(wsUrl);
//     console.log('[CLIENT] Connecting to WebSocket:', wsUrl);

//     this.socket.onopen = () => {
//       const token = localStorage.getItem('token');
//       if (!token) console.warn('[CLIENT] No token in localStorage!');
//       if (token) {
//         this.socket!.send(JSON.stringify({
//           type: 'auth',
//           payload: { token }
//         }));
//       }
//     };
//     this.socket.onmessage = (event) => {
//       const message = JSON.parse(event.data);
//       console.log('[CLIENT] WebSocket message received:', event.data);
//       this.handleMessage(message);
//     };
//     this.socket.onclose = () => {
//     console.warn('[CLIENT] WebSocket closed, retrying...');
//       setTimeout(() => this.initWebSocket(), 1000);
//     };
//     this.socket.onerror = () => {
//       console.error('[CLIENT] WebSocket error:');
//       this.socket?.close();
//     };
//   }


//   private sendMessage(action: string, payload: Record<string, any> = {}) {
//     if (this.socket && this.socket.readyState === WebSocket.OPEN) {
//       console.log('[CLIENT] Sending:', { type: 'game', payload: { action, ...payload } });
//       this.socket.send(JSON.stringify({
//         type: 'game',
//         payload: { action, ...payload },
//       }));
//     } else {
//     console.warn('[CLIENT] WebSocket not ready');
//     }
//   }

//   private handleMessage(message: any) {
//     if (message.type === 'connection')
//       this.playerId = message.clientId;
//     if (message.type === 'auth-success') {
//       console.log(`[CLIENT] Auth success, sending join with ${message.userId}`);
//       const userId = message.userId;
//       this.sendMessage('join', { userId });
//     }
//     if (message.type === 'game') {
//       const data = message.data;
//       switch (data.action) {
//         case 'playerJoined':
//           this.playerRole = data.role;
//           console.log(`🎮 You are the ${this.playerRole}`);
//           break;
//         case 'waiting':
//           console.log(data.message);
//           break;
//         case 'startGame':
//           if (this.playerRole === 'guest' && data.settings) {
//             this.settings = data.settings;
//             this.updateGameSettings();
//           }
//           this.isInitialCountdown = true;
//           const targetStartTime = data.startAt;
//           const countdownInterval = setInterval(() => {
//             const now = Date.now();
//             const timeRemaining = Math.ceil((targetStartTime - now) / 1000);
//             this.countdown = Math.max(timeRemaining, 0);

//             if (this.countdown <= 0) {
//               clearInterval(countdownInterval);
//               this.gameLoop = true;
//               this.isGameStarted = true;
//               this.isBallActive = true;
//               this.isInitialCountdown = false;
//               this.startGameLoop();
//             }
//           }, 100);
//           break;
//         case 'pause':
//           this.togglePause();
//           break;
//         case 'resetGame':
//           console.log("🔄 Received resetGame from server");
//           this.resetGame(); // Clean up guest state
//           break;
//         case 'endGame':
//           this.isGameOver = true;
//           this.winner = data.winner;
//           this.gameLoop = false;

//           if (this.animationFrameId)
//             cancelAnimationFrame(this.animationFrameId);

//           this.draw();
//           break;
//         case 'ballUpdate':
//           if (this.playerRole === 'guest') {
//             this.ball = {
//               x: data.x,
//               y: data.y,
//               dx: data.dx,
//               dy: data.dy,
//               size: data.size,
//               speed: data.speed
//             };
//           }
//           break;
//         case 'movePaddle':
//           console.log('move paddle');
//           if (data.clientId === this.playerId) return;
//           if (this.playerRole === 'host')
//             this.targetPaddle2Y = data.y;
//           else
//             this.targetPaddle1Y = data.y;
//           break;
//         case 'ballReset':
//           if (this.playerRole === 'guest') {
//             this.ball = data;
//             this.isBallActive = false;
//             this.startBallCountdown();
//           }
//           break;
//         case 'scoreUpdate':
//           if (this.playerRole === 'guest') {
//             this.score = data;
//           }
//           break;
//         default:
//           console.warn('⚠️ Unhandled game action:', data.action);
//       }
//     }
//   }
  
//   private updateGameSettings() {
//     this.paddle1.speed = this.settings.paddleSpeed;
//     this.paddle2.speed = this.settings.paddleSpeed;
//     this.ball.speed = this.settings.ballSpeed;
//     this.ball.dx = this.settings.ballSpeed;
//     this.ball.dy = this.settings.ballSpeed;
//   }

//   private initGame() {
//     if (!this.canvas || !this.ctx) return;
//     this.canvas.width = 768;
//     this.canvas.height = 432;

//     // Initialize paddle positions
//     this.paddle1.x = this.canvas.width * 0.02; // 2% from left
//     this.paddle1.y = (this.canvas.height - this.paddle1.height) / 2;
//     this.paddle2.x = this.canvas.width * 0.98 - this.paddle2.width; // 2% from right
//     this.paddle2.y = (this.canvas.height - this.paddle2.height) / 2;

//     this.targetPaddle1Y = this.paddle1.y;
//     this.targetPaddle2Y = this.paddle2.y;
//     // Initialize ball position
//     this.resetBall();

//     // Don't start game loop automatically
//     this.gameLoop = false;
//     this.isGameStarted = false;
//     this.isBallActive = false;
//     this.updateGameSettings();
//   }

//   private resetBall() {
//     if (!this.canvas) return;

//     // ✅ Only host should generate ball direction
//     if (this.playerRole !== 'host') return;

//     this.ball.x = this.canvas.width / 2;
//     this.ball.y = this.canvas.height / 2;

//     const angle = (Math.random() * 120 - 60) * (Math.PI / 180);
//     const direction = Math.random() > 0.5 ? 1 : -1;

//     this.ball.dx = Math.cos(angle) * this.settings.ballSpeed * direction;
//     this.ball.dy = Math.sin(angle) * this.settings.ballSpeed;

//     this.isBallActive = false;

//     this.sendMessage('ballReset', this.ball); // 🔄 Sync ball to guest
//     this.startBallCountdown(); // ⏱ Start countdown locally
//   }

//   private setupEventListeners() {
//     // Keyboard controls
//     window.addEventListener('keydown', (e) => this.handleKeyDown(e));
//     window.addEventListener('keyup', (e) => this.handleKeyUp(e));
//   }

//   private handleKeyDown(e: KeyboardEvent) {
//     console.log("🔑 Key pressed:", e.key, "Role:", this.playerRole);
//     // if (!this.isGameStarted || this.isGameOver || this.isPaused) return;
//     // pause
//     if (e.key.toLowerCase() === 'p' && this.isGameStarted && !this.isGameOver) {
//       this.sendMessage('pause');
//       return;
//     }
//     // start
//     if (e.key === ' ' && !this.isGameStarted && !this.isGameOver && this.playerRole === 'host') {
//       const startAt = Date.now() + 3000;
//       this.sendMessage('startGame', {
//         settings: this.settings,
//         startAt,
//       });
//       return;
//     }
//     if (e.key === ' ' && this.isGameOver && this.playerRole === 'host') {
//       this.sendMessage('resetGame');

//       // 👇 Host re-broadcasts startGame trigger
//       const startAt = Date.now() + 3000;
//       this.sendMessage('startGame', {
//         settings: this.settings,
//         startAt,
//       });

//       return;
//     }
//     if (e.key === ' ' && this.isGameOver && this.playerRole !== 'host') {
//       // ❌ Guest should not start anything on space
//       return;
//     }
//     // HOST CONTROLS PADDLE 1
//     if (this.playerRole === 'host') {
//       if (e.key.toLowerCase() === 'w') {
//         this.paddle1.dy = -this.paddle1.speed;
//       } else if (e.key.toLowerCase() === 's') {
//         this.paddle1.dy = this.paddle1.speed;
//       }
//       return;
//     }

//     // GUEST CONTROLS PADDLE 2
//     if (this.playerRole === 'guest') {
//       if (e.key === 'ArrowUp') {
//         this.paddle2.dy = -this.paddle2.speed;
//       } else if (e.key === 'ArrowDown') {
//         this.paddle2.dy = this.paddle2.speed;
//       }
//     }
//   }

//   private handleKeyUp(e: KeyboardEvent) {
//     if (this.playerRole === 'host' && (e.key.toLowerCase() === 'w' || e.key.toLowerCase() === 's'))
//       this.paddle1.dy = 0;
//     if (this.playerRole === 'guest' && (e.key === 'ArrowUp' || e.key === 'ArrowDown'))
//       this.paddle2.dy = 0;
//   }

//   // private startInitialCountdown() {
//   //   this.countdown = 3;
//   //   const countdownInterval = setInterval(() => {
//   //     this.countdown--;
//   //     if (this.countdown <= 0) {
//   //       clearInterval(countdownInterval);
//   //       this.isGameStarted = true;
//   //       this.gameLoop = true;
//   //       this.isBallActive = true;
//   //       this.isInitialCountdown = false;
//   //       this.startGameLoop();
//   //     }
//   //   }, 1000);
//   // }

//   private startBallCountdown() {
//     this.countdown = 3;
//     const countdownInterval = setInterval(() => {
//       this.countdown--;
//       if (this.countdown <= 0) {
//         clearInterval(countdownInterval);
//         this.isBallActive = true;
//       }
//     }, 1000);
//   }

//   private startGameLoop() {
//     if (!this.gameLoop || this.isPaused) {
//       console.log('🚫 Game loop blocked. gameLoop:', this.gameLoop, 'isPaused:', this.isPaused);
//       return;
//     }
//     this.updateGame();
//     this.draw();
//     this.animationFrameId = requestAnimationFrame(() => this.startGameLoop());
//   }

// private updateGame() {
//   if (!this.canvas) return;

//   // Paddle movement
//   if (this.playerRole === 'host') {
//     const prevY = this.paddle1.y;
//     this.paddle1.y += this.paddle1.dy;
//     if (prevY !== this.paddle1.y) {
//       this.sendMessage('movePaddle', { y: this.paddle1.y });
//     }
//     this.paddle2.y += (this.targetPaddle2Y - this.paddle2.y) * 0.2;
//   }
//   if (this.playerRole === 'guest') {
//     const prevY = this.paddle2.y;
//     this.paddle2.y += this.paddle2.dy;
//     if (prevY !== this.paddle2.y) {
//       this.sendMessage('movePaddle', { y: this.paddle2.y });
//     }
//     this.paddle1.y += (this.targetPaddle1Y - this.paddle1.y) * 0.2;
//   }

//   // Clamp paddle positions
//   this.paddle1.y = Math.max(0, Math.min(this.canvas.height - this.paddle1.height, this.paddle1.y));
//   this.paddle2.y = Math.max(0, Math.min(this.canvas.height - this.paddle2.height, this.paddle2.y));

//   // 🚫 Skip ball and scoring logic if inactive or game over
//   if (!this.isBallActive || this.isGameOver) return;

//   // Ball movement
//   this.ball.x += this.ball.dx;
//   this.ball.y += this.ball.dy;

//   if (this.playerRole === 'host') {
//     this.sendMessage('ballUpdate', this.ball);
//   }

//   // Ball collision with top/bottom
//   if (this.ball.y <= 0 || this.ball.y >= this.canvas.height) {
//     this.ball.dy *= -1;
//   }

//   // Ball collision with paddles
//   if (this.ball.dx < 0) {
//     if (
//       this.ball.x <= this.paddle1.x + this.paddle1.width &&
//       this.ball.x >= this.paddle1.x &&
//       this.ball.y + this.ball.size / 2 >= this.paddle1.y &&
//       this.ball.y - this.ball.size / 2 <= this.paddle1.y + this.paddle1.height
//     ) {
//       this.ball.dx *= -1;
//     }
//   } else {
//     if (
//       this.ball.x + this.ball.size >= this.paddle2.x &&
//       this.ball.x + this.ball.size <= this.paddle2.x + this.paddle2.width &&
//       this.ball.y + this.ball.size / 2 >= this.paddle2.y &&
//       this.ball.y - this.ball.size / 2 <= this.paddle2.y + this.paddle2.height
//     ) {
//       this.ball.dx *= -1;
//     }
//   }

//   // Score check (host only)
//   if (this.playerRole === 'host') {
//     if (this.ball.x <= 0) {
//       this.score.player2++;
//       if (this.score.player2 >= this.settings.endScore) {
//         this.endGame('Player 2');
//       } else {
//         this.resetBall();
//       }
//     } else if (this.ball.x >= this.canvas.width) {
//       this.score.player1++;
//       if (this.score.player1 >= this.settings.endScore) {
//         this.endGame('Player 1');
//       } else {
//         this.resetBall();
//       }
//     }
//     this.sendMessage('scoreUpdate', this.score);
//   }
// }


//   private endGame(winner: string) {
//     this.isGameOver = true;
//     this.winner = winner;
//     this.sendMessage('endGame', { winner });
//     this.gameLoop = false;
//     if (this.animationFrameId) {
//       cancelAnimationFrame(this.animationFrameId);
//     }
//   }

//   private resetGame() {
//     // Reset all game states
//     console.log("trying to reset game ...");
//     this.score = { player1: 0, player2: 0 };
//     this.isGameOver = false;
//     this.winner = '';
//     this.isGameStarted = false;
//     this.isBallActive = false;
//     this.isInitialCountdown = false;
//     this.gameLoop = false;
    
//     // Reinitialize the game
//     this.initGame();
    
//     // Draw the initial state
//     this.draw();
//   }

//   private togglePause() {
//     this.isPaused = !this.isPaused;
//     if (this.isPaused) {
//       if (this.animationFrameId) {
//         cancelAnimationFrame(this.animationFrameId);
//       }
//       this.draw();
//     } else {
//       this.startGameLoop();
//     }
//   }

//   private draw() {
//     if (!this.ctx || !this.canvas) return;

//     // Clear canvas
//     this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

//     // Draw paddles
//     this.ctx.fillStyle = this.settings.paddleColor;
//     this.ctx.fillRect(this.paddle1.x, this.paddle1.y, this.paddle1.width, this.paddle1.height);
//     this.ctx.fillRect(this.paddle2.x, this.paddle2.y, this.paddle2.width, this.paddle2.height);
    

//     // Draw ball only if game is started and ball is active
//     if (this.isGameStarted && this.isBallActive && !this.isGameOver) {
//       this.ctx.beginPath();
//       this.ctx.arc(this.ball.x, this.ball.y, this.ball.size / 2, 0, Math.PI * 2);
//       this.ctx.fillStyle = this.settings.ballColor;
//       this.ctx.fill();
//       this.ctx.closePath();
//     }
    

//     // Draw center line
//     this.ctx.beginPath();
//     this.ctx.setLineDash([5, 15]);
//     this.ctx.moveTo(this.canvas.width / 2, 0);
//     this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
//     this.ctx.strokeStyle = '#000';
//     this.ctx.stroke();
//     this.ctx.setLineDash([]);

//     // Draw messages with improved visibility
//     this.ctx.textAlign = 'center'; 
//     this.ctx.fillStyle = '#000';

//     if (this.isGameOver) {
//       this.ctx.font = 'bold 48px Arial';
//       const message = `${this.winner} Wins!`;
//       this.ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2 - 30);
//       this.ctx.font = 'bold 24px Arial';
//       this.ctx.fillText('Press SPACE to Play Again', this.canvas.width / 2, this.canvas.height / 2 + 30);
//     } else if (this.isPaused) {
//       this.ctx.font = 'bold 48px Arial';
//       this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2 - 30);
//       this.ctx.font = 'bold 24px Arial';
//       this.ctx.fillText('Press P to Resume', this.canvas.width / 2, this.canvas.height / 2 + 30);
//     } else if (!this.isGameStarted) {
//       if (this.isInitialCountdown) {
//         this.ctx.font = 'bold 72px Arial';
//         this.ctx.fillText(this.countdown.toString(), this.canvas.width / 2, this.canvas.height / 2);
//       } else {
//         this.ctx.font = 'bold 48px Arial';
//         this.ctx.fillText('Press SPACE to Start', this.canvas.width / 2, this.canvas.height / 2);
//       }
//     } else if (!this.isBallActive && this.countdown > 0) {
//       this.ctx.font = 'bold 72px Arial';
//       this.ctx.fillText(this.countdown.toString(), this.canvas.width / 2, this.canvas.height / 2);
//     }

//     // Request next frame if game is not started
//     // if (!this.isGameStarted) {
//       requestAnimationFrame(() => this.draw());
//     // }
//   }

//   // Add resize handler
//   private handleResize = () => {
//     if (this.isGameStarted) return; // Don't resize during gameplay
//     this.initGame();
//     this.draw();
//   };

//   firstUpdated() {
//     this.canvas = this.shadowRoot?.querySelector('canvas') as HTMLCanvasElement;
//     if (this.canvas) {
//       this.ctx = this.canvas.getContext('2d');
//       this.initGame();
//       this.setupEventListeners();
//       this.initWebSocket();
//       this.ball.x = this.canvas.width / 2;
//       this.ball.y = this.canvas.height / 2;
//       this.draw();
//       window.addEventListener('resize', this.handleResize);
//     }
//   }

//   private handleSettingsChanged = (e: Event) => {
//     const customEvent = e as CustomEvent<GameSettings>;
//     this.settings = customEvent.detail;
//     this.updateGameSettings();
//   };

//   render() {
//     return html`
//       <div class="game-container">
//         <div class="score-display">
//           ${this.score.player1} - ${this.score.player2}
//         </div>
//         <canvas class="responsive-canvas"></canvas>
//         <div class="controls-info">
//           Player 1: W/S keys | Player 2: ↑/↓ arrows | P to Pause
//         </div>
//       </div>
//     `;
//   }
// }



// import { SettingsService } from '../services/settings-service';
// import type { GameSettings } from '../services/settings-service';
// import { API_BASE_URL } from '../config';
// import { WebSocketService } from '../services/websocket-service'; // adapte le chemin si besoin

// class GameRemoteView extends HTMLElement {
//   private score = { player1: 0, player2: 0 };
//   private isGameStarted = false;
//   private isGameOver = false;
//   private winner = '';
//   private countdown = 0;
//   private isBallActive = false;
//   private isInitialCountdown = false;
//   private isPaused = false;

//   private canvas: HTMLCanvasElement | null = null;
//   private ctx: CanvasRenderingContext2D | null = null;
//   private animationFrameId: number = 0;
//   private gameLoop: boolean = false;

//   private settingsService: SettingsService;
//   private settings: GameSettings;
//   private playerId: string = '';
//   private userId: number = 0;
//   private websocketService: WebSocketService;

//   private socket: WebSocket | null = null;
//   private playerRole: 'host' | 'guest' | null = null;

//   private paddle1 = { x: 0, y: 0, width: 10, height: 100, speed: 5, dy: 0 };
//   private paddle2 = { x: 0, y: 0, width: 10, height: 100, speed: 5, dy: 0 };
//   private ball = { x: 0, y: 0, size: 10, speed: 5, dx: 5, dy: 5 };

//   private targetPaddle1Y = 0;
//   private targetPaddle2Y = 0;

//   constructor() {
//     super();
//     this.settingsService = SettingsService.getInstance();
//     this.settings = this.settingsService.getSettings();

//     const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
//     const wsUrl = API_BASE_URL.replace(/^https?/, wsProtocol) + '/ws';
// this.websocketService = new WebSocketService(wsUrl);



//     window.addEventListener('settingsChanged', this.handleSettingsChanged);
//   }

// private initWebSocket() {
//     console.log('[CLIENT] Initializing WebSocket...');
//     const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
//     const wsUrl = API_BASE_URL.replace(/^https?/, wsProtocol) + '/ws';
//     this.socket = new WebSocket(wsUrl);
//     console.log('[CLIENT] Connecting to WebSocket:', wsUrl);

//     this.socket.onopen = () => {
//       const token = localStorage.getItem('token');
//       if (!token) console.warn('[CLIENT] No token in localStorage!');
//       if (token) {
//         this.socket!.send(JSON.stringify({
//           type: 'auth',
//           payload: { token }
//         }));
//       }
//     };
//     this.socket.onmessage = (event) => {
//       const message = JSON.parse(event.data);
//       console.log('[CLIENT] WebSocket message received:', event.data);
//       this.handleMessage(message);
//     };
//     this.socket.onclose = () => {
//     console.warn('[CLIENT] WebSocket closed, retrying...');
//       setTimeout(() => this.initWebSocket(), 1000);
//     };
//     this.socket.onerror = () => {
//       console.error('[CLIENT] WebSocket error:');
//       this.socket?.close();
//     };
//   }


//   private sendMessage(action: string, payload: Record<string, any> = {}) {
//     if (this.socket && this.socket.readyState === WebSocket.OPEN) {
//       console.log('[CLIENT] Sending:', { type: 'game', payload: { action, ...payload } });
//       this.socket.send(JSON.stringify({
//         type: 'game',
//         payload: { action, ...payload },
//       }));
//     } else {
//     console.warn('[CLIENT] WebSocket not ready');
//     }
//   }

// private handleMessage(message: any) {
//   if (message.type === 'connection') {
//     this.playerId = message.clientId;
//   }

// if (message.type === 'auth-success') {
//   this.userId = message.userId;
//   console.log(`🧾 auth-success → userId=${this.userId}, role=${message.role}, opponentId=${message.opponentId}`);
//   // ✅ Plus de join ici, c'est déjà fait côté serveur
// }



//   if (message.type === 'game') {
//     const data = message.data;

//     switch (data.action) {
//       case 'playerJoined':
//   this.playerRole = data.role;
//   console.log(`🎮 You are the ${this.playerRole}, opponentId = ${data.opponentId}`);
//   if (this.playerRole === 'host') {
//     this.settings.player1Id = this.userId;
//     this.settings.player2Id = data.opponentId;
//   } else {
//     this.settings.player2Id = this.userId;
//     this.settings.player1Id = data.opponentId;
//   }
//   break;


//       case 'waiting':
//         console.log(data.message);
//         break;

//       case 'startGame':
//         if (this.playerRole === 'guest' && data.settings) {
//           this.settings = data.settings;
//           this.updateGameSettings();
//         }

//         this.isInitialCountdown = true;
//         const targetStartTime = data.startAt;
//         const countdownInterval = setInterval(() => {
//           const now = Date.now();
//           const timeRemaining = Math.ceil((targetStartTime - now) / 1000);
//           this.countdown = Math.max(timeRemaining, 0);
//           this.updateMessage();

//           if (this.countdown <= 0) {
//             clearInterval(countdownInterval);
//             this.gameLoop = true;
//             this.isGameStarted = true;
//             this.isBallActive = true;
//             this.isInitialCountdown = false;
//             this.hideMessage();
//             this.startGameLoop();
//           }
//         }, 100);
//         break;

//       case 'pause':
//         this.togglePause();
//         break;

//       case 'resetGame':
//         console.log('🔄 Received resetGame from server');
//         this.resetGame();
//         break;

//       case 'endGame':
//         this.isGameOver = true;
//         this.winner = data.winner;
//         this.gameLoop = false;
//         if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
//         this.updateMessage();
//         break;

//       case 'ballUpdate':
//         if (this.playerRole === 'guest') {
//           this.ball = { ...data };
//         }
//         break;

//       case 'movePaddle':
//         if (data.clientId === this.playerId) return;
//         if (this.playerRole === 'host') {
//           this.targetPaddle2Y = data.y;
//         } else {
//           this.targetPaddle1Y = data.y;
//         }
//         break;

//       case 'ballReset':
//         if (this.playerRole === 'guest') {
//           this.ball = data;
//           this.isBallActive = false;
//           this.startBallCountdown();
//         }
//         break;

//       case 'scoreUpdate':
//         if (this.playerRole === 'guest') {
//           this.score = data;
//           this.updateScore();
//         }
//         break;

//       default:
//         console.warn('⚠️ Unhandled game action:', data.action);
//     }
//   }
// }

  
//   private updateGameSettings() {
//     this.paddle1.speed = this.settings.paddleSpeed;
//     this.paddle2.speed = this.settings.paddleSpeed;
//     this.ball.speed = this.settings.ballSpeed;
//     this.ball.dx = this.settings.ballSpeed;
//     this.ball.dy = this.settings.ballSpeed;
//   }

//   private initGame() {
//     if (!this.canvas || !this.ctx) return;
//     const displayWidth = this.canvas.offsetWidth;
// const displayHeight = this.canvas.offsetHeight;

// this.canvas.width = displayWidth;
// this.canvas.height = displayHeight;


//     // Initialize paddle positions
//     this.paddle1.x = this.canvas.width * 0.02; // 2% from left
//     this.paddle1.y = (this.canvas.height - this.paddle1.height) / 2;
//     this.paddle2.x = this.canvas.width * 0.98 - this.paddle2.width; // 2% from right
//     this.paddle2.y = (this.canvas.height - this.paddle2.height) / 2;

//     this.targetPaddle1Y = this.paddle1.y;
//     this.targetPaddle2Y = this.paddle2.y;
//     // Initialize ball position
//     this.resetBall();

//     // Don't start game loop automatically
//     this.gameLoop = false;
//     this.isGameStarted = false;
//     this.isBallActive = false;
//     this.updateGameSettings();
//   }

//   private resetBall() {
//     if (!this.canvas) return;

//     // ✅ Only host should generate ball direction
//     if (this.playerRole !== 'host') return;

//     this.ball.x = this.canvas.width / 2;
//     this.ball.y = this.canvas.height / 2;

//     const angle = (Math.random() * 120 - 60) * (Math.PI / 180);
//     const direction = Math.random() > 0.5 ? 1 : -1;

//     this.ball.dx = Math.cos(angle) * this.settings.ballSpeed * direction;
//     this.ball.dy = Math.sin(angle) * this.settings.ballSpeed;

//     this.isBallActive = false;

//     this.sendMessage('ballReset', this.ball); // 🔄 Sync ball to guest
//     this.startBallCountdown(); // ⏱ Start countdown locally
//   }

//   private setupEventListeners() {
//     // Keyboard controls
//     window.addEventListener('keydown', (e) => this.handleKeyDown(e));
//     window.addEventListener('keyup', (e) => this.handleKeyUp(e));
//   }

//   private handleKeyDown(e: KeyboardEvent) {
//     console.log("🔑 Key pressed:", e.key, "Role:", this.playerRole);
//     // if (!this.isGameStarted || this.isGameOver || this.isPaused) return;
//     // pause
//     if (e.key.toLowerCase() === 'g' && this.isGameStarted && !this.isGameOver) {
//       this.sendMessage('pause');
//       return;
//     }
//     // start
//     if (e.key === 'Enter' && !this.isGameStarted && !this.isGameOver && this.playerRole === 'host') {
//       const startAt = Date.now() + 3000;
//      this.sendMessage('startGame', {
//   settings: {
//     ...this.settings,
//     player1Id: this.settings.player1Id,
//     player2Id: this.settings.player2Id
//   },
//   startAt,
// });

//       return;
//     }
//     if (e.key === 'Enter' && this.isGameOver && this.playerRole === 'host') {
//       this.sendMessage('resetGame');

//       // 👇 Host re-broadcasts startGame trigger
//       const startAt = Date.now() + 3000;
//       this.sendMessage('startGame', {
//         settings: this.settings,
//         startAt,
//       });

//       return;
//     }
//     if (e.key === 'Enter' && this.isGameOver && this.playerRole !== 'host') {
//       // ❌ Guest should not start anything on space
//       return;
//     }
//     // HOST CONTROLS PADDLE 1
//     if (this.playerRole === 'host') {
//       if (e.key.toLowerCase() === 'w') {
//         this.paddle1.dy = -this.paddle1.speed;
//       } else if (e.key.toLowerCase() === 's') {
//         this.paddle1.dy = this.paddle1.speed;
//       }
//       return;
//     }

//     // GUEST CONTROLS PADDLE 2
//     if (this.playerRole === 'guest') {
//       if (e.key === 'o') {
//         this.paddle2.dy = -this.paddle2.speed;
//       } else if (e.key === 'k') {
//         this.paddle2.dy = this.paddle2.speed;
//       }
//     }
//   }

//   private handleKeyUp(e: KeyboardEvent) {
//     if (this.playerRole === 'host' && (e.key.toLowerCase() === 'w' || e.key.toLowerCase() === 's'))
//       this.paddle1.dy = 0;
//     if (this.playerRole === 'guest' && (e.key === 'o' || e.key === 'k'))
//       this.paddle2.dy = 0;
//   }

//   private startBallCountdown() {
//     this.countdown = 3;
//     const countdownInterval = setInterval(() => {
//       this.countdown--;
//       if (this.countdown <= 0) {
//         clearInterval(countdownInterval);
//         this.isBallActive = true;
//       }
//     }, 1000);
//   }

//   private startGameLoop() {
//     if (!this.gameLoop || this.isPaused) {
//       console.log('🚫 Game loop blocked. gameLoop:', this.gameLoop, 'isPaused:', this.isPaused);
//       return;
//     }
//     this.updateGame();
//     this.draw();
//     this.animationFrameId = requestAnimationFrame(() => this.startGameLoop());
//   }

// private updateGame() {
//   if (!this.canvas) return;

//   // Paddle movement
//   if (this.playerRole === 'host') {
//     const prevY = this.paddle1.y;
//     this.paddle1.y += this.paddle1.dy;
//     if (prevY !== this.paddle1.y) {
//       this.sendMessage('movePaddle', { y: this.paddle1.y });
//     }
//     this.paddle2.y += (this.targetPaddle2Y - this.paddle2.y) * 0.2;
//   }
//   if (this.playerRole === 'guest') {
//     const prevY = this.paddle2.y;
//     this.paddle2.y += this.paddle2.dy;
//     if (prevY !== this.paddle2.y) {
//       this.sendMessage('movePaddle', { y: this.paddle2.y });
//     }
//     this.paddle1.y += (this.targetPaddle1Y - this.paddle1.y) * 0.2;
//   }

//   // Clamp paddle positions
//   this.paddle1.y = Math.max(0, Math.min(this.canvas.height - this.paddle1.height, this.paddle1.y));
//   this.paddle2.y = Math.max(0, Math.min(this.canvas.height - this.paddle2.height, this.paddle2.y));

//   // 🚫 Skip ball and scoring logic if inactive or game over
//   if (!this.isBallActive || this.isGameOver) return;

//   // Ball movement
//   this.ball.x += this.ball.dx;
//   this.ball.y += this.ball.dy;

//   if (this.playerRole === 'host') {
//     this.sendMessage('ballUpdate', this.ball);
//   }

//   // Ball collision with top/bottom
//   if (this.ball.y <= 0 || this.ball.y >= this.canvas.height) {
//     this.ball.dy *= -1;
//   }

//   // Ball collision with paddles
//   if (this.ball.dx < 0) {
//     if (
//       this.ball.x <= this.paddle1.x + this.paddle1.width &&
//       this.ball.x >= this.paddle1.x &&
//       this.ball.y + this.ball.size / 2 >= this.paddle1.y &&
//       this.ball.y - this.ball.size / 2 <= this.paddle1.y + this.paddle1.height
//     ) {
//       this.ball.dx *= -1;
//     }
//   } else {
//     if (
//       this.ball.x + this.ball.size >= this.paddle2.x &&
//       this.ball.x + this.ball.size <= this.paddle2.x + this.paddle2.width &&
//       this.ball.y + this.ball.size / 2 >= this.paddle2.y &&
//       this.ball.y - this.ball.size / 2 <= this.paddle2.y + this.paddle2.height
//     ) {
//       this.ball.dx *= -1;
//     }
//   }

//   // Score check (host only)
//   if (this.playerRole === 'host') {
//     if (this.ball.x <= 0) {
//       this.score.player2++;
//       if (this.score.player2 >= this.settings.endScore) {
//         this.endGame('Player 2');
//       } else {
//         this.resetBall();
//       }
//     } else if (this.ball.x >= this.canvas.width) {
//       this.score.player1++;
//       if (this.score.player1 >= this.settings.endScore) {
//         this.endGame('Player 1');
//       } else {
//         this.resetBall();
//       }
//     }
//     this.sendMessage('scoreUpdate', this.score);
//   }
// }

//   private async endGame(winner: string) {
//   this.isGameOver = true;
//   this.winner = winner;
//   this.gameLoop = false;

//   if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);

//   // 👇 ADD: envoyer vers le serveur qui a gagné/perdu

//   let winnerId, loserId;
//   const isPlayer1Winner = this.score.player1 > this.score.player2;

// if (isPlayer1Winner) {
//   winnerId = this.settings.player1Id;
//   loserId = this.settings.player2Id;
// } else {
//   winnerId = this.settings.player2Id;
//   loserId = this.settings.player1Id;
// }

// try {
//   const response = await fetch(`${API_BASE_URL}/remote-game`, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({
//       player1Id: this.settings.player1Id,
//       player2Id: this.settings.player2Id,
//       score1: this.score.player1,
//       score2: this.score.player2,
//       winnerId,
//     }),
//   });

//   if (!response.ok) {
//     console.error('❌ Failed to save remote game');
//   } else {
//     console.log('✅ Remote game saved');
//   }
// } catch (err) {
//   console.error('❌ Error sending remote game:', err);
// }

//   this.draw();
// }

// private resetGame() {
//   this.score = { player1: 0, player2: 0 };
//   this.isGameStarted = false;
//   this.isGameOver = false;
//   this.winner = '';
//   this.countdown = 0;
//   this.isBallActive = false;
//   this.isInitialCountdown = false;
//   this.isPaused = false;
//   this.gameLoop = false;

//   this.initGame();
//   this.draw();
// }


//   private togglePause() {
//     this.isPaused = !this.isPaused;
//     if (this.isPaused) {
//       if (this.animationFrameId) {
//         cancelAnimationFrame(this.animationFrameId);
//       }
//       this.draw();
//     } else {
//       this.startGameLoop();
//     }
//   }
//   private updateMessage() {
//   this.render();
// }

// private hideMessage() {
//   this.render();
// }

// private updateScore() {
//   this.render();
// }


// private draw() {
//   if (!this.ctx || !this.canvas) return;

//   // Efface le canvas
//   this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

//   // Dessine les raquettes
//   this.ctx.fillStyle = this.settings.paddleColor;
//   this.ctx.fillRect(this.paddle1.x, this.paddle1.y, this.paddle1.width, this.paddle1.height);
//   this.ctx.fillRect(this.paddle2.x, this.paddle2.y, this.paddle2.width, this.paddle2.height);

//   // Dessine la balle (si le jeu est en cours et actif)
//   if (this.isGameStarted && this.isBallActive && !this.isGameOver) {
//     this.ctx.beginPath();
//     this.ctx.arc(this.ball.x, this.ball.y, this.ball.size / 2, 0, Math.PI * 2);
//     this.ctx.fillStyle = this.settings.ballColor;
//     this.ctx.fill();
//     this.ctx.closePath();
//   }

//   // Ligne centrale
//   this.ctx.beginPath();
//   this.ctx.setLineDash([5, 15]);
//   this.ctx.moveTo(this.canvas.width / 2, 0);
//   this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
//   this.ctx.strokeStyle = '#000';
//   this.ctx.stroke();
//   this.ctx.setLineDash([]);

//   // Ne dessine plus de messages ici – ils seront gérés en HTML

//   // Continue la boucle si nécessaire
//   if (!this.isGameOver && this.gameLoop && !this.isPaused) {
//     requestAnimationFrame(() => this.draw());
//   }
// }


//   // Add resize handler
//   private handleResize = () => {
//     if (this.isGameStarted) return; // Don't resize during gameplay
//     this.initGame();
//     this.draw();
//   };

// connectedCallback() {
//   this.render();

//   requestAnimationFrame(() => {
//     this.canvas = this.querySelector('canvas');
//     this.ctx = this.canvas?.getContext('2d') || null;

//     this.initGame();
//     this.setupEventListeners();
//     this.initWebSocket();

//     if (this.canvas) {
//       this.ball.x = this.canvas.width / 2;
//       this.ball.y = this.canvas.height / 2;
//     }

//     this.draw();
//   });

//   window.addEventListener('resize', this.handleResize);
// }


//   private handleSettingsChanged = (e: Event) => {
//     const customEvent = e as CustomEvent<GameSettings>;
//     this.settings = customEvent.detail;
//     this.updateGameSettings();
//   };

//   private getGameMessage() {
//   if (this.isGameOver) {
//     return {
//       title: `${this.winner} Wins!`,
//       subtitle: 'Press ENTER to Play Again',
//     };
//   }

//   if (this.isPaused) {
//     return {
//       title: 'PAUSED',
//       subtitle: 'Press G to Resume',
//     };
//   }

//   if (!this.isGameStarted) {
//     if (this.isInitialCountdown) {
//       return {
//         title: this.countdown.toString(),
//       };
//     } else {
//       return {
//         title: 'Press ENTER to Start',
//       };
//     }
//   }

//   if (!this.isBallActive && this.countdown > 0) {
//     return {
//       title: this.countdown.toString(),
//     };
//   }

//   return null;
// }

// // disconnectedCallback() {
// //   window.removeEventListener('resize', this.handleResize);
// //   window.removeEventListener('settingsChanged', this.handleSettingsChanged);
// //   window.removeEventListener('keydown', this.handleKeyDown);
// //   window.removeEventListener('keyup', this.handleKeyUp);

// //   if (this.socket) this.socket.close();
// //   if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
// // }

// private render() {
//   const message = this.getGameMessage();
//   const playerName = JSON.parse(localStorage.getItem('user') || '{}')?.username || 'Player 1';

//   this.innerHTML = `
//     <div class="flex flex-col items-center justify-center w-full min-h-[calc(100vh-80px)] p-4 bg-gray-100 relative">
//       <div class="relative flex justify-center items-center w-full max-w-[1000px] mb-4">
//         <span class="absolute left-0 px-4 py-2 bg-gradient-to-r from-white via-pink-100 to-purple-200 text-slate-900 rounded-full text-sm font-semibold">
//           ${playerName}
//         </span>
//         <span id="score" class="px-8 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-full text-2xl font-bold mx-20">
//           ${this.score.player1} - ${this.score.player2}
//         </span>
//         <span class="absolute right-0 px-4 py-2 bg-gradient-to-r from-white via-pink-100 to-purple-200 text-slate-900 rounded-full text-sm font-semibold">
//           Player 2
//         </span>
//       </div>

//       <div class="relative w-4/5 max-w-[1000px] min-w-[300px] rounded-xl p-[5px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-xl">
//         <div class="bg-white rounded-xl overflow-hidden relative">
//           <canvas class="w-full h-[60vh] min-h-[200px] responsive-canvas"></canvas>

//           ${message
//             ? `
//               <div class="absolute inset-0 flex flex-col items-center justify-center bg-white/60 z-10">
//                 <div class="text-4xl sm:text-5xl font-extrabold text-slate-800">${message.title}</div>
//                 ${message.subtitle
//                   ? `<div class="text-lg sm:text-xl text-slate-700 mt-2">${message.subtitle}</div>`
//                   : ''}
//               </div>
//             `
//             : ''}
//         </div>
//       </div>

//       <div class="flex flex-wrap justify-center gap-4 mt-6">
//         <span class="px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-sm rounded-full shadow-md">
//           Player 1:
//           <span class="inline-block px-2 py-1 bg-white text-slate-900 rounded shadow-inner font-bold text-xs">W</span>
//           <span class="inline-block px-2 py-1 bg-white text-slate-900 rounded shadow-inner font-bold text-xs">S</span>
//         </span>
//         <span class="px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-sm rounded-full shadow-md">
//           Pause:
//           <span class="inline-block px-2 py-1 bg-white text-slate-900 rounded shadow-inner font-bold text-xs">G</span>
//         </span>
//         <span class="px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-sm rounded-full shadow-md">
//           Player 2:
//           <span class="inline-block px-2 py-1 bg-white text-slate-900 rounded shadow-inner font-bold text-xs">O</span>
//           <span class="inline-block px-2 py-1 bg-white text-slate-900 rounded shadow-inner font-bold text-xs">K</span>
//         </span>
//       </div>
//     </div>
//   `;

//   // Mise à jour du canvas après le changement du DOM
//   this.canvas = this.querySelector('canvas');
//   this.ctx = this.canvas?.getContext('2d') || null;
// }



// } 
