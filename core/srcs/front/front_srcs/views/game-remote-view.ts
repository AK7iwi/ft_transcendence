// remote-gamelog-view.ts
import { SettingsService } from '../services/settings-service';
import type { GameSettings } from '../services/settings-service';
import { API_BASE_URL } from '../config';

const COUNTDOWN_START = 3;
const CANVAS_ASPECT_RATIO = 16 / 9;
const PADDLE_MARGIN = 0.02;

class RemoteGamelogView extends HTMLElement {
  private score = { player1: 0, player2: 0 };
  private isGameStarted = false;
  private isGameOver = false;
  private winner = '';
  private countdown = 0;
  private isBallActive = false;
  private isInitialCountdown = false;
  private isPaused = false;

  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;

  private settingsService = SettingsService.getInstance();
  private settings: GameSettings =
    JSON.parse(JSON.stringify(this.settingsService.getSettings()));

  private paddle1 = { x: 0, y: 0, width: 10, height: 100, speed: 5 };
  private paddle2 = { x: 0, y: 0, width: 10, height: 100, speed: 5 };
  private ball = { x: 0, y: 0, size: 10, speed: 5, dx: 5, dy: 5 };

  private user: { id: number; username: string } = { id: 0, username: '' };

  // ── NOUVEAU : propriétés WebSocket & input
  private socket!: WebSocket;
  private keysPressed: Set<string> = new Set();
  private currentState: any = null;

  private sessionId = '';  // valeur à déterminer ou générer au chargement
  private playerId = 0;    // id du joueur (depuis localStorage ou autre)

  constructor() {
    super();
    window.addEventListener('resize', this.handleResize);
  }

