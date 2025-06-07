import { SettingsService } from '../services/settings-service';
import type { GameSettings } from '../services/settings-service';

const COUNTDOWN_START = 3;
const CANVAS_ASPECT_RATIO = 16 / 9;
const PADDLE_MARGIN = 0.02;

class GamelogView extends HTMLElement {
  private score = { player1: 0, player2: 0 };
  private isGameStarted = false;
  private isGameOver = false;
  private winner = '';
  private countdown = 0;
  private isBallActive = false;
  private isInitialCountdown = false;
  private isPaused = false;

  private keysPressed: Record<string, boolean> = {};
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private animationFrameId = 0;
  private gameLoop = false;
  private settingsService = SettingsService.getInstance();
  private settings: GameSettings = JSON.parse(
    JSON.stringify(this.settingsService.getSettings())
  );
  private initialCountdownTimer: number | null = null;
  private ballCountdownTimer: number | null = null;

  private paddle1 = { x: 0, y: 0, width: 10, height: 100, speed: 5 };
  private paddle2 = { x: 0, y: 0, width: 10, height: 100, speed: 5 };
  private ball = { x: 0, y: 0, size: 10, speed: 5, dx: 5, dy: 5 };

  private user: { id: number; username: string } = { id: 0, username: '' };

  constructor() {
    super();
    window.addEventListener('resize', this.handleResize);
  }

  connectedCallback() {
    this.render();
  }

  disconnectedCallback() {
    // On ne réinitialise le score qu’au "Play Again", pas lors du disconnect du composant
    this.isGameStarted = false;
    this.isGameOver = false;
    this.isBallActive = false;

    if (this.initialCountdownTimer !== null) {
      clearInterval(this.initialCountdownTimer);
      this.initialCountdownTimer = null;
    }
    if (this.ballCountdownTimer !== null) {
      clearInterval(this.ballCountdownTimer);
      this.ballCountdownTimer = null;
    }

    cancelAnimationFrame(this.animationFrameId);
  }

