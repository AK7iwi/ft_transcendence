

// import ApiService from '../services/api.service';
// import { API_BASE_URL } from '../config';

// class ProfileView extends HTMLElement {
//   constructor() {
//     super();
//     // this.attachShadow({ mode: 'open' });
//   }

//   async connectedCallback() {
//     this.user = { username: '', avatar: '' };
//     this.avatarUrl = '';
//     this.successMessage = '';
//     this.errorMessage = '';
//     this.isAuthenticated = false;
//     this.wins = 0;
//     this.losses = 0;

//     const token = localStorage.getItem('token');
//     if (!token) return;

//     try {
//       const data = await ApiService.getProfile();
//       this.user = { username: data.username, avatar: data.avatar };
//       this.avatarUrl = data.avatar
//         ? (data.avatar.startsWith('/') ? `${API_BASE_URL}${data.avatar}` : data.avatar)
//         : `${API_BASE_URL}/avatars/default.png`;
//       this.wins = data.wins;
//       this.losses = data.losses;
//       this.isAuthenticated = true;
//     } catch (err) {
//       console.error('Failed to load profile:', err);
//       this.isAuthenticated = false;
//     }

//     this.render();
//   }

//   showMessage(type, message) {
//     if (type === 'success') {
//       this.successMessage = message;
//       this.errorMessage = '';
//     } else {
//       this.errorMessage = message;
//       this.successMessage = '';
//     }
//     this.render();
//     setTimeout(() => {
//       this.successMessage = '';
//       this.errorMessage = '';
//       this.render();
//     }, 3000);
//   }

//   async handleAvatarUpload(event) {
//     const file = event.target.files?.[0];
//     if (!file) return;

//     try {
//       const avatar = await ApiService.uploadAvatar(file);
//       this.avatarUrl = avatar.startsWith('/') ? `${API_BASE_URL}${avatar}` : avatar;
//       this.user.avatar = avatar;
//       this.showMessage('success', 'Avatar updated successfully!');
//     } catch (err) {
//       this.showMessage('error', 'Failed to upload avatar');
//     }
//   }

//   logout() {
//     localStorage.removeItem('token');
//     localStorage.removeItem('user');
//     window.location.href = '/';
//   }

//   render() {
//     this.innerHTML = `
//       <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
//       <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">

//       <div class="bg-gray-900 py-12">
//         <div class="mx-auto max-w-4xl px-6 lg:px-8">
//           <div class="relative rounded-3xl p-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg overflow-hidden">
//             <div class="rounded-[22px] bg-gray-800 p-6 flex flex-col items-center space-y-4">
//               <h2 class="text-4xl font-bold text-white">${this.user.username}</h2>
//               <div class="w-24 h-24 rounded-full p-[2px] bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500">
//                 <div class="w-full h-full rounded-full bg-gray-900">
//                   <img src="${this.avatarUrl}" alt="User Avatar" class="w-full h-full rounded-full object-cover" />
//                 </div>
//               </div>
//               <p class="text-sm text-gray-300">Change your avatar</p>
//               <label class="px-3 py-1 bg-gradient-to-r from-white via-pink-100 to-purple-200 text-slate-900 hover:opacity-90 rounded-full transition cursor-pointer">
//                 <i class="fa-solid fa-image"></i> Choose File
//                 <input type="file" accept="image/*" class="hidden" />
//               </label>
//               <button id="logout-button" class="px-3 py-1 bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white rounded-full transition hover:opacity-90">
//                 <i class="fa-solid fa-right-from-bracket"></i> Logout
//               </button>
//               ${this.successMessage ? `<div class="text-green-500 font-bold">${this.successMessage}</div>` : ''}
//               ${this.errorMessage ? `<div class="text-red-500 font-bold">${this.errorMessage}</div>` : ''}
//             </div>
//           </div>
//         </div>
//       </div>

//       <div class="bg-gray-900 pb-24">
//         <div class="mx-auto max-w-7xl px-6 lg:px-8">
//           <div class="text-center space-y-4">
//             <h2 class="text-3xl font-bold tracking-tight text-white sm:text-4xl bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
//               Your Game Statistics
//             </h2>
//             <p class="text-lg leading-8 text-gray-300">
//               Review your multiplayer performance below. Stay sharp and keep improving!
//             </p>
//           </div>

//           <h3 class="mt-16 mb-4 text-center text-xl font-semibold bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
//             <i class="fa-solid fa-chart-simple"></i> Multiplayer Statistics
//           </h3>