  connectedCallback() {
    // 1) On récupère l’utilisateur (playerId)
    const userJson = localStorage.getItem('user') || '{}';
    const user = JSON.parse(userJson);
    this.playerId = user?.id || 0;

    // 2) On récupère sessionId depuis l’URL (ici “?id=…”), sinon générez à la volée
    const urlParams = new URLSearchParams(window.location.search);
    this.sessionId = urlParams.get('id') || Date.now().toString();

    // 3) On construit à l’écran + WebSocket + clavier
    this.render();
    this.initWebSocket();
    this.startKeyboardListeners();
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.close();
    }
  }

  private render() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    const playerName = this.user.username || 'Player 1';

    this.innerHTML = `
      <div class="flex flex-col items-center justify-center w-full min-h-[calc(100vh-80px)] p-2 relative">
        <div class="relative flex justify-center items-center w-full max-w-[1000px] mb-4">
          <span class="absolute left-0 px-4 py-2 bg-gradient-to-r from-white via-pink-100 to-purple-200 text-slate-900 rounded-full text-sm font-semibold">
            ${playerName}
          </span>
          <span class="px-8 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-full text-2xl font-bold mx-20" id="score">
            0 - 0
          </span>
          <span class="absolute right-0 px-4 py-2 bg-gradient-to-r from-white via-pink-100 to-purple-200 text-slate-900 rounded-full text-sm font-semibold">
            Player 2
          </span>
        </div>
        <div class="w-4/5 max-w-[1000px] min-w-[300px] rounded-xl p-[5px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
          <div class="bg-white rounded-xl overflow-hidden">
            <canvas id="remotePongCanvas" class="w-full h-[60vh] min-h-[200px]"></canvas>
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

    this.canvas = this.querySelector('#remotePongCanvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.initGameDimensions();
    this.draw();  // Premier affichage avant réception du state
  }

  private handleResize = () => {
    if (this.isGameStarted) return;
    this.initGameDimensions();
    this.draw();
  };

  private initGameDimensions() {
    const container = this.canvas.parentElement!;
    let width = container.clientWidth;
    let height = width / CANVAS_ASPECT_RATIO;
    if (height > container.clientHeight) {
      height = container.clientHeight;
      width = height * CANVAS_ASPECT_RATIO;
    }
    this.canvas.width = width;
    this.canvas.height = height;

    // Centrer verticalement les paddles
    this.paddle1.x = this.canvas.width * PADDLE_MARGIN;
    this.paddle1.y = (this.canvas.height - this.paddle1.height) / 2;
    this.paddle2.x = this.canvas.width * (1 - PADDLE_MARGIN) - this.paddle2.width;
    this.paddle2.y = (this.canvas.height - this.paddle2.height) / 2;

    this.isGameStarted = false;
    this.isBallActive = false;
    this.updateGameSettings();
  }

  private updateGameSettings() {
    this.paddle1.speed = this.settings.paddleSpeed;
    this.paddle2.speed = this.settings.paddleSpeed;
    this.ball.speed = this.settings.ballSpeed;
    this.ball.dx = this.settings.ballSpeed;
    this.ball.dy = this.settings.ballSpeed;
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // 2. INIT WEBSOCKET (auth + join + réception d’état + erreurs)
  // ──────────────────────────────────────────────────────────────────────────────
  private initWebSocket() {
    // 1) Choisir ws:// ou wss:// selon API_BASE_URL
    const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
    const baseUrl = API_BASE_URL.replace(/^https?/, wsProtocol) + '/ws';
    // 2) Optionnel : ajouter sessionId & playerId en query
    const wsUrl = `${baseUrl}?sessionId=${encodeURIComponent(this.sessionId)}&playerId=${this.playerId}`;

    this.socket = new WebSocket(wsUrl);

    // 3) onopen → envoyer “auth”
    this.socket.onopen = () => {
      console.log('🔌 WebSocket connected to', wsUrl);
      const token = localStorage.getItem('token');
      if (token) {
        this.socket.send(
          JSON.stringify({
            type: 'auth',
            payload: { token }
          })
        );
      }
    };

    // 4) onmessage → traiter auth-success, state, etc.
    this.socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      switch (msg.type) {
        case 'auth-success':
          // Auth OK : rejoindre/créer la session
          this.socket.send(
            JSON.stringify({
              type: 'game',
              payload: {
                action: 'join',      // ou "create"
                playerId: this.playerId,
                sessionId: this.sessionId
              }
            })
          );
          break;

        case 'state':
          // Réception de GameSession.state côté back
          this.currentState = msg.payload;
          this.handleServerState(msg.payload);
          break;

        case 'error':
          console.error('[WS ERROR]', msg.message);
          break;

        default:
          break;
      }
    };

    this.socket.onclose = () => {
      console.warn('🔌 WebSocket disconnected');
    };

    this.socket.onerror = (err) => {
      console.error('WebSocket error:', err);
    };
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // 3. GESTION DE L’ÉTAT REÇU (GameSession.state)
  // ──────────────────────────────────────────────────────────────────────────────
  private handleServerState(state: any) {
    // state a la structure de GameSession.state sur 768×432
    this.score.player1 = state.score.player1;
    this.score.player2 = state.score.player2;
    this.isGameOver = state.isGameOver;
    this.winner = state.winner;
    this.isInitialCountdown = state.waitingForStart && state.countdown !== null;
    this.countdown = state.countdown ?? 0;
    this.isBallActive = !state.waitingForStart && !state.isGameOver;

    // Mise à l’échelle des paddles
    this.paddle1.x = (state.paddles.player1.x / 768) * this.canvas.width;
    this.paddle1.y = (state.paddles.player1.y / 432) * this.canvas.height;
    this.paddle1.width = (state.paddles.player1.width / 768) * this.canvas.width;
    this.paddle1.height = (state.paddles.player1.height / 432) * this.canvas.height;

    this.paddle2.x = (state.paddles.player2.x / 768) * this.canvas.width;
    this.paddle2.y = (state.paddles.player2.y / 432) * this.canvas.height;
    this.paddle2.width = (state.paddles.player2.width / 768) * this.canvas.width;
    this.paddle2.height = (state.paddles.player2.height / 432) * this.canvas.height;

    // Mise à l’échelle de la balle
    this.ball.x = (state.ball.x / 768) * this.canvas.width;
    this.ball.y = (state.ball.y / 432) * this.canvas.height;
    this.ball.size = (state.ball.size / 768) * this.canvas.width;

    // Si waitingForStart passe à false → partie démarrée localement
    if (!state.waitingForStart && !this.isGameStarted) {
      this.isGameStarted = true;
    }

    // Mettre à jour le score HTML
    this.updateScoreDisplay();

    // Redessiner tout de suite
    this.draw();
  }

  private updateScoreDisplay() {
    const scoreEl = this.querySelector('#score');
    if (scoreEl) {
      scoreEl.textContent = `${this.score.player1} - ${this.score.player2}`;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // 4. DESSIN SUR LE CANVAS (identique à GamelogView, sans boucle locale)
  // ──────────────────────────────────────────────────────────────────────────────
  private draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Dessiner les deux paddles
    this.ctx.fillStyle = this.settings.paddleColor;
    this.ctx.fillRect(
      this.paddle1.x,
      this.paddle1.y,
      this.paddle1.width,
      this.paddle1.height
    );
    this.ctx.fillRect(
      this.paddle2.x,
      this.paddle2.y,
      this.paddle2.width,
      this.paddle2.height
    );

    // Dessiner la balle si active
    if (this.isGameStarted && this.isBallActive && !this.isGameOver) {
      this.ctx.beginPath();
      this.ctx.arc(
        this.ball.x,
        this.ball.y,
        this.ball.size / 2,
        0,
        Math.PI * 2
      );
      this.ctx.fillStyle = this.settings.ballColor;
      this.ctx.fill();
      this.ctx.closePath();
    }

    // Ligne centrale pointillée
    this.ctx.beginPath();
    this.ctx.setLineDash([5, 15]);
    this.ctx.moveTo(this.canvas.width / 2, 0);
    this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
    this.ctx.strokeStyle = '#000';
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // Messages texte (game over / paused / press ENTER / countdown)
    if (this.isGameOver) {
      this.drawCenteredText(`${this.winner} Wins!`, 48, this.canvas.height / 2 - 30);
      this.drawCenteredText(
        'Press ENTER to Play Again',
        24,
        this.canvas.height / 2 + 30
      );
    } else if (this.isPaused) {
      this.drawCenteredText('Paused', 48, this.canvas.height / 2 - 30);
    } else if (!this.isGameStarted) {
      this.drawCenteredText(
        this.isInitialCountdown ? this.countdown.toString() : 'Press ENTER to Start',
        this.isInitialCountdown ? 72 : 48,
        this.canvas.height / 2
      );
    } else if (!this.isBallActive && this.countdown > 0) {
      this.drawCenteredText(this.countdown.toString(), 72, this.canvas.height / 2);
    }

    // Tant que la partie n’est pas démarrée localement on boucle draw()
    if (!this.isGameStarted) {
      requestAnimationFrame(() => this.draw());
    }
    // Sinon, on ne boucle plus : on attend les prochains “state” du serveur
  }

  private drawCenteredText(text: string, size: number, y: number) {
    this.ctx.font = `bold ${size}px Arial`;
    this.ctx.fillStyle = '#000';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(text, this.canvas.width / 2, y);
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // 5. CLAVIER : Enter pour “start”/“restart”, G pour pause, W/S/O/K pour “input”
  // ──────────────────────────────────────────────────────────────────────────────
  private handleKeyDown = (e: KeyboardEvent) => {
    // 1) Touche ENTER
    if (e.key === 'Enter') {
      if (e.repeat || this.isInitialCountdown) return;

      if (this.isGameOver) {
        // Partie terminée → envoi “restart”
        this.resetGame();
        return;
      }

      // Si la partie n’a pas démarré → envoi “start”
      if (!this.isGameStarted) {
        this.isInitialCountdown = true;
        this.socket.send(
          JSON.stringify({
            type: 'game',
            payload: {
              action: 'start',
              playerId: this.playerId,
              sessionId: this.sessionId
            }
          })
        );
      }
      return;
    }

    // 2) Touche G (Pause)
    if (e.key.toLowerCase() === 'g' && this.isGameStarted && !this.isGameOver) {
      this.isPaused = !this.isPaused;
      this.draw(); // redessine pour afficher / masquer “Paused”
      return;
    }

    // 3) Touche W/S/O/K = “input”
    const key = e.key.toLowerCase();
    if (key === 'w' || key === 's' || key === 'o' || key === 'k') {
      this.keysPressed.add(key);
      this.sendDirection();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    if (key === 'w' || key === 's' || key === 'o' || key === 'k') {
      this.keysPressed.delete(key);
      this.sendDirection();
    }
  };

  private startKeyboardListeners() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  private sendDirection() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    let direction: 'up' | 'down' | null = null;
    if (this.keysPressed.has('w') && !this.keysPressed.has('s')) {
      direction = 'up';
    } else if (this.keysPressed.has('s') && !this.keysPressed.has('w')) {
      direction = 'down';
    } else if (this.keysPressed.has('o') && !this.keysPressed.has('k')) {
      direction = 'up';
    } else if (this.keysPressed.has('k') && !this.keysPressed.has('o')) {
      direction = 'down';
    }

    this.socket.send(
      JSON.stringify({
        type: 'game',
        payload: {
          action: 'input',
          direction,
          playerId: this.playerId,
          sessionId: this.sessionId
        }
      })
    );
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // 6. RÉINITIALISER LA PARTIE (après “game over”)
  // ──────────────────────────────────────────────────────────────────────────────
  private resetGame() {
    this.score = { player1: 0, player2: 0 };
    this.isGameOver = false;
    this.winner = '';
    this.isGameStarted = false;
    this.isBallActive = false;
    this.isInitialCountdown = false;

    // On envoie “restart” au serveur
    this.socket.send(
      JSON.stringify({
        type: 'game',
        payload: {
          action: 'restart',
          playerId: this.playerId,
          sessionId: this.sessionId
        }
      })
    );

    // On réinitialise l’affichage
    this.initGameDimensions();
    this.updateScoreDisplay();
    this.draw();
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // 7. Méthode start (vide, tout est déjà déclenché dans connectedCallback)
  // ──────────────────────────────────────────────────────────────────────────────
  public start() {
    // Rien à faire ici, clavier et WebSocket sont déjà en place en connectedCallback
  }
}

customElements.define('remote-gamelog-view', RemoteGamelogView);




//MAT
// import { API_BASE_URL } from '../config';

// interface GameState {
//   ball: { x: number; y: number; size: number; speed: number; dx: number; dy: number };
//   paddles: {player1: { x: number; y: number; width: number; height: number; speed: number };
//             player2: { x: number; y: number; width: number; height: number; speed: number } };
//   score: {player1: number; player2: number;};
//   isGameOver: boolean;
//   winner: string | null;
//   endScore: number;
//   waitingForStart: boolean;
//   countdown: number | null;
// }

// class GameRemoteView extends HTMLElement{
//   private canvas!: HTMLCanvasElement;
//   private ctx!: CanvasRenderingContext2D;
//   private socket: WebSocket | null = null;
//   private keysPressed: Set<string> = new Set();
//   private currentState: GameState | null = null;
//   private sessionId: string = '';
//   private playerId: number = 0;

//   constructor() {
//     super();
//   }
  
//   private initWebSocket(sessionId: string, playerId: string) {
//     const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
//     const baseUrl = API_BASE_URL.replace(/^https?/, wsProtocol) + '/ws';
//     const wsUrl = `${baseUrl}?sessionId=${sessionId}&playerId=${playerId}`;

//     this.socket = new WebSocket(wsUrl);

//     this.socket.onopen = () => {
//       console.log('🔌 WebSocket connected');

//       // 👇 Send auth message right after connect
//       const token = localStorage.getItem('token');
//       console.log(`this.socket.onopen ${ token }`);
//       if (token) {
//         this.socket?.send(JSON.stringify({
//           type: 'auth',
//           payload: { token }
//         }));
//       }
//     }

//     this.socket.onmessage = (event) => {
//       const data = JSON.parse(event.data);
//       this.handleMessage(data);
//     };

//     this.socket.onclose = () => {
//       console.log('🔌 WebSocket disconnected');
//     };

//     this.socket.onerror = (err) => {
//       console.error('WebSocket error:', err);
//     };
//   }

//   private handleMessage(data: any) {
//     if (data.type === 'state') {
//       this.currentState = data.payload;
//       if (this.currentState) {
//         this.drawGame(this.currentState); // now it's guaranteed not null
//       }
//     }

//     if (data.type === 'opponent_disconnected') {
//       console.warn('⚠️ Opponent disconnected');
//       this.drawDisconnected();
//     }
//   }

//   private drawDisconnected() {
//     if (!this.ctx) return;
//     this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
//     this.ctx.fillStyle = 'black';
//     this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
//     this.ctx.fillStyle = 'white';
//     this.ctx.font = '24px Arial';
//     this.ctx.fillText('⚠️ Opponent disconnected', this.canvas.width / 2, this.canvas.height / 2);
//   }

//   sendInput(direction: 'up' | 'down' | null) {
//     if (this.socket?.readyState === WebSocket.OPEN) {
//       this.socket.send(
//         JSON.stringify({
//           type: 'input',
//           payload: { direction },
//         })
//       );
//     }
//   }

//   close() {
//     this.socket?.close();
//   } 

//   connectedCallback() {
//     const userJson = localStorage.getItem('user') || '{}';
//     const user = JSON.parse(userJson);
//     this.playerId = user?.id ?? 0;

//     const urlParams = new URLSearchParams(window.location.search);
//     this.sessionId = urlParams.get('id') || '';

//     console.log(`THIS PLAYERID PLEASE : ${ this.playerId} SESSIONID : ${this.sessionId}`);

//     document.addEventListener('keydown', this.handleKeyDown);
//     document.addEventListener('keyup', this.handleKeyUp);

//     this.render();
//     this.initWebSocket(this.sessionId, String(this.playerId)); // ✅ now runs with correct values
//   }

//   disconnectedCallback() {
//     document.removeEventListener('keydown', this.handleKeyDown);
//     document.removeEventListener('keyup', this.handleKeyUp);
//     this.close();
//   }

//   private handleKeyDown = (e: KeyboardEvent) => {
//     if (e.key === 'w' || e.key === 's') {
//       this.keysPressed.add(e.key);
//       this.sendDirection();
//     }
//     if (e.key === 'Enter') {
//       this.socket?.send(JSON.stringify({
//         type: 'game',
//         payload: {
//           action: 'start',
//           playerId: this.playerId,
//           sessionId: this.sessionId,
//         }
//       }));
//     }
//   };

//   private handleKeyUp = (e: KeyboardEvent) => {
//     if (e.key === 'w' || e.key === 's') {
//       this.keysPressed.delete(e.key);
//       this.sendDirection();
//     }
//   };

//   private sendDirection() {
//     if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

//     let direction: 'up' | 'down' | null = null;
//     if (this.keysPressed.has('w') && !this.keysPressed.has('s')) {
//       direction = 'up';
//     } else if (this.keysPressed.has('s') && !this.keysPressed.has('w')) {
//       direction = 'down';
//     }

//     console.log(`PLAYERID: ${this.playerId} || SESSIONID: ${this.sessionId}`);
//     this.socket.send(JSON.stringify({
//       type: 'game',
//       payload: {
//         action: 'input',
//         direction: direction,
//         playerId: this.playerId,
//         sessionId: this.sessionId
//       }
//     }));
//   }

//   private render() {
//     this.innerHTML = `
//       <div class="flex flex-col items-center justify-center w-full min-h-[calc(100vh-80px)] p-2 relative">
//         <div class="rounded-xl p-[5px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
//           <div class="bg-white rounded-xl overflow-hidden">
//             <canvas id="pongCanvas" width="768" height="432" class="block"></canvas>
//           </div>
//         </div>
//       </div>
//     `;

