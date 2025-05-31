
import ApiService from '../services/api.service';
import { API_BASE_URL } from '../config';

class FriendProfileView {
  private user = { username: '', avatar: '' };
  private avatarUrl: string = '';
  private wins: number = 0;
  private losses: number = 0;
  private winRate: number = 0;
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    const urlParams = new URLSearchParams(window.location.search);
    const friendId = urlParams.get('id');
    if (!friendId) return;

    ApiService.getUserById(friendId)
      .then(data => {
        this.user = {
          username: data.username,
          avatar: data.avatar
        };
        this.avatarUrl = data.avatar && data.avatar !== ''
          ? (data.avatar.startsWith('/') ? `${API_BASE_URL}${data.avatar}` : `${API_BASE_URL}/avatars/${data.avatar}`)
          : `${API_BASE_URL}/avatars/default.png`;
        this.loadStats(friendId);
      })
      .catch(err => {
        console.error('Erreur chargement profil ami:', err);
      });
  }

  private async loadStats(friendId: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/users/${friendId}/stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      this.wins = data.wins;
      this.losses = data.losses;
      const total = this.wins + this.losses;
      this.winRate = total > 0 ? Math.round((this.wins / total) * 100) : 0;
      this.render();
    } catch (err) {
      console.error('Erreur chargement stats ami :', err);
    }
  }

  public render() {
    const total = this.wins + this.losses;
    const winRateGradient = this.winRate < 50
      ? 'from-red-400 via-red-500 to-red-600'
      : 'from-green-400 via-green-500 to-green-600';

    this.container.innerHTML = `
      <div class="bg-gray-900 py-12">
        <div class="mx-auto max-w-4xl px-6 lg:px-8">
          <div class="relative rounded-3xl p-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg overflow-hidden">
            <div class="rounded-[22px] bg-gray-800 p-6 flex flex-col items-center space-y-4">
              <h2 class="text-4xl font-bold text-white">${this.user.username}</h2>
              <div class="w-24 h-24 rounded-full p-[2px] bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-600">
                <div class="w-full h-full rounded-full bg-gray-900">
                  <img src="${this.avatarUrl}" alt="Avatar" class="w-full h-full rounded-full object-cover" />
                </div>
              </div>
              <p class="text-sm text-gray-300">This is your friend's profile</p>
              <button id="back-button" class="px-4 py-2 bg-gradient-to-r from-white via-pink-100 to-purple-200 text-slate-900 hover:opacity-90 rounded-full transition text-center">
                ← Back to Chat
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-gray-900 pb-24">
        <div class="mx-auto max-w-7xl px-6 lg:px-8">
          <h3 class="mt-16 mb-4 text-center text-xl font-semibold bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Multiplayer Statistics
          </h3>

          <div class="mt-6 p-[2px] rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
            <dl class="grid grid-cols-1 gap-0.5 overflow-hidden rounded-[15px] bg-gray-800 text-center sm:grid-cols-2 lg:grid-cols-4">
              <div class="flex flex-col bg-white/5 p-8">
                <dt class="text-sm font-semibold text-white">Played</dt>
                <dd class="order-first text-3xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500">
                  ${total}
                </dd>
              </div>
              <div class="flex flex-col bg-white/5 p-8">
                <dt class="text-sm font-semibold text-white">Wins</dt>
                <dd class="order-first text-3xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-green-500 to-green-600">
                  ${this.wins}
                </dd>
              </div>
              <div class="flex flex-col bg-white/5 p-8">
                <dt class="text-sm font-semibold text-white">Losses</dt>
                <dd class="order-first text-3xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-500 to-red-600">
                  ${this.losses}
                </dd>
              </div>
              <div class="flex flex-col bg-white/5 p-8">
                <dt class="text-sm font-semibold text-white">Win Rate</dt>
                <dd class="order-first text-3xl font-semibold text-transparent bg-clip-text bg-gradient-to-r ${winRateGradient}">
                  ${total > 0 ? this.winRate + '%' : '<span class="text-white">-</span>'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    `;

    this.container.querySelector('#back-button')?.addEventListener('click', () => {
      window.history.back();
    });
  }
}

