
import { SettingsService } from '../services/settings-service';
import type { GameSettings } from '../services/settings-service';
import { API_BASE_URL } from '../config';
import { WebSocketService } from '../services/websocket-service'; // adapte le chemin si besoin

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
  private animationFrameId: number = 0;
  private gameLoop: boolean = false;

  private settingsService: SettingsService;
  private settings: GameSettings;
  private playerId: string = '';
  private userId: number = 0;
  private websocketService: WebSocketService;

  private socket: WebSocket | null = null;
  private playerRole: 'host' | 'guest' | null = null;

  private paddle1 = { x: 0, y: 0, width: 10, height: 100, speed: 5, dy: 0 };
  private paddle2 = { x: 0, y: 0, width: 10, height: 100, speed: 5, dy: 0 };
  private ball = { x: 0, y: 0, size: 10, speed: 5, dx: 5, dy: 5 };

  private targetPaddle1Y = 0;
  private targetPaddle2Y = 0;

  constructor() {
    super();
    this.settingsService = SettingsService.getInstance();
    this.settings = this.settingsService.getSettings();

    const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
    const wsUrl = API_BASE_URL.replace(/^https?/, wsProtocol) + '/ws';
this.websocketService = new WebSocketService(wsUrl);



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
  if (message.type === 'connection') {
    this.playerId = message.clientId;
  }

  if (message.type === 'auth-success') {
    const userId = message.userId;
    this.userId = userId;
    this.sendMessage('join', { userId });
  }

  if (message.type === 'game') {
    const data = message.data;

    switch (data.action) {
      case 'playerJoined':
        this.playerRole = data.role;
        if (this.playerRole === 'host') {
          this.settings.player1Id = this.userId;
          this.settings.player2Id = data.opponentId;
        } else {
          this.settings.player2Id = this.userId;
          this.settings.player1Id = data.opponentId;
        }
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
          this.updateMessage();

          if (this.countdown <= 0) {
            clearInterval(countdownInterval);
            this.gameLoop = true;
            this.isGameStarted = true;
            this.isBallActive = true;
            this.isInitialCountdown = false;
            this.hideMessage();
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
        this.updateMessage();
        break;

      case 'ballUpdate':
        if (this.playerRole === 'guest') {
          this.ball = { ...data };
        }
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
          this.updateScore();
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
  settings: {
    ...this.settings,
    player1Id: this.settings.player1Id,
    player2Id: this.settings.player2Id
  },
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

  private async endGame(winner: string) {
  this.isGameOver = true;
  this.winner = winner;
  this.gameLoop = false;

  if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);

  // 👇 ADD: envoyer vers le serveur qui a gagné/perdu

  let winnerId, loserId;
  const isPlayer1Winner = this.score.player1 > this.score.player2;

if (isPlayer1Winner) {
  winnerId = this.settings.player1Id;
  loserId = this.settings.player2Id;
} else {
  winnerId = this.settings.player2Id;
  loserId = this.settings.player1Id;
}

try {
  const response = await fetch(`${API_BASE_URL}/remote-game`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      player1Id: this.settings.player1Id,
      player2Id: this.settings.player2Id,
      score1: this.score.player1,
      score2: this.score.player2,
      winnerId,
    }),
  });

  if (!response.ok) {
    console.error('❌ Failed to save remote game');
  } else {
    console.log('✅ Remote game saved');
  }
} catch (err) {
  console.error('❌ Error sending remote game:', err);
}

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
  private updateMessage() {
  this.render();
}

private hideMessage() {
  this.render();
}

private updateScore() {
  this.render();
}


private draw() {
  if (!this.ctx || !this.canvas) return;

  // Efface le canvas
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

  // Dessine les raquettes
  this.ctx.fillStyle = this.settings.paddleColor;
  this.ctx.fillRect(this.paddle1.x, this.paddle1.y, this.paddle1.width, this.paddle1.height);
  this.ctx.fillRect(this.paddle2.x, this.paddle2.y, this.paddle2.width, this.paddle2.height);

  // Dessine la balle (si le jeu est en cours et actif)
  if (this.isGameStarted && this.isBallActive && !this.isGameOver) {
    this.ctx.beginPath();
    this.ctx.arc(this.ball.x, this.ball.y, this.ball.size / 2, 0, Math.PI * 2);
    this.ctx.fillStyle = this.settings.ballColor;
    this.ctx.fill();
    this.ctx.closePath();
  }

  // Ligne centrale
  this.ctx.beginPath();
  this.ctx.setLineDash([5, 15]);
  this.ctx.moveTo(this.canvas.width / 2, 0);
  this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
  this.ctx.strokeStyle = '#000';
  this.ctx.stroke();
  this.ctx.setLineDash([]);

  // Ne dessine plus de messages ici – ils seront gérés en HTML

  // Continue la boucle si nécessaire
  if (!this.isGameOver && this.gameLoop && !this.isPaused) {
    requestAnimationFrame(() => this.draw());
  }
}


  // Add resize handler
  private handleResize = () => {
    if (this.isGameStarted) return; // Don't resize during gameplay
    this.initGame();
    this.draw();
  };

connectedCallback() {
  this.render(); // ✅ Génére le HTML directement dans le composant

  this.canvas = this.querySelector('canvas');
  this.ctx = this.canvas?.getContext('2d') || null;

  this.initGame();
  this.setupEventListeners();
  this.initWebSocket();

  if (this.canvas) {
    this.ball.x = this.canvas.width / 2;
    this.ball.y = this.canvas.height / 2;
  }

  this.draw();
  window.addEventListener('resize', this.handleResize);
}

  private handleSettingsChanged = (e: Event) => {
    const customEvent = e as CustomEvent<GameSettings>;
    this.settings = customEvent.detail;
    this.updateGameSettings();
  };

  private getGameMessage() {
  if (this.isGameOver) {
    return {
      title: `${this.winner} Wins!`,
      subtitle: 'Press ENTER to Play Again',
    };
  }

  if (this.isPaused) {
    return {
      title: 'PAUSED',
      subtitle: 'Press G to Resume',
    };
  }

  if (!this.isGameStarted) {
    if (this.isInitialCountdown) {
      return {
        title: this.countdown.toString(),
      };
    } else {
      return {
        title: 'Press ENTER to Start',
      };
    }
  }

  if (!this.isBallActive && this.countdown > 0) {
    return {
      title: this.countdown.toString(),
    };
  }

  return null;
}

disconnectedCallback() {
  window.removeEventListener('resize', this.handleResize);
  window.removeEventListener('settingsChanged', this.handleSettingsChanged);
  window.removeEventListener('keydown', this.handleKeyDown);
  window.removeEventListener('keyup', this.handleKeyUp);

  if (this.socket) this.socket.close();
  if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
}

private render() {
  const message = this.getGameMessage();
  const playerName = JSON.parse(localStorage.getItem('user') || '{}')?.username || 'Player 1';

  this.innerHTML = `
    <div class="flex flex-col items-center justify-center w-full min-h-[calc(100vh-80px)] p-4 bg-gray-100 relative">
      <div class="relative flex justify-center items-center w-full max-w-[1000px] mb-4">
        <span class="absolute left-0 px-4 py-2 bg-gradient-to-r from-white via-pink-100 to-purple-200 text-slate-900 rounded-full text-sm font-semibold">
          ${playerName}
        </span>
        <span id="score" class="px-8 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-full text-2xl font-bold mx-20">
          ${this.score.player1} - ${this.score.player2}
        </span>
        <span class="absolute right-0 px-4 py-2 bg-gradient-to-r from-white via-pink-100 to-purple-200 text-slate-900 rounded-full text-sm font-semibold">
          Player 2
        </span>
      </div>

      <div class="relative w-4/5 max-w-[1000px] min-w-[300px] rounded-xl p-[5px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-xl">
        <div class="bg-white rounded-xl overflow-hidden relative">
          <canvas class="w-full h-[60vh] min-h-[200px] responsive-canvas"></canvas>

          ${message
            ? `
              <div class="absolute inset-0 flex flex-col items-center justify-center bg-white/60 z-10">
                <div class="text-4xl sm:text-5xl font-extrabold text-slate-800">${message.title}</div>
                ${message.subtitle
                  ? `<div class="text-lg sm:text-xl text-slate-700 mt-2">${message.subtitle}</div>`
                  : ''}
              </div>
            `
            : ''}
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
          <span class="inline-block px-2 py-1 bg-white text-slate-900 rounded shadow-inner font-bold text-xs">G</span>
        </span>
        <span class="px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-sm rounded-full shadow-md">
          Player 2:
          <span class="inline-block px-2 py-1 bg-white text-slate-900 rounded shadow-inner font-bold text-xs">O</span>
          <span class="inline-block px-2 py-1 bg-white text-slate-900 rounded shadow-inner font-bold text-xs">K</span>
        </span>
      </div>
    </div>
  `;

  // Mise à jour du canvas après le changement du DOM
  this.canvas = this.querySelector('canvas');
  this.ctx = this.canvas?.getContext('2d') || null;
}



} 

customElements.define('game-remote-view', GameRemoteView);