//     this.canvas = this.querySelector('canvas') as HTMLCanvasElement;
//     this.ctx = this.canvas.getContext('2d')!;
//   }

//   private drawGame(state: GameState) {
//     const { ball, paddles, score, isGameOver, winner, waitingForStart, countdown } = state;

//     // Always clear screen and draw background first
//     this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
//     this.ctx.fillStyle = 'black';
//     this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

//     if (isGameOver) {
//       this.ctx.fillStyle = 'white';
//       this.ctx.font = '36px Arial';
//       this.ctx.textAlign = 'center';
//       this.ctx.fillText(`🏁 ${winner} wins!`, this.canvas.width / 2, this.canvas.height / 2);
//       return;
//     }

//     if (waitingForStart) {
//       this.ctx.fillStyle = 'white';
//       this.ctx.font = '28px Arial';
//       this.ctx.textAlign = 'center';

//       if (countdown !== null) {
//         this.ctx.fillText(`${countdown}`, this.canvas.width / 2, this.canvas.height / 2);
//       } else {
//         this.ctx.fillText('Press Enter to Start', this.canvas.width / 2, this.canvas.height / 2);
//       }
//       return;
//     }

//     // Draw paddles
//     this.ctx.fillStyle = 'white';
//     this.ctx.fillRect(
//       paddles.player1.x,
//       paddles.player1.y,
//       paddles.player1.width,
//       paddles.player1.height
//     );
//     this.ctx.fillRect(
//       paddles.player2.x,
//       paddles.player2.y,
//       paddles.player2.width,
//       paddles.player2.height
//     );

