import ApiService from '../services/api.service';
import { SettingsService } from '../services/settings-service';
import { API_BASE_URL } from '../config'; // adjust path as needed
import type { GameSettings } from '../services/settings-service';

  const COUNTDOWN_START = 3;
  const CANVAS_ASPECT_RATIO = 16 / 9;
  const PADDLE_MARGIN = 0.02;


class TournamentView extends HTMLElement {
  private username = '';
  private nickname = '';
  private message = '';
  private messageType: 'success' | 'error' | '' = '';
  private isTournamentOver = false;

  // private players: { username: string; nickname: string }[] = [];
  private players: Array<{
    id: number;
    username: string;
    nickname: string;
    avatar?: string;
    matchesPlayed?: number | null;
    winRatio?: number | null;
  }> = [];

  private bracket: { round: string; players: string[]; winner?: string }[] = [];
  private matchScores: Array<{ p1: number; p2: number }> = [];
  private currentMatchIndex = 0;
  private currentMatchPlayers: string[] = [];


// hmm this is game
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
  private settings: GameSettings = this.settingsService.getSettings();

  private paddle1 = { x: 0, y: 0, width: 10, height: 100, speed: 5 };
  private paddle2 = { x: 0, y: 0, width: 10, height: 100, speed: 5 };
  private ball = { x: 0, y: 0, size: 10, speed: 5, dx: 5, dy: 5 };


  constructor() {
    super();
    window.addEventListener('settingsChanged', this.handleSettingsChanged);
    window.addEventListener('resize', this.handleResize);
  }

  connectedCallback() {
    this.render();
  }

async handleJoin(e: Event) {
  e.preventDefault();
  this.message = '';
  this.messageType = '';

  const username = this.username.trim();
  const nickname = this.nickname.trim();

  if (!username || !nickname) {
    this.message = 'Username and nickname are required';
    this.messageType = 'error';
    return this.render();
  }

  if (this.players.some(p => p.username === username)) {
    this.message = 'This user is already registered';
    this.messageType = 'error';
    return this.render();
  }

  try {
    const data = await ApiService.validateUsername(username) as {
      valid: boolean;
      message?: string;
      avatar?: string;
      id?: number;
      wins?: number;
      losses?: number;
    };

    if (!data.valid) {
      this.message = data.message || 'User not found';
      this.messageType = 'error';
      return this.render();
    }

    this.players.push({
      id: data.id!,
      username,
      nickname,
      avatar: data.avatar?.startsWith('/')
        ? `${API_BASE_URL}${data.avatar}`
        : (data.avatar || 'https://placehold.co/96x96?text=Avatar'),
      matchesPlayed: (data.wins ?? 0) + (data.losses ?? 0),
      winRatio: (data.wins ?? 0) + (data.losses ?? 0) > 0 ? (data.wins ?? 0) / ((data.wins ?? 0) + (data.losses ?? 0)) : null
    });

    console.log('[✅ PLAYER JOINED]', {
      id: data.id,
      username,
      nickname,
      avatar: this.players[this.players.length - 1].avatar,
      winRatio: this.players[this.players.length - 1].winRatio,
    });

    this.username = '';
    this.nickname = '';
    this.message = 'Player registered';
    this.messageType = 'success';
    this.render();
  } catch (err) {
    console.error('[handleJoin] Error:', err);
    this.message = 'Failed to validate user';
    this.messageType = 'error';
    this.render();
  }
}
  
  startTournament() {
    if (this.players.length !== 4) {
      this.message = 'Exactly 4 players required to start';
      this.messageType = 'error';
      return this.render();
    }
    
    this.bracket = [
      { round: 'Semi-Final 1', players: [this.players[0].nickname, this.players[1].nickname] },
      { round: 'Semi-Final 2', players: [this.players[2].nickname, this.players[3].nickname] },
      { round: 'Final', players: [] }
    ];

    this.matchScores = [
      { p1: 0, p2: 0 },
      { p1: 0, p2: 0 },
      { p1: 0, p2: 0 }
    ];
    this.message = 'Tournament started!';
    this.messageType = 'success';
    this.render();
  }