class FriendProfileElement extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const container = document.createElement('div');
    this.appendChild(container);
    new FriendProfileView(container);
  }
}

customElements.define('friend-profile-view', FriendProfileElement);

// On peut delete en dessous ?

// import { LitElement, html, css } from 'lit';
// import { customElement, state } from 'lit/decorators.js';
// import ApiService from '../services/api.service';
// import { API_BASE_URL } from '../config';

// @customElement('friend-profile-view')
// export class FriendProfileView extends LitElement {
//   static styles = css`
//     .profile-container {
//       padding: 2rem;
//       max-width: 500px;
//       margin: auto;
//       color: var(--color-text);
//     }
//     h2 {
//       font-size: 2rem;
//       margin-bottom: 1.5rem;
//       text-align: center;
//     }
//     .readonly-info {
//       background: var(--color-surface);
//       padding: 1rem;
//       border-radius: 0.5rem;
//       margin-bottom: 2rem;
//       box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
//     }
//     .info-line {
//       margin-bottom: 1rem;
//       font-size: 1.1rem;
//     }
//     .label {
//       font-weight: 600;
//     }
//     img {
//       border-radius: 50%;
//       border: 2px solid #ccc;
//     }
//     .back-button {
//       margin-top: 2rem;
//       display: block;
//       width: 100%;
//       text-align: center;
//       padding: 0.75rem;
//       background: var(--color-accent);
//       color: white;
//       border: none;
//       border-radius: 0.5rem;
//       cursor: pointer;
//     }
//     .back-button:hover {
//       opacity: 0.9;
//     }
//   `;

//   @state() private user = { username: '', avatar: '' };
//   @state() private avatarUrl: string = '';
// @state() private wins: number = 0;
// @state() private losses: number = 0;
// @state() private winRate: number = 0;


// private async loadStats(friendId: string) {
//   try {
//    const res = await fetch(`${API_BASE_URL}/auth/users/${friendId}/stats`, {
//   headers: {
//     Authorization: `Bearer ${localStorage.getItem('token')}`
//   }
// });

//     const data = await res.json();
//     console.log("📊 Stats reçues:", data);
//     this.wins = data.wins;
//     this.losses = data.losses;
//     this.wins = data.wins;
// this.losses = data.losses;
// const total = this.wins + this.losses;
// this.winRate = total > 0 ? Math.round((this.wins / total) * 100) : 0;

//   } catch (err) {
//     console.error('Erreur chargement stats ami :', err);
//   }
// }

//   connectedCallback() {
//     super.connectedCallback();
//     const urlParams = new URLSearchParams(window.location.search);
//     const friendId = urlParams.get('id');
//     if (!friendId) return;

//     ApiService.getUserById(friendId)
//       .then(data => {
//         this.user = {
//           username: data.username,
//           avatar: data.avatar
//         };
//         this.avatarUrl = data.avatar && data.avatar !== ''
//   ? (data.avatar.startsWith('/') ? `${API_BASE_URL}${data.avatar}` : `${API_BASE_URL}/avatars/${data.avatar}`)
//   : `${API_BASE_URL}/avatars/default.png`;

//   this.loadStats(friendId);
//       })
//       .catch(err => {
//         console.error('Erreur chargement profil ami:', err);
//       });

//   }

//   render() {
//     return html`
//       <div class="profile-container">
//         <h2>Profile of ${this.user.username}</h2>
//         <div class="readonly-info">
//           <div class="info-line"><span class="label">Username:</span> ${this.user.username}</div>
//         </div>
//         <div style="text-align: center;">
//           <img src="${this.avatarUrl}" alt="Avatar" width="120" height="120" />
//         </div>
//         <div class="readonly-info">
//   <div class="info-line"><span class="label">Username:</span> ${this.user.username}</div>
//   <div class="info-line"><span class="label">Victoires:</span> ${this.wins}</div>
//   <div class="info-line"><span class="label">Défaites:</span> ${this.losses}</div>
//   <div class="info-line"><span class="label">Taux de victoire:</span> ${this.winRate}%</div>
// </div>


//         <button class="back-button" @click=${() => window.history.back()}>← Back to Chat</button>
//       </div>
//     `;
//   }
// }