
import ApiService from '../services/api.service';
import { API_BASE_URL } from '../config';

class FriendProfileView {
  private user = { username: '', avatar: '' };
  private avatarUrl: string = '';
  private wins: number = 0;
  private losses: number = 0;
  private winRate: number = 0;
  private matchHistory: Array<{
    match_id: number;
    played_at: string;
    result: 'win' | 'loss';
    opponent: string;
    user_score: number | null;
    opponent_score: number | null;
  }> = [];
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



    return Promise.all([
      this.loadStats(friendId),
      this.loadMatchHistory(Number(friendId))
    ]);
  })
  .then(() => {

    this.render();
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

  private async loadMatchHistory(friendId: number) {
    try {
      const data = await ApiService.getUserMatchHistory(friendId);
      this.matchHistory = data;
    } catch (err) {
      console.error('Erreur chargement historique ami :', err);
    }
  }


  public render() {
  const total = this.wins + this.losses;
  const winRateGradient = this.winRate < 50
    ? 'from-red-400 via-red-500 to-red-600'
    : 'from-green-400 via-green-500 to-green-600';

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  const historyRows = this.matchHistory
    .map(m => {
      const scoreText =
        m.user_score == null || m.opponent_score == null
          ? '—'
          : `${m.user_score} – ${m.opponent_score}`;
      const resultColor = m.result === 'win' ? 'text-green-400' : 'text-red-400';
      return `
        <tr class="border-b border-gray-700 hover:bg-gray-800">
          <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-200">
            ${formatDate(m.played_at)}
          </td>
          <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-200">${m.opponent}</td>
          <td class="px-4 py-2 whitespace-nowrap text-sm font-semibold ${resultColor}">
            ${m.result.toUpperCase()}
          </td>
          <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-200">${scoreText}</td>
        </tr>
      `;
    })
    .join('');

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
          Local Game Statistics
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

    <!-- Match History -->
    <div class="mx-auto max-w-7xl px-6 lg:px-8 my-12">
      <h3 class="text-2xl font-bold text-white mb-4 bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
        Match History
      </h3>
      <div class="overflow-x-auto">
        <table class="min-w-full table-auto divide-y divide-gray-700">
          <thead class="bg-gray-800">
            <tr>
              <th class="px-4 py-2 text-left text-sm font-medium text-gray-300">Date</th>
              <th class="px-4 py-2 text-left text-sm font-medium text-gray-300">Opponent</th>
              <th class="px-4 py-2 text-left text-sm font-medium text-gray-300">Result</th>
              <th class="px-4 py-2 text-left text-sm font-medium text-gray-300">Score</th>
            </tr>
          </thead>
          <tbody class="bg-gray-900 divide-y divide-gray-700">
            ${historyRows ||
              `<tr>
                 <td colspan="4" class="px-4 py-3 text-center text-gray-500">No matches found.</td>
               </tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;

  this.container.querySelector('#back-button')?.addEventListener('click', () => {
    window.location.href = '/chat';
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