//     // Draw ball
//     this.ctx.fillRect(ball.x, ball.y, ball.size, ball.size);

//     // Draw score
//     this.ctx.font = '32px Arial';
//     this.ctx.textAlign = 'center';
//     this.ctx.fillText(`${score.player1} : ${score.player2}`, this.canvas.width / 2, 40);
//   }
// }

// customElements.define('game-remote-view', GameRemoteView);































// import { SettingsService } from '../services/settings-service';
// import type { GameSettings } from '../services/settings-service';

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
//   private animationFrameId = 0;
//   private gameLoop = false;

//   private settingsService = SettingsService.getInstance();
//   private settings: GameSettings = this.settingsService.getSettings();

//   private playerId = '';
//   private userId = 0;
//   private playerRole: 'host' | 'guest' | null = null;
//   private socket: WebSocket | null = null;
//   private opponentId: number | null = null; 

//   private paddle1 = { x: 0, y: 0, width: 10, height: 100, speed: 5, dy: 0 };
//   private paddle2 = { x: 0, y: 0, width: 10, height: 100, speed: 5, dy: 0 };
//   private ball = { x: 0, y: 0, size: 10, speed: 5, dx: 5, dy: 5 };

//   private targetPaddle1Y = 0;
//   private targetPaddle2Y = 0;

