import { API_BASE_URL } from '../config';

interface GameState {
  ball: { x: number; y: number; size: number; speed: number; dx: number; dy: number };
  paddles: {player1: { x: number; y: number; width: number; height: number; speed: number };
            player2: { x: number; y: number; width: number; height: number; speed: number } };
  score: {player1: number; player2: number;};
  isGameOver: boolean;
  winner: string | null;
  endScore: number;
  waitingForStart: boolean;
  countdown: number | null;
}

class GameRemoteView extends HTMLElement{
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private socket: WebSocket | null = null;
  private keysPressed: Set<string> = new Set();
  private currentState: GameState | null = null;
  private sessionId: string = '';
  private playerId: number = 0;

  constructor() {
    super();
  }
  
  private initWebSocket(sessionId: string, playerId: string) {
    const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
    const baseUrl = API_BASE_URL.replace(/^https?/, wsProtocol) + '/ws';
    const wsUrl = `${baseUrl}?sessionId=${sessionId}&playerId=${playerId}`;

    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('🔌 WebSocket connected');

      // 👇 Send auth message right after connect
      const token = localStorage.getItem('token');
      console.log(`this.socket.onopen ${ token }`);
      if (token) {
        this.socket?.send(JSON.stringify({
          type: 'auth',
          payload: { token }
        }));
      }
    }

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };

    this.socket.onclose = () => {
      console.log('🔌 WebSocket disconnected');
    };

    this.socket.onerror = (err) => {
      console.error('WebSocket error:', err);
    };
  }

  private handleMessage(data: any) {
    if (data.type === 'state') {
      this.currentState = data.payload;
      if (this.currentState) {
        this.drawGame(this.currentState); // now it's guaranteed not null
      }
    }

    if (data.type === 'opponent_disconnected') {
      console.warn('⚠️ Opponent disconnected');
      this.drawDisconnected(data.message);
    }
  }

  private drawDisconnected(message: string) {
    if (!this.ctx) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = 'white';
    this.ctx.font = '28px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2);
  }

  sendInput(direction: 'up' | 'down' | null) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          type: 'input',
          payload: { direction },
        })
      );
    }
  }

  close() {
    this.socket?.close();
  } 

  connectedCallback() {
    const userJson = localStorage.getItem('user') || '{}';
    const user = JSON.parse(userJson);
    this.playerId = user?.id ?? 0;

    const urlParams = new URLSearchParams(window.location.search);
    this.sessionId = urlParams.get('id') || '';

    console.log(`THIS PLAYERID PLEASE : ${ this.playerId} SESSIONID : ${this.sessionId}`);

    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);

    this.render();
    this.initWebSocket(this.sessionId, String(this.playerId)); // ✅ now runs with correct values
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    this.close();
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'w' || e.key === 's') {
      this.keysPressed.add(e.key);
      this.sendDirection();
    }
    if (e.key === 'Enter') {
      this.socket?.send(JSON.stringify({
        type: 'game',
        payload: {
          action: 'start',
          playerId: this.playerId,
          sessionId: this.sessionId,
        }
      }));
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'w' || e.key === 's') {
      this.keysPressed.delete(e.key);
      this.sendDirection();
    }
  };

  private sendDirection() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    let direction: 'up' | 'down' | null = null;
    if (this.keysPressed.has('w') && !this.keysPressed.has('s')) {
      direction = 'up';
    } else if (this.keysPressed.has('s') && !this.keysPressed.has('w')) {
      direction = 'down';
    }

    console.log(`PLAYERID: ${this.playerId} || SESSIONID: ${this.sessionId}`);
    this.socket.send(JSON.stringify({
      type: 'game',
      payload: {
        action: 'input',
        direction: direction,
        playerId: this.playerId,
        sessionId: this.sessionId
      }
    }));
  }

  private render() {
    this.innerHTML = `
      <div class="flex flex-col items-center justify-center w-full min-h-[calc(100vh-80px)] p-2 relative">
        <div class="rounded-xl p-[5px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
          <div class="bg-white rounded-xl overflow-hidden">
            <canvas id="pongCanvas" width="768" height="432" class="block"></canvas>
          </div>
        </div>
      </div>
    `;

    this.canvas = this.querySelector('canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
  }

  private drawGame(state: GameState) {
    const { ball, paddles, score, isGameOver, winner, waitingForStart, countdown } = state;

    // Always clear screen and draw background first
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (isGameOver) {
      this.ctx.fillStyle = 'white';
      this.ctx.font = '36px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`🏁 ${winner} wins!`, this.canvas.width / 2, this.canvas.height / 2);
      return;
    }

    if (waitingForStart) {
      this.ctx.fillStyle = 'white';
      this.ctx.font = '28px Arial';
      this.ctx.textAlign = 'center';

      if (countdown !== null) {
        this.ctx.fillText(`${countdown}`, this.canvas.width / 2, this.canvas.height / 2);
      } else {
        this.ctx.fillText('Press Enter to Start', this.canvas.width / 2, this.canvas.height / 2);
      }
      return;
    }

    // Draw paddles
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(
      paddles.player1.x,
      paddles.player1.y,
      paddles.player1.width,
      paddles.player1.height
    );
    this.ctx.fillRect(
      paddles.player2.x,
      paddles.player2.y,
      paddles.player2.width,
      paddles.player2.height
    );

    // Draw ball
    this.ctx.fillRect(ball.x, ball.y, ball.size, ball.size);

    // Draw score
    this.ctx.font = '32px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${score.player1} : ${score.player2}`, this.canvas.width / 2, 40);
  }
}

customElements.define('game-remote-view', GameRemoteView);