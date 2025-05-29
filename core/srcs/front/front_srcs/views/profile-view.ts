
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import ApiService from '../services/api.service';
import { API_BASE_URL } from '../config';

@customElement('profile-view')
export class ProfileView extends LitElement {
  static styles = css`
    .profile-container {
      padding: 2rem;
      max-width: 500px;
      margin: auto;
      color: var(--color-text);
    }

    h2 {
      font-size: 2rem;
      margin-bottom: 1.5rem;
      text-align: center;
    }

    .readonly-info {
      background: var(--color-surface);
      padding: 1rem;
      border-radius: 0.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .info-line {
      margin-bottom: 1rem;
      font-size: 1.1rem;
    }

    .label {
      font-weight: 600;
    }

    .button {
      display: block;
      width: 100%;
      padding: 0.8rem;
      background: var(--color-accent);
      color: white;
      font-weight: bold;
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
      margin-top: 1rem;
    }

    .button:hover {
      opacity: 0.9;
    }
  `;

  @state() private user = { username: '', avatar: '' };
  @state() private avatarUrl: string = '';
  @state() private successMessage: string = '';
  @state() private errorMessage: string = '';
  @state() private isAuthenticated = false;
@state() private wins: number = 0;
@state() private losses: number = 0;

  connectedCallback() {
    super.connectedCallback();
    const token = localStorage.getItem('token');
    if (!token) return;

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
    this.isAuthenticated = true;
  })
  .catch(err => {
    console.error('Failed to load profile:', err);
    this.isAuthenticated = false;
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
    return html`
      <div class="profile-container">
        <h2>My Profile</h2>
        ${this.successMessage ? html`
          <div style="color: green; font-weight: bold; margin-bottom: 1rem;">${this.successMessage}</div>
        ` : ''}
        ${this.errorMessage ? html`
          <div style="color: red; font-weight: bold; margin-bottom: 1rem;">${this.errorMessage}</div>
        ` : ''}

        ${!this.isAuthenticated ? html`
          <p style="color: var(--color-error); font-weight: bold; margin-top: 2rem;">
            🚫 Vous n'êtes pas connecté. Rendez-vous dans le menu principal pour vous connecter.
          </p>
        ` : html`
          <div class="readonly-info">
            <div class="info-line"><span class="label">Username:</span> ${this.user.username}</div>
          <div class="info-line"><span class="label">Victoires :</span> ${this.wins}</div>
<div class="info-line"><span class="label">Défaites :</span> ${this.losses}</div>
<div class="info-line"><span class="label">Taux de victoire :</span>
  ${this.wins + this.losses > 0 ? ((this.wins / (this.wins + this.losses)) * 100).toFixed(1) : '0'}%
</div>



          <h3>Avatar</h3>
          <div style="text-align: center; margin-bottom: 1.5rem;">
            <img src="${this.avatarUrl}" alt="Avatar" width="120" height="120" style="border-radius: 50%; border: 2px solid #ccc;" />
            <div style="margin-top: 1rem;">
              <input type="file" accept="image/*" @change=${this.handleAvatarUpload} />
            </div>
            <button class="button" @click=${this.logout} style="margin-top: 2rem; background: #e74c3c;">
  Log Out
</button>

          </div>
        `}
      </div>
    `;
  }
}