  private resetTournament() {
    this.players = [];
    this.bracket = [];
    this.currentMatchIndex = 0;
    this.currentMatchPlayers = [];
    this.message = '';
    this.messageType = '';
    this.score = { player1: 0, player2: 0 };
    this.isGameStarted = false;
    this.isGameOver = false;
    this.isBallActive = false;
    this.isInitialCountdown = false;
    this.gameLoop = false;
    this.isPaused = false;
    this.isTournamentOver = false;
    this.render();
  }

  handleInput(field: 'username' | 'nickname', e: Event) {
    this[field] = (e.target as HTMLInputElement).value;
  }
  
  private recordMatchWinner(winner: string) {
    // Set winner nickname in bracket for current match
    const currentMatch = this.bracket[this.currentMatchIndex];
    currentMatch.winner = winner;
    
      // Capture final score
    const currentScore = {
      p1: this.score.player1,
      p2: this.score.player2
    };
    this.matchScores[this.currentMatchIndex] = currentScore;
    if (this.currentMatchIndex < 2) {
      // Advance winner to Final
      this.bracket[2].players.push(winner);
    }
    
    this.currentMatchIndex++;
    this.currentMatchPlayers = this.bracket[this.currentMatchIndex]?.players || [];
    
    this.message = `${winner} won ${currentMatch.round}!`;
    this.messageType = 'success';
    console.log('Updated matchScores:', this.matchScores);
    console.log(`Updated Match Index ${this.currentMatchIndex} vs Bracket.length ${this.bracket.length}`);
    if (this.currentMatchIndex >= this.bracket.length)
      this.isTournamentOver = true;
    this.resetGame();
    this.render();
  }
  
  private renderNextMatch() {
    if (this.bracket.length === 0 || this.currentMatchIndex >= this.bracket.length) return '';

    const match = this.bracket[this.currentMatchIndex];
    if (match.players.length < 2) return ''; // no button if less than 2 players

    this.currentMatchPlayers = match.players;

    return `
      <div class="mt-8 p-6 bg-gray-900 rounded max-w-md mx-auto text-center">
        <h3 class="text-xl font-bold mb-4 text-white">🎮 Next Match</h3>
        <p class="mb-4 font-bold text-white">${match.players.join(' vs ')}</p>
        <button
          class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-full transition play-match-button"
        >
          Play Match
        </button>
      </div>
    `;
  }

  private renderEndScreen() {
    console.log('tournament over, endscreen');
    if (!this.isTournamentOver) return '';
    const finalMatch = this.bracket[this.bracket.length - 1];
    const winnerNickname = finalMatch?.winner;
    if (!winnerNickname) {
      console.warn('[⚠️ End Screen] No winner found in bracket.');
      return '';
    }
    const winner = this.players.find(p => p.nickname === winnerNickname);
    if (!winner) {
      console.warn('[⚠️ End Screen] Winner player object not found.');
      return '';
    }

    return `
      <div class="flex flex-col items-center justify-center text-center min-h-[calc(100vh-80px)] p-8 text-white space-y-6">
        <h2 class="text-4xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          🏆 Tournament Champion!
        </h2>
        <img
          src="${winner.avatar || 'https://placehold.co/128x128?text=Avatar'}"
          alt="${winner.nickname}'s avatar"
          class="w-32 h-32 rounded-full border-4 border-white"
        />
        <h3 class="text-4xl font-semibold mb-2">${winner.nickname}</h3>
        <p class="text-gray-400 text-normal mb-3">@${winner.username}</p>
        <button class="mt-6 px-6 py-3 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold hover:opacity-90 transition new-tournament-btn">
          New Tournament
        </button>
      </div>
    `;
  }