//   constructor() {
//     super();
//     window.addEventListener('settingsChanged', this.handleSettingsChanged);
//   }

//   connectedCallback() {
//     this.render();
//     // 1. Hook canvas / WS / events existants
//     this.canvas = this.querySelector('canvas');
//     this.ctx    = this.canvas?.getContext('2d') || null;
//     this.initGame();
//     this.setupEventListeners();
//     this.initWebSocket();
//     this.draw();
//     // 2. Leave game button
//     this.querySelector('#leaveButton')!
//         .addEventListener('click', this.handleLeaveGame);
//     window.addEventListener('resize', this.handleResize);
//   }


//   disconnectedCallback() {
//     window.removeEventListener('resize', this.handleResize);
//     window.removeEventListener('settingsChanged', this.handleSettingsChanged);
//     window.removeEventListener('keydown', this.handleKeyDown);
//     window.removeEventListener('keyup', this.handleKeyUp);
//     this.socket?.close();
//     cancelAnimationFrame(this.animationFrameId);
//   }

//     private handleLeaveGame = () => {
//       this.socket?.close();
//     this.sendMessage('leaveGame', { userId: this.userId });
//     // 3) reset de l’UI
//     this.playerRole    = null;
//     this.resetGame();
//     // optionnel : redirection vers le chat
//      window.location.href = '/chat';
//   };