//           <dl class="mt-6 grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl text-center sm:grid-cols-2 lg:grid-cols-4">
//             <div class="flex flex-col bg-white/5 p-8">
//               <dt class="text-sm font-semibold text-gray-300">Played</dt>
//               <dd class="order-first text-3xl font-semibold bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
//                 ${this.wins + this.losses}
//               </dd>
//             </div>
//             <div class="flex flex-col bg-white/5 p-8">
//               <dt class="text-sm font-semibold text-gray-300">Wins</dt>
//               <dd class="order-first text-3xl font-semibold text-green-500">${this.wins}</dd>
//             </div>
//             <div class="flex flex-col bg-white/5 p-8">
//               <dt class="text-sm font-semibold text-gray-300">Losses</dt>
//               <dd class="order-first text-3xl font-semibold text-red-500">${this.losses}</dd>
//             </div>
//             <div class="flex flex-col bg-white/5 p-8">
//               <dt class="text-sm font-semibold text-gray-300">Win Rate</dt>
//               <dd class="order-first text-3xl font-semibold text-green-500">
//                 ${(this.wins + this.losses > 0 ? ((this.wins / (this.wins + this.losses)) * 100).toFixed(1) : '0')}%
//               </dd>
//             </div>
//           </dl>
//         </div>
//       </div>
//     `;

//     this.querySelector('input[type="file"]').addEventListener('change', e => this.handleAvatarUpload(e));
//     this.querySelector('#logout-button').addEventListener('click', () => this.logout());
//   }
// }

// customElements.define('profile-view', ProfileView);

import ApiService from '../services/api.service';
import { API_BASE_URL } from '../config';

class ProfileView extends HTMLElement {
  constructor() {
    super();
    // this.attachShadow({ mode: 'open' });
  }

  private user = { username: '', avatar: '' };
  private avatarUrl: string = '';
  private successMessage: string = '';
  private errorMessage: string = '';
private wins: number = 0;
private losses: number = 0;

 connectedCallback() {
  const token = localStorage.getItem('token');
  if (!token) return;
console.log('🟢 Token:', token);

  ApiService.getProfile()
    .then(data => {
      this.user = {
        username: data.username,
        avatar: data.avatar
      };
      this.avatarUrl = data.avatar
        ? (data.avatar.startsWith('/') ? `${API_BASE_URL}${data.avatar}` : data.avatar)
        : `${API_BASE_URL}/avatars/default.png`;
      this.wins = data.wins;
      this.losses = data.losses;

      this.render(); // ✅ C’est ça qui déclenche l’affichage
    })
    .catch(err => {
      console.error('Failed to load profile:', err);
    });
}



  private showMessage(type: 'success' | 'error', message: string) {
    if (type === 'success') {
      this.successMessage = message;
      this.errorMessage = '';
    } else {
      this.errorMessage = message;
      this.successMessage = '';
    }
    setTimeout(() => {
      this.successMessage = '';
      this.errorMessage = '';
    }, 3000);
  }

  private async handleAvatarUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const avatar = await ApiService.uploadAvatar(file);
      this.avatarUrl = avatar.startsWith('/') ? `${API_BASE_URL}${avatar}` : avatar;
      this.user.avatar = avatar;
      this.showMessage('success', 'Avatar mis à jour !');
    } catch (err) {
      this.showMessage('error', 'Échec du téléchargement de l’avatar');
    }
  }

  private logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
}
async loadUserStats() {
  try {
    const user = await ApiService.getProfile(); // Cette méthode utilise /auth/me
    const statsContainer = this.querySelector('#user-stats');
    if (statsContainer) {
      statsContainer.innerHTML = `
        <p><strong>Victoires :</strong> ${user.wins}</p>
        <p><strong>Défaites :</strong> ${user.losses}</p>
      `;
    }
  } catch (err) {
    console.error('Erreur lors du chargement des stats :', err);
  }
}