  private renderBracket() {
    if (this.bracket.length === 0) return '';

    return `
      <div class="max-w-xl mx-auto p-6">
        <h2 class="text-2xl font-bold mb-6 text-center text-white">Tournament Bracket</h2>
        <div class="flex justify-center items-center space-x-8 text-white font-semibold">

          <!-- Semi-Finals -->
          <div class="flex flex-col justify-between h-48 space-y-4">
            ${this.bracket.slice(0, 2).map((match, i) => {
              const isWinnerTop = match.players[0]?.trim() === match.winner?.trim();
              const isWinnerBottom = match.players[1]?.trim() === match.winner?.trim();
              const scores = this.matchScores[i] || { p1: 0, p2: 0 };

              return `
                <div class="rounded-lg p-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 w-48">
                  <div class="bg-gray-900 rounded-lg flex flex-col overflow-hidden">
                    <div
                      class="flex justify-between px-4 py-2 text-center"
                      style="${isWinnerTop ? 'background: linear-gradient(to right, #7f00ff, #e100ff); color: white; padding-bottom: calc(0.5rem + 4px);' : ''}"
                    >
                      <span>${match.players[0] || 'TBD'}</span>
                      <span>${scores.p1}</span>
                    </div>

                    <div class="relative w-full border-t-2 border-gray-900 my-1">
                      <span class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 px-2 text-xs text-gray-300 font-bold rounded border border-gray-300">
                        vs
                      </span>
                    </div>

                    <div
                      class="flex justify-between px-4 py-2 text-center"
                      style="${isWinnerBottom ? 'background: linear-gradient(to right, #7f00ff, #e100ff); color: white; padding-top: calc(0.5rem + 2px);' : ''}"
                    >
                      <span>${match.players[1] || 'TBD'}</span>
                      <span>${scores.p2}</span>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Spacer -->
          <div class="border-l-2 border-gray-500 h-70"></div>

          <!-- Final -->
          <div class="rounded-lg p-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 w-48">
            <div class="bg-gray-900 rounded-lg flex flex-col overflow-hidden">
              <div class="flex justify-between px-4 py-2 text-center">
                <span>${this.bracket[2]?.players[0] || 'TBD'}</span>
                <span>${this.matchScores[2]?.p1 ?? 0}</span>
              </div>

              <div class="relative w-full border-t border-gray-300 my-1">
                <span class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 px-2 text-xs text-gray-300 font-bold">vs</span>
              </div>

              <div class="flex justify-between px-4 py-2 text-center">
                <span>${this.bracket[2]?.players[1] || 'TBD'}</span>
                <span>${this.matchScores[2]?.p2 ?? 0}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    `;
  }


  render() {
    if (this.isTournamentOver) {
      console.log(`state = isTournamentOver = ${this.isTournamentOver}`);
      this.innerHTML = this.renderEndScreen();
      this.querySelector('.new-tournament-btn')?.addEventListener('click', this.resetTournament.bind(this));
      return;
    }
    this.innerHTML = `
      <main class="w-full mx-auto p-8">

        <!-- Limited width for inputs and join -->
        <div class="max-w-xl mx-auto p-8 space-y-6" id="form-wrapper" style="display: ${this.bracket.length > 0 ? 'none' : 'block'};">
          <div id="tournament-ui">
            <h2 class="text-3xl font-bold text-center">Tournament</h2>

            <form class="flex gap-2 mb-4" onsubmit="return false;">
              <input
                type="text"
                placeholder="Username"
                value="${this.username}"
                class="flex-[2_1_40%] rounded-full bg-gray-700 px-4 py-2 text-white placeholder-gray-300 focus:outline-none text-sm"
                name="username"
              />
              <input
                type="text"
                placeholder="Nickname"
                value="${this.nickname}"
                class="flex-[2_1_40%] rounded-full bg-gray-700 px-4 py-2 text-white placeholder-gray-300 focus:outline-none text-sm"
                name="nickname"
              />
              <button
                type="submit"
                class="flex-[1_1_20%] rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-4 py-2 text-white font-semibold hover:opacity-90 transition text-sm"
              >
                Join
              </button>
            </form>

            ${this.message ? `
              <div class="text-center font-semibold ${this.messageType === 'error' ? 'text-red-500' : 'text-green-400'}">
                ${this.message}
              </div>` : ''}
          </div> <!-- tournament-ui -->
        </div> <!-- form-wrapper -->

        <!-- Full width player cards -->
        <div class="grid gap-2 mb-6 px-8 justify-center mx-auto" style="grid-template-columns: repeat(auto-fit, minmax(150px, 200px));">
          ${this.players.map(player => `
            <div class="p-[2px] rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg">
              <div class="bg-gray-900 rounded-lg p-4 flex flex-col items-center text-center">
                <img
                  src="${player.avatar || 'https://placehold.co/96x96?text=Avatar'}"
                  alt="Avatar of ${player.nickname}"
                  class="w-24 h-24 rounded-full border-4 border-gray-900 mb-4"
                />
                <h3 class="text-xl font-bold text-white mb-1">${player.nickname}</h3>
                <p class="text-gray-400 text-sm mb-3">@${player.username}</p>
                <div class="text-white text-sm space-y-1 w-full">
                  <p><strong>📊 Matches Played:</strong> ${player.matchesPlayed ?? 'N/A'}</p>
                  <p><strong>🎯 Win Ratio:</strong> ${player.winRatio != null ? (player.winRatio * 100).toFixed(1) + '%' : 'N/A'}</p>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        ${this.bracket.length === 0 ? `
          <button
            class="block max-w-xl w-full mx-auto rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 py-3 text-white font-bold hover:opacity-90 transition"
          >
            Start Tournament
          </button>` : ''}

        ${this.renderBracket()}
        ${this.renderNextMatch()}
      </div>

      <div id="game-ui" class="hidden">
        <div class="flex flex-col items-center justify-center w-full min-h-[calc(100vh-80px)] p-4 relative">
          <div class="relative flex justify-center items-center w-full max-w-[1000px] mb-6">
            <span class="absolute left-0 px-4 py-2 bg-gradient-to-r from-white via-pink-100 to-purple-200 text-slate-900 rounded-full text-sm font-semibold">
              ${this.currentMatchPlayers[0] || 'Player 1'}
            </span>
            <span id="score" class="px-8 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-full text-2xl font-bold mx-20">
              0 - 0
            </span>
            <span class="absolute right-0 px-4 py-2 bg-gradient-to-r from-white via-pink-100 to-purple-200 text-slate-900 rounded-full text-sm font-semibold">
              ${this.currentMatchPlayers[1] || 'Player 2'}
            </span>
          </div>

          <div class="w-4/5 max-w-[1000px] min-w-[300px] rounded-xl p-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
            <div class="bg-white rounded-xl overflow-hidden">
              <canvas id="pongCanvas" class="w-full h-[60vh] min-h-[200px]"></canvas>
            </div>
          </div>

          <div class="flex flex-wrap justify-center gap-4 mt-6 text-white text-sm">
            <span class="px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full shadow-md font-semibold">
              ${this.currentMatchPlayers[0] || 'Player 1'}
              <span class="inline-block px-2 py-1 bg-white text-slate-900 rounded shadow-inner font-bold text-xs">W</span>
              <span class="inline-block px-2 py-1 bg-white text-slate-900 rounded shadow-inner font-bold text-xs">S</span>
            </span>
            <span class="px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full shadow-md font-semibold">
              Pause:
              <span class="inline-block px-2 py-1 bg-white text-slate-900 rounded shadow-inner font-bold text-xs">G</span>
            </span>
            <span class="px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full shadow-md font-semibold">
              ${this.currentMatchPlayers[1] || 'Player 2'}
              <span class="inline-block px-2 py-1 bg-white text-slate-900 rounded shadow-inner font-bold text-xs">O</span>
              <span class="inline-block px-2 py-1 bg-white text-slate-900 rounded shadow-inner font-bold text-xs">K</span>
            </span>
          </div>
        </div>
      </div>

    </main>
  `;

  // Attach event listeners after setting innerHTML
  this.querySelector('form')?.addEventListener('submit', this.handleJoin.bind(this));
  this.querySelector('input[name="username"]')?.addEventListener('input', this.handleInput.bind(this, 'username'));
  this.querySelector('input[name="nickname"]')?.addEventListener('input', this.handleInput.bind(this, 'nickname'));
  this.querySelector('button.w-full')?.addEventListener('click', this.startTournament.bind(this));
  this.querySelector('.play-match-button')?.addEventListener('click', () => {
    this.toggleGameUI(true);
  });
}

  private toggleGameUI(showGame: boolean) {
    const tournamentUI = this.querySelector('#tournament-ui') as HTMLElement;
    const gameUI = this.querySelector('#game-ui') as HTMLElement;
    if (!tournamentUI || !gameUI) return;

    if (showGame) {
      tournamentUI.style.display = 'none';
      gameUI.style.display = 'block';
      // Initialize canvas and game only here
      this.canvas = this.querySelector('canvas') as HTMLCanvasElement;
      this.ctx = this.canvas.getContext('2d')!;
      this.setupEventListeners();
      this.initGame();
      this.draw();
    } else {
      tournamentUI.style.display = 'block';
      gameUI.style.display = 'none';
    }
  }




// ~---~ GAME FOR TOURNEY ~---~ //


  private updateScoreDisplay() {
    const scoreEl = document.getElementById('score');
    if (scoreEl) {
      scoreEl.textContent = `${this.score.player1} - ${this.score.player2}`;
    }
  }

  private handleSettingsChanged = (e: Event) => {
    this.settings = (e as CustomEvent<GameSettings>).detail;
    this.updateGameSettings();
  };

  private handleResize = () => {
    if (this.isGameStarted) return;
    if (!this.canvas) return;
    this.initGame();
    this.draw();
  };

  private setupEventListeners() {
    ['keydown', 'keyup'].forEach((event) =>
      window.addEventListener(event, (e) => {
        ['w', 's', 'o', 'k'].includes(e.key);
        this.keysPressed[e.key] = event === 'keydown';
        if (event === 'keydown') this.handleKeyDown(e as KeyboardEvent);
      })
    );
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key.toLowerCase() === 'g' && this.isGameStarted && !this.isGameOver) {
      this.togglePause();
    } else if (e.key === 'Enter' && !this.isGameStarted && !this.isGameOver) {
      this.isInitialCountdown = true;
      this.countdown = COUNTDOWN_START;
      this.startInitialCountdown();
    } else if (e.key === 'Enter' && this.isGameOver) {
        if (this.currentMatchIndex >= this.bracket.length) {
          this.isTournamentOver = true;
          this.render(); // Shows end screens
        } else {
          this.toggleGameUI(false);
          this.resetGame();
          this.render();
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
    this.ball.x = this.canvas.width / 2;
    this.ball.y = this.canvas.height / 2;
    const angle = (Math.random() * 120 - 60) * (Math.PI / 180);
    const direction = Math.random() > 0.5 ? 1 : -1;
    this.ball.dx = Math.cos(angle) * this.settings.ballSpeed * direction;
    this.ball.dy = Math.sin(angle) * this.settings.ballSpeed;
    this.isBallActive = false;
    this.startBallCountdown();
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
      this.draw();
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
      this.draw();
    }, 1000);
  }

  private startGameLoop() {
    if (!this.gameLoop || this.isPaused) return;
    this.updateGame();
    this.draw();
    this.animationFrameId = requestAnimationFrame(() => this.startGameLoop());
  }

  private updateGame() {
    if (this.keysPressed['w']) this.paddle1.y -= this.paddle1.speed;
    if (this.keysPressed['s']) this.paddle1.y += this.paddle1.speed;
    if (this.keysPressed['o']) this.paddle2.y -= this.paddle2.speed;
    if (this.keysPressed['k']) this.paddle2.y += this.paddle2.speed;
    this.paddle1.y = Math.max(0, Math.min(this.canvas.height - this.paddle1.height, this.paddle1.y));
    this.paddle2.y = Math.max(0, Math.min(this.canvas.height - this.paddle2.height, this.paddle2.y));

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
        this.score.player2 >= this.settings.endScore ? this.endGame(this.currentMatchPlayers[1], this.currentMatchPlayers[0]) : this.resetBall();
        this.updateScoreDisplay();
      } else if (this.ball.x >= this.canvas.width) {
        this.score.player1++;
        this.score.player1 >= this.settings.endScore ? this.endGame(this.currentMatchPlayers[0], this.currentMatchPlayers[1]) : this.resetBall();
        this.updateScoreDisplay();
      }
    }
    console.log('[BALL SPEED]', Math.hypot(this.ball.dx, this.ball.dy));
  }

  private drawCenteredText(text: string, size: number, y: number) {
    this.ctx.font = `bold ${size}px Arial`;
    this.ctx.fillStyle = '#000';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(text, this.canvas.width / 2, y);
  }

  private draw() {
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

    if (this.isGameOver) {
      this.drawCenteredText(`${this.winner} Wins!`, 48, this.canvas.height / 2 - 30);
      this.drawCenteredText('Press ENTER to Continue', 24, this.canvas.height / 2 + 30);
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

    // if (!this.isGameStarted) requestAnimationFrame(() => this.draw());
  }

  private endGame(winner: string, loser: string) {
    this.isGameOver = true;
    this.winner = winner;
    this.gameLoop = false;
    cancelAnimationFrame(this.animationFrameId);

    const winnerPlayer = this.players.find(p => p.nickname === winner);
    const loserPlayer = this.players.find(p => p.nickname === loser);

    if (winnerPlayer && loserPlayer) {
      const scoreP1 = this.score.player1;
      const scoreP2 = this.score.player2;

      // Save winner/loser result
      fetch(`${API_BASE_URL}/tournament/game-result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winnerId: winnerPlayer.id,
          loserId: loserPlayer.id
        })
      })
      .then(res => {
        if (!res.ok) throw new Error('Failed to record game result');
        return res.json();
      })
      .then(data => {
        if (!data.success) console.error('[❌ API] Failed to save result');
      })
      .catch(err => {
        console.error('[❌ Fetch Error]', err);
      });

      // Save match history for winner
      fetch(`${API_BASE_URL}/tournament/match-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: winnerPlayer.id,
          opponent: loserPlayer.username,
          result: 'win',
          scoreUser: winnerPlayer.nickname === this.currentMatchPlayers[0] ? scoreP1 : scoreP2,
          scoreOpponent: winnerPlayer.nickname === this.currentMatchPlayers[0] ? scoreP2 : scoreP1
        })
      });

      // Save match history for loser
      fetch(`${API_BASE_URL}/tournament/match-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: loserPlayer.id,
          opponent: winnerPlayer.username,
          result: 'loss',
          scoreUser: loserPlayer.nickname === this.currentMatchPlayers[0] ? scoreP1 : scoreP2,
          scoreOpponent: loserPlayer.nickname === this.currentMatchPlayers[0] ? scoreP2 : scoreP1
        })
      });
    }

    this.recordMatchWinner(winner);
  }

  private resetGame() {
    cancelAnimationFrame(this.animationFrameId);
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

  public start() {
    this.render();
  }
}

customElements.define('tournament-view', TournamentView);