//   private render() {
//     this.innerHTML = `
//       <div class="flex flex-col items-center justify-center w-full min-h-[calc(100vh-80px)] p-4 bg-gray-100 relative">
//       <!-- Bouton Leave -->
//       <button
//         id="leaveButton"
//         class="absolute top-4 right-4 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-full text-sm font-semibold shadow"
//       >
//         Leave Game
//       </button>  
//       <div class="relative flex justify-center items-center w-full max-w-[1000px] mb-4">
//           <span class="absolute left-0 px-4 py-2 bg-gradient-to-r from-white via-pink-100 to-purple-200 text-slate-900 rounded-full text-sm font-semibold">
//             Player 1
//           </span>
//           <span id="score" class="px-8 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-full text-2xl font-bold mx-20">
//             0 - 0
//           </span>
//           <span class="absolute right-0 px-4 py-2 bg-gradient-to-r from-white via-pink-100 to-purple-200 text-slate-900 rounded-full text-sm font-semibold">
//             Player 2
//           </span>
//         </div>
//         <div class="relative w-4/5 max-w-[1000px] min-w-[300px] rounded-xl p-[5px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-xl">
//           <div class="bg-white rounded-xl overflow-hidden relative">
//             <canvas class="w-full h-[60vh] min-h-[200px] responsive-canvas border-2 border-indigo-600"></canvas>
//           </div>
//         </div>
//         <div class="flex flex-wrap justify-center gap-4 mt-6">
//           <span class="px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-sm rounded-full shadow-md">
//             Player 1:
//             <span class="inline-block px-2 py-1 bg-white text-slate-900 rounded shadow-inner font-bold text-xs">W</span>
//             <span class="inline-block px-2 py-1 bg-white text-slate-900 rounded shadow-inner font-bold text-xs">S</span>
//           </span>
//           <span class="px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-sm rounded-full shadow-md">
//             Pause:
//             <span class="inline-block px-2 py-1 bg-white text-slate-900 rounded shadow-inner font-bold text-xs">P</span>
//           </span>
//           <span class="px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-sm rounded-full shadow-md">
//             Player 2:
//             <span class="inline-block px-2 py-1 bg-white text-slate-900 rounded shadow-inner font-bold text-xs">O</span>
//             <span class="inline-block px-2 py-1 bg-white text-slate-900 rounded shadow-inner font-bold text-xs">K</span>
//           </span>
//         </div>
//       </div>
      
//     `;
//   }

//   private updateScoreDisplay() {
//     const scoreEl = this.querySelector('#score');
//     if (scoreEl) {
//       scoreEl.textContent = `${this.score.player1} - ${this.score.player2}`;
//     }
//   }

//   private handleSettingsChanged = (e: Event) => {
//     const customEvent = e as CustomEvent<GameSettings>;
//     this.settings = customEvent.detail;
//     this.updateGameSettings();
//   };

//   private handleResize = () => {
//     if (this.isGameStarted) return; // éviter glitch en plein jeu
//     this.initGame();
//     this.draw();
//   };

//   private setupEventListeners() {
//     window.addEventListener('keydown', this.handleKeyDown);
//     window.addEventListener('keyup', this.handleKeyUp);
//   }

//   private handleKeyDown = (e: KeyboardEvent) => {
//     console.log('🔑 Key pressed:', e.key, 'Role:', this.playerRole);
//     if (e.key.toLowerCase() === 'p' && this.isGameStarted && !this.isGameOver) {
//       this.sendMessage('pause');
//       return;
//     }
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
//       const startAt = Date.now() + 3000;
//       this.sendMessage('startGame', {
//         settings: this.settings,
//         startAt,
//       });
//       return;
//     }
//     if (e.key === ' ' && this.isGameOver && this.playerRole !== 'host') {
//       return;
//     }
//     if (this.playerRole === 'host') {
//       if (e.key.toLowerCase() === 'w') this.paddle1.dy = -this.paddle1.speed;
//       else if (e.key.toLowerCase() === 's') this.paddle1.dy = this.paddle1.speed;
//       return;
//     }
//     if (this.playerRole === 'guest') {
//       if (e.key === 'o') this.paddle2.dy = -this.paddle2.speed;
//       else if (e.key === 'k') this.paddle2.dy = this.paddle2.speed;
//     }
//   };

//   private handleKeyUp = (e: KeyboardEvent) => {
//     if (this.playerRole === 'host' && (e.key.toLowerCase() === 'w' || e.key.toLowerCase() === 's'))
//       this.paddle1.dy = 0;
//     if (this.playerRole === 'guest' && (e.key === 'o' || e.key === 'k'))
//       this.paddle2.dy = 0;
//   };

  // private initWebSocket() {
  //   const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
  //   const wsUrl = API_BASE_URL.replace(/^https?/, wsProtocol) + '/ws';
  //   this.socket = new WebSocket(wsUrl);

  //   this.socket.onopen = () => {
  //     const token = localStorage.getItem('token');
  //     if (token) {
  //       this.socket!.send(
  //         JSON.stringify({ type: 'auth', payload: { token } }),
  //       );
  //     } else {
  //       console.warn('[CLIENT] No token in localStorage!');
  //     }
  //   };

  //   this.socket.onmessage = (event) => {
  //     const message = JSON.parse(event.data);
  //     console.log('[CLIENT] WebSocket message received:', message);
  //     this.handleMessage(message);
  //   };

  //   this.socket.onclose = () => {
  //     console.warn('[CLIENT] WebSocket closed, retrying...');
  //     setTimeout(() => this.initWebSocket(), 1000);
  //   };

  //   this.socket.onerror = () => {
  //     console.error('[CLIENT] WebSocket error');
  //     this.socket?.close();
  //   };
  // }