  private render() {
    // Récupération de l’utilisateur pour afficher son pseudo
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    const playerName = this.user.username || 'Player 1';

    this.innerHTML = `
      <div class="flex flex-col items-center justify-center w-full min-h-[calc(100vh-80px)] p-2 relative">
        <div class="relative flex justify-center items-center w-full max-w-[1000px] mb-4">
          <span
            class="absolute left-0 px-4 py-2 bg-gradient-to-r from-white via-pink-100 to-purple-200
                   text-slate-900 rounded-full text-sm font-semibold"
          >
            ${playerName}
          </span>
          <!-- Affichage dynamique du score via this.score -->
          <span
            class="px-8 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500
                   text-white rounded-full text-2xl font-bold mx-20"
            id="score"
          >
            ${this.score.player1} - ${this.score.player2}
          </span>
          <span
            class="absolute right-0 px-4 py-2 bg-gradient-to-r from-white via-pink-100 to-purple-200
                   text-slate-900 rounded-full text-sm font-semibold"
          >
            Player 2
          </span>
        </div>

        <div class="w-4/5 max-w-[1000px] min-w-[300px] rounded-xl p-[5px]
                    bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
          <div class="bg-white rounded-xl overflow-hidden">
            <canvas id="pongCanvas" class="w-full h-[60vh] min-h-[200px]"></canvas>
          </div>
        </div>

        <div class="flex flex-wrap justify-center gap-4 mt-6">
          <span class="px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 
                       text-white text-sm rounded-full shadow-md">
            Player 1:
            <span class="inline-block px-2 py-1 bg-white text-slate-900 rounded shadow-inner font-bold text-xs">W</span>
            <span class="inline-block px-2 py-1 bg-white text-slate-900 rounded shadow-inner font-bold text-xs">S</span>
          </span>
          <span class="px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500
                       text-white text-sm rounded-full shadow-md">
            Pause:
            <span class="inline-block px-2 py-1 bg-white text-slate-900 rounded shadow-inner font-bold text-xs">G</span>
          </span>
          <span class="px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 
                       text-white text-sm rounded-full shadow-md">
            Player 2:
            <span class="inline-block px-2 py-1 bg-white text-slate-900 rounded shadow-inner font-bold text-xs">O</span>
            <span class="inline-block px-2 py-1 bg-white text-slate-900 rounded shadow-inner font-bold text-xs">K</span>
          </span>
        </div>
      </div>
    `;

    // Récupération du canvas et initialisation du contexte
    this.canvas = this.querySelector('canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;

    // Instanciation des listeners, paramétrage initial du jeu et premier draw()
    this.setupEventListeners();
    this.initGame();
    this.draw();
  }

  private updateScoreDisplay() {
    // Met à jour le texte du <span id="score"> en fonction de this.score
    const scoreEl = this.querySelector('#score');
    if (scoreEl) {
      scoreEl.textContent = `${this.score.player1} - ${this.score.player2}`;
    }
  }


  private handleResize = () => {
    // Tant que la partie n’a pas démarré, on redimensionne le canvas et on redessine
    if (this.isGameStarted) return;
    this.initGame();
    this.draw();
  };

  private setupEventListeners() {
    ['keydown', 'keyup'].forEach((event) =>
      window.addEventListener(event, (e: Event) => {
        const keyEvent = e as KeyboardEvent;
        this.keysPressed[keyEvent.key] = event === 'keydown';
        if (event === 'keydown') this.handleKeyDown(keyEvent);
      })
    );
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      // Empêche de lancer plusieurs fois la même initialisation si on fait maintien sur "Enter"
      if (e.repeat || this.initialCountdownTimer !== null || this.isInitialCountdown) {
        return;
      }

      // Quand la partie est terminée, on appelle resetGame() au lieu de relancer un nouveau point
      if (this.isGameOver) {
        this.resetGame();
        return;
      }

      // Si la partie n’a pas encore démarré, on lance le compte-à-rebours
      if (!this.isGameStarted) {
        this.countdown = COUNTDOWN_START;
        this.startInitialCountdown();
      }
      return;
    }

    // Toucher 'G' pour mettre en pause / reprendre
    if (e.key.toLowerCase() === 'g' && this.isGameStarted && !this.isGameOver) {
      this.togglePause();
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
    // On récupère la configuration (deep copy pour ne pas modifier l’instance originale)
    this.settings = JSON.parse(JSON.stringify(this.settingsService.getSettings()));

    // Redimensionnement du canvas à l’aspect ratio 16/9
    const container = this.canvas.parentElement!;
    let width = container.clientWidth;
    let height = width / CANVAS_ASPECT_RATIO;
    if (height > container.clientHeight) {
      height = container.clientHeight;
      width = height * CANVAS_ASPECT_RATIO;
    }
    this.canvas.width = width;
    this.canvas.height = height;

    // Placement initial des paddles
    this.paddle1.x = this.canvas.width * PADDLE_MARGIN;
    this.paddle1.y = (this.canvas.height - this.paddle1.height) / 2;
    this.paddle2.x = this.canvas.width * (1 - PADDLE_MARGIN) - this.paddle2.width;
    this.paddle2.y = (this.canvas.height - this.paddle2.height) / 2;

    // On prépare une nouvelle partie sans avoir lancé le jeu
    this.gameLoop = false;
    this.isGameStarted = false;
    this.isBallActive = false;
    this.updateGameSettings();
  }

  private resetBall(withCountdown = true) {
    // Place la balle au centre
    this.ball.x = this.canvas.width / 2;
    this.ball.y = this.canvas.height / 2;

    // Détermine un nouvel angle aléatoire
    const angle = ((Math.random() * 120 - 60) * Math.PI) / 180;
    const direction = Math.random() > 0.5 ? 1 : -1;
    this.ball.dx = Math.cos(angle) * this.settings.ballSpeed * direction;
    this.ball.dy = Math.sin(angle) * this.settings.ballSpeed;
    this.isBallActive = false;

    // Réinitialise la position Y des paddles
    this.paddle1.y = (this.canvas.height - this.paddle1.height) / 2;
    this.paddle2.y = (this.canvas.height - this.paddle2.height) / 2;

    // Si un compte à rebours de la balle était en cours, on l’annule
    if (this.ballCountdownTimer !== null) {
      clearInterval(this.ballCountdownTimer);
      this.ballCountdownTimer = null;
    }

    // Soit on lance un nouveau compte à rebours (affichage du “3, 2, 1”), soit on rend la balle active immédiatement
    if (withCountdown) {
      this.startBallCountdown();
    } else {
      this.isBallActive = true;
    }
  }

  private startInitialCountdown() {
    if (this.initialCountdownTimer !== null) {
      clearInterval(this.initialCountdownTimer);
      this.initialCountdownTimer = null;
    }
    if (this.isInitialCountdown) return;

    this.isInitialCountdown = true;
    this.countdown = COUNTDOWN_START;

    this.initialCountdownTimer = window.setInterval(() => {
      this.countdown--;
      this.draw();

      if (this.countdown <= 0) {
        clearInterval(this.initialCountdownTimer!);
        this.initialCountdownTimer = null;
        this.isInitialCountdown = false;

        this.isGameStarted = true;
        this.gameLoop = true;
        this.resetBall(false);  // Pas de compte à rebours pour la balle, on la rend active tout de suite
        this.isBallActive = true;
        this.startGameLoop();
      }
    }, 1000);
  }

  private startBallCountdown() {
    this.countdown = COUNTDOWN_START;

    this.ballCountdownTimer = window.setInterval(() => {
      this.countdown--;
      this.draw();

      if (this.countdown <= 0) {
        clearInterval(this.ballCountdownTimer!);
        this.ballCountdownTimer = null;
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
    if (!this.isBallActive || this.isGameOver) return;

    if (this.keysPressed['w']) this.paddle1.y -= this.paddle1.speed;
    if (this.keysPressed['s']) this.paddle1.y += this.paddle1.speed;
    if (this.keysPressed['o']) this.paddle2.y -= this.paddle2.speed;
    if (this.keysPressed['k']) this.paddle2.y += this.paddle2.speed;
    if (this.keysPressed['W']) this.paddle1.y -= this.paddle1.speed;
    if (this.keysPressed['S']) this.paddle1.y += this.paddle1.speed;
    if (this.keysPressed['O']) this.paddle2.y -= this.paddle2.speed;
    if (this.keysPressed['K']) this.paddle2.y += this.paddle2.speed;
    this.paddle1.y = Math.max(0, Math.min(this.canvas.height - this.paddle1.height, this.paddle1.y));
    this.paddle2.y = Math.max(0, Math.min(this.canvas.height - this.paddle2.height, this.paddle2.y));

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
  if (this.score.player2 >= this.settings.endScore) {
    this.endGame('Player 2');
  } else {
    this.resetBall();
  }
  this.updateScoreDisplay();
} else if (this.ball.x >= this.canvas.width) {
  this.score.player1++;
  if (this.score.player1 >= this.settings.endScore) {
    // 👉 Ici, mets le username connecté !
    this.endGame(this.user.username || 'Player 1');
  } else {
    this.resetBall();
  }
  this.updateScoreDisplay();
}
  }

  private drawCenteredText(text: string, size: number, y: number) {
    this.ctx.font = `bold ${size}px Arial`;
    this.ctx.fillStyle = '#000';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(text, this.canvas.width / 2, y);
  }

  private draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Dessin des paddles
    this.ctx.fillStyle = this.settings.paddleColor;
    this.ctx.fillRect(this.paddle1.x, this.paddle1.y, this.paddle1.width, this.paddle1.height);
    this.ctx.fillRect(this.paddle2.x, this.paddle2.y, this.paddle2.width, this.paddle2.height);

    // Dessin de la balle quand la partie est lancée
    if (this.isGameStarted && this.isBallActive && !this.isGameOver) {
      this.ctx.beginPath();
      this.ctx.arc(this.ball.x, this.ball.y, this.ball.size / 2, 0, Math.PI * 2);
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

    // Messages “Game Over” / “Paused” / “Press ENTER to Start”
    if (this.isGameOver) {
      this.drawCenteredText(`${this.winner} Wins!`, 48, this.canvas.height / 2 - 30);
      this.drawCenteredText('Press ENTER to Play Again', 24, this.canvas.height / 2 + 30);
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

    // Tant que la partie n’a pas démarré, on boucle le draw() pour afficher le “Press ENTER” ou le compte‐à‐rebours
    if (!this.isGameStarted) {
      requestAnimationFrame(() => this.draw());
    }
  }

  private endGame(winner: string) {
    this.isGameOver = true;
    this.winner = winner;
    this.gameLoop = false;
    cancelAnimationFrame(this.animationFrameId);
  }

  private resetGame() {
    // Réinitialisation du score NÉCESSAIRE ici
    this.score = { player1: 0, player2: 0 };
    this.isGameOver = false;
    this.winner = '';
    this.isGameStarted = false;
    this.isBallActive = false;
    this.isInitialCountdown = false;
    this.gameLoop = false;

    this.initGame();
    this.updateScoreDisplay();
    this.draw();
  }

  private togglePause() {
    this.isPaused = !this.isPaused;
    this.isPaused ? cancelAnimationFrame(this.animationFrameId) : this.startGameLoop();
    this.draw();
  }

  public start() {
    this.render();
  }
}

customElements.define('gamelog-view', GamelogView);