render() {
    this.innerHTML = `
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">

      <div class="bg-gray-900 py-12">
        <div class="mx-auto max-w-4xl px-6 lg:px-8">
          <div class="relative rounded-3xl p-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg overflow-hidden">
            <div class="rounded-[22px] bg-gray-800 p-6 flex flex-col items-center space-y-4">
              <h2 class="text-4xl font-bold text-white">${this.user.username}</h2>
              <div class="w-24 h-24 rounded-full p-[2px] bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500">
                <div class="w-full h-full rounded-full bg-gray-900">
                  <img src="${this.avatarUrl}" alt="User Avatar" class="w-full h-full rounded-full object-cover" />
                </div>
              </div>
              <p class="text-sm text-gray-300">Change your avatar</p>
              <label class="px-3 py-1 bg-gradient-to-r from-white via-pink-100 to-purple-200 text-slate-900 hover:opacity-90 rounded-full transition cursor-pointer">
                <i class="fa-solid fa-image"></i> Choose File
                <input type="file" accept="image/*" class="hidden" />
              </label>
              <button id="logout-button" class="px-3 py-1 bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white rounded-full transition hover:opacity-90">
                <i class="fa-solid fa-right-from-bracket"></i> Logout
              </button>
              ${this.successMessage ? `<div class="text-green-500 font-bold">${this.successMessage}</div>` : ''}
              ${this.errorMessage ? `<div class="text-red-500 font-bold">${this.errorMessage}</div>` : ''}
            </div>
          </div>
        </div>
      </div>

      <div class="bg-gray-900 pb-24">
        <div class="mx-auto max-w-7xl px-6 lg:px-8">
          <div class="text-center space-y-4">
            <h2 class="text-3xl font-bold tracking-tight text-white sm:text-4xl bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Your Game Statistics
            </h2>
            <p class="text-lg leading-8 text-gray-300">
              Review your multiplayer performance below. Stay sharp and keep improving!
            </p>
          </div>

          <h3 class="mt-16 mb-4 text-center text-xl font-semibold bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            <i class="fa-solid fa-chart-simple"></i> Multiplayer Statistics
          </h3>

          <dl class="mt-6 grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl text-center sm:grid-cols-2 lg:grid-cols-4">
            <div class="flex flex-col bg-white/5 p-8">
              <dt class="text-sm font-semibold text-gray-300">Played</dt>
              <dd class="order-first text-3xl font-semibold bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                ${this.wins + this.losses}
              </dd>
            </div>
            <div class="flex flex-col bg-white/5 p-8">
              <dt class="text-sm font-semibold text-gray-300">Wins</dt>
              <dd class="order-first text-3xl font-semibold text-green-500">${this.wins}</dd>
            </div>
            <div class="flex flex-col bg-white/5 p-8">
              <dt class="text-sm font-semibold text-gray-300">Losses</dt>
              <dd class="order-first text-3xl font-semibold text-red-500">${this.losses}</dd>
            </div>
            <div class="flex flex-col bg-white/5 p-8">
              <dt class="text-sm font-semibold text-gray-300">Win Rate</dt>
              <dd class="order-first text-3xl font-semibold text-green-500">
                ${(this.wins + this.losses > 0 ? ((this.wins / (this.wins + this.losses)) * 100).toFixed(1) : '0')}%
              </dd>
            </div>
          </dl>
        </div>
      </div>
    `;

    this.querySelector('input[type="file"]').addEventListener('change', e => this.handleAvatarUpload(e));
    this.querySelector('#logout-button').addEventListener('click', () => this.logout());
  }
}

customElements.define('profile-view', ProfileView);


//   render() {
//     return html`
//       <div class="profile-container">
//         <h2>My Profile</h2>
//         ${this.successMessage ? html`
//           <div style="color: green; font-weight: bold; margin-bottom: 1rem;">${this.successMessage}</div>
//         ` : ''}
//         ${this.errorMessage ? html`
//           <div style="color: red; font-weight: bold; margin-bottom: 1rem;">${this.errorMessage}</div>
//         ` : ''}

//         ${!this.isAuthenticated ? html`
//           <p style="color: var(--color-error); font-weight: bold; margin-top: 2rem;">
//             🚫 Vous n'êtes pas connecté. Rendez-vous dans le menu principal pour vous connecter.
//           </p>
//         ` : html`
//           <div class="readonly-info">
//             <div class="info-line"><span class="label">Username:</span> ${this.user.username}</div>
//           <div class="info-line"><span class="label">Victoires :</span> ${this.wins}</div>
// <div class="info-line"><span class="label">Défaites :</span> ${this.losses}</div>
// <div class="info-line"><span class="label">Taux de victoire :</span>
//   ${this.wins + this.losses > 0 ? ((this.wins / (this.wins + this.losses)) * 100).toFixed(1) : '0'}%
// </div>



//           <h3>Avatar</h3>
//           <div style="text-align: center; margin-bottom: 1.5rem;">
//             <img src="${this.avatarUrl}" alt="Avatar" width="120" height="120" style="border-radius: 50%; border: 2px solid #ccc;" />
//             <div style="margin-top: 1rem;">
//               <input type="file" accept="image/*" @change=${this.handleAvatarUpload} />
//             </div>
//             <button class="button" @click=${this.logout} style="margin-top: 2rem; background: #e74c3c;">
//   Log Out
// </button>

//           </div>
//         `}
//       </div>
//     `;
//   }
// }