//   private sendMessage(action: string, payload: Record<string, any> = {}) {
//     if (this.socket && this.socket.readyState === WebSocket.OPEN) {
//       this.socket.send(
//         JSON.stringify({ type: 'game', payload: { action, ...payload } }),
//       );
//     } else {
//       console.warn('[CLIENT] WebSocket not ready');
//     }
//   }

// private handleMessage(message: any) {
//   // 1) Connexion / auth
//   if (message.type === 'connection') {
//     this.playerId = message.clientId;
//     return;
//   }

//   if (message.type === 'auth-success') {
//     this.userId       = message.userId;
//     this.playerRole   = message.role;
//     this.opponentId   = message.opponentId;
//     console.log(`🎮 You are the ${this.playerRole}, opponent is ${this.opponentId}`);

//     // Récupère gameId depuis l’URL et join une seule fois
//     const params = new URLSearchParams(window.location.search);
//     const gameId = params.get('id')!;
//     this.sendMessage('join', { userId: this.userId, gameId });
//     return;
//   }

//   // 2) Messages de jeu
//   if (message.type === 'game') {
//     const data = message.data;
//     switch (data.action) {
//       case 'playerJoined':
//         this.playerRole = data.role;
//         this.opponentId = data.opponentId;
//         console.log(`🎮 You are the ${this.playerRole}`);
//         break;
//         case 'playerLeft':
//   console.log('🔔 Opponent has left the game');
//   // on vide le rôle pour qu’il ne reste plus d’host/guest
//   this.playerRole   = null;
//   // on reset toute la partie
//   this.resetGame();
//   break;

//       case 'startGame':
//         // synchronise la première balle si host
//         if (this.playerRole === 'host') {
//           this.resetBall();
//         }

//         if (this.playerRole === 'guest' && data.settings) {
//           this.settings = data.settings;
//           this.updateGameSettings();
//         }

//         this.isInitialCountdown = true;
//         {
//           const startAt = data.startAt;
//           const interval = setInterval(() => {
//             const remaining = Math.max(Math.ceil((startAt - Date.now()) / 1000), 0);
//             this.countdown = remaining;
//             if (remaining === 0) {
//               clearInterval(interval);
//               this.isGameStarted    = true;
//               this.gameLoop         = true;
//               this.isBallActive     = true;
//               this.isInitialCountdown = false;
//               this.startGameLoop();
//             }
//           }, 100);
//         }
//         break;

//       case 'pause':
//         this.togglePause();
//         break;

//       case 'resetGame':
//         console.log('🔄 Received resetGame from server');
//         this.resetGame();
//         // on ré-join pour réinitialiser la room
//         this.sendMessage('join', {
//           userId: this.userId,
//           gameId: new URLSearchParams(window.location.search).get('id')!
//         });
//         break;

//       case 'endGame':
//         this.isGameOver = true;
//         this.winner     = data.winner;
//         this.gameLoop   = false;
//         if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
//         this.draw();
//         break;

//       case 'ballUpdate':
//         if (this.playerRole === 'guest') {
//           this.ball = { ...data };
//         }
//         break;

//       case 'movePaddle':
//         if (data.clientId !== this.playerId) {
//           if (this.playerRole === 'host') {
//             this.targetPaddle2Y = data.y;
//           } else {
//             this.targetPaddle1Y = data.y;
//           }
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
//           this.updateScoreDisplay();
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

//     const container = this.canvas.parentElement!;
//     let width = container.clientWidth;
//     let height = width / (16 / 9);

//     if (height > container.clientHeight) {
//       height = container.clientHeight;
//       width = height * (16 / 9);
//     }

//     this.canvas.width = width;
//     this.canvas.height = height;

//     this.paddle1.x = this.canvas.width * 0.02;
//     this.paddle1.y = (this.canvas.height - this.paddle1.height) / 2;

//     this.paddle2.x = this.canvas.width * 0.98 - this.paddle2.width;
//     this.paddle2.y = (this.canvas.height - this.paddle2.height) / 2;

//     this.targetPaddle1Y = this.paddle1.y;
//     this.targetPaddle2Y = this.paddle2.y;

//     this.resetBall();

//     this.gameLoop = false;
//     this.isGameStarted = false;
//     this.isBallActive = false;

//     this.updateGameSettings();
//   }

//   private resetBall() {
//     if (!this.canvas) return;
//     if (this.playerRole !== 'host') return;

//     this.ball.x = this.canvas.width / 2;
//     this.ball.y = this.canvas.height / 2;

//     const angle = (Math.random() * 120 - 60) * (Math.PI / 180);
//     const direction = Math.random() > 0.5 ? 1 : -1;

//     this.ball.dx = Math.cos(angle) * this.settings.ballSpeed * direction;
//     this.ball.dy = Math.sin(angle) * this.settings.ballSpeed;

//     this.isBallActive = false;

//     this.sendMessage('ballReset', this.ball);
//     this.startBallCountdown();
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

// private startGameLoop = () => {
//   if (!this.gameLoop || this.isPaused) {
//     console.log('🚫 Game loop blocked.', this.gameLoop, this.isPaused);
//     return;
//   }
//   this.updateGame();
//   this.draw();
//   this.animationFrameId = requestAnimationFrame(this.startGameLoop);
// };

//   private endGame = (winner: string) => {
//     this.isGameOver = true;
//     this.winner = winner;
//     this.gameLoop = false;
//     if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
//     this.sendMessage('endGame', { winner });
//   };
  
//  private updateGame = () => {
//     if (!this.canvas) return;
// console.log('updateGame this.endGame =', this.endGame);

//     if (this.playerRole === 'host') {
//       const prevY = this.paddle1.y;
//       this.paddle1.y += this.paddle1.dy;
//       if (prevY !== this.paddle1.y) {
//         this.sendMessage('movePaddle', { y: this.paddle1.y });
//       }
//       this.paddle2.y += (this.targetPaddle2Y - this.paddle2.y) * 0.2;
//     }
//     if (this.playerRole === 'guest') {
//       const prevY = this.paddle2.y;
//       this.paddle2.y += this.paddle2.dy;
//       if (prevY !== this.paddle2.y) {
//         this.sendMessage('movePaddle', { y: this.paddle2.y });
//       }
//       this.paddle1.y += (this.targetPaddle1Y - this.paddle1.y) * 0.2;
//     }

//     this.paddle1.y = Math.max(0, Math.min(this.canvas.height - this.paddle1.height, this.paddle1.y));
//     this.paddle2.y = Math.max(0, Math.min(this.canvas.height - this.paddle2.height, this.paddle2.y));

//     if (!this.isBallActive || this.isGameOver) return;

//     this.ball.x += this.ball.dx;
//     this.ball.y += this.ball.dy;

//     if (this.ball.y <= 0 || this.ball.y >= this.canvas.height) {
//       this.ball.dy *= -1;
//     }

//     const ballHitsPaddle = (p: any) =>
//       this.ball.y + this.ball.size / 2 >= p.y &&
//       this.ball.y - this.ball.size / 2 <= p.y + p.height;

//     if (
//       this.ball.dx < 0 &&
//       this.ball.x <= this.paddle1.x + this.paddle1.width &&
//       this.ball.x >= this.paddle1.x &&
//       ballHitsPaddle(this.paddle1)
//     ) {
//       this.ball.dx *= -1;
//     } else if (
//       this.ball.dx > 0 &&
//       this.ball.x + this.ball.size >= this.paddle2.x &&
//       this.ball.x + this.ball.size <= this.paddle2.x + this.paddle2.width &&
//       ballHitsPaddle(this.paddle2)
//     ) {
//       this.ball.dx *= -1;
//     }

//     if (this.playerRole === 'host') {
//       if (this.ball.x <= 0) {
//         this.score.player2++;
//         if (this.score.player2 >= this.settings.endScore) this.endGame('Player 2');
//         else this.resetBall();
//         this.updateScoreDisplay();
//       } else if (this.ball.x >= this.canvas.width) {
//         this.score.player1++;
//         if (this.score.player1 >= this.settings.endScore) this.endGame('Player 1');
//         else this.resetBall();
//         this.updateScoreDisplay();
//       }
//       this.sendMessage('scoreUpdate', this.score);
//     }
//   }

// private resetGame = () => {
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
// };


//   private draw() {
//     if (!this.ctx || !this.canvas) return;

//     this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

//     this.ctx.fillStyle = this.settings.paddleColor;
//     this.ctx.fillRect(this.paddle1.x, this.paddle1.y, this.paddle1.width, this.paddle1.height);
//     this.ctx.fillRect(this.paddle2.x, this.paddle2.y, this.paddle2.width, this.paddle2.height);

//     if (this.isGameStarted && this.isBallActive && !this.isGameOver) {
//       this.ctx.beginPath();
//       this.ctx.arc(this.ball.x, this.ball.y, this.ball.size / 2, 0, Math.PI * 2);
//       this.ctx.fillStyle = this.settings.ballColor;
//       this.ctx.fill();
//       this.ctx.closePath();
//     }

//     this.ctx.beginPath();
//     this.ctx.setLineDash([5, 15]);
//     this.ctx.moveTo(this.canvas.width / 2, 0);
//     this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
//     this.ctx.strokeStyle = '#000';
//     this.ctx.stroke();
//     this.ctx.setLineDash([]);

//     this.ctx.textAlign = 'center';
//     this.ctx.fillStyle = '#000';

//     if (this.isGameOver) {
//       this.ctx.font = 'bold 48px Arial';
//       this.ctx.fillText(`${this.winner} Wins!`, this.canvas.width / 2, this.canvas.height / 2 - 30);
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

//     if (!this.isGameStarted) {
//       requestAnimationFrame(() => this.draw());
//     }
//   }
// }

// customElements.define('game-remote-view', GameRemoteView);