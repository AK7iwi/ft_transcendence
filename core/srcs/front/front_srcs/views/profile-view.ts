import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import ApiService from '../services/api.service';


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
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .info-line {
      margin-bottom: 1rem;
      font-size: 1.1rem;
    }

    .label {
      font-weight: 600;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-label {
      display: block;
      font-weight: 500;
      margin-bottom: 0.5rem;
    }

    .form-input {
      width: 100%;
      padding: 0.7rem;
      font-size: 1rem;
      border: 1px solid var(--color-border);
      border-radius: 0.5rem;
      background: var(--color-background);
      color: var(--color-text);
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

  @state() private user = { username: '', email: '' };
  @state() private newUsername = '';
  @state() private newPassword = '';
  @state() private confirmPassword = '';
  @state() private qrCode = '';
  @state() private code2FA = '';
  @state() private isAuthenticated = false;



connectedCallback() {
  super.connectedCallback();
  const token = localStorage.getItem('token');

  if (!token) {
    this.isAuthenticated = false;
    return;
  }

  ApiService.getProfile()
    .then(data => {
      this.user = {
        username: data.username,
        email: data.email,
        twoFactorEnabled: data.twoFactorEnabled,
      };
      this.isAuthenticated = true;
    })
    .catch(err => {
      console.error('Failed to load profile:', err);
      this.isAuthenticated = false;
    });
}


private async updateUsername() {
  try {
    const payload = {
      username: this.user.username,
      newUsername: this.newUsername
    };

    const updatedUser = await ApiService.updateUser(payload);

    this.user.username = updatedUser.username; // ← si le backend renvoie le nouvel utilisateur
    localStorage.setItem('user', JSON.stringify(this.user));

    this.newUsername = ''; // ← reset input
    alert('Username updated successfully');
  } catch (err) {
    console.error('Update username failed:', err);
    alert('Failed to update username');
  }
}

private async changePassword() {
  if (this.newPassword !== this.confirmPassword) {
    alert('Passwords do not match.');
    return;
  }

  try {
    await ApiService.updatePassword(this.user.username, this.newPassword);
    alert('Password updated successfully');
    this.newPassword = '';
    this.confirmPassword = '';
  } catch (err) {
    alert('Failed to update password');
  }
}

private async setup2FA() {
  try {
    const res = await ApiService.setup2FA();
    this.qrCode = res.qrCode;
  } catch (err) {
    alert('Erreur lors de la génération du QR code');
    console.error(err);
  }
}

private async handleVerify2FA(e: Event) {
  e.preventDefault();
  try {
    await ApiService.verify2FA(this.code2FA);
    alert('2FA activée avec succès');
    this.user.twoFactorEnabled = true;
    localStorage.setItem('user', JSON.stringify(this.user));
    this.qrCode = '';
    this.code2FA = '';
  } catch (err) {
    alert('Échec de l’activation 2FA');
    console.error(err);
  }
}



private logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
}


render() {
  return html`
    <div class="profile-container">
      <h2>My Profile</h2>

      ${!this.isAuthenticated ? html`
        <p style="color: var(--color-error); font-weight: bold; margin-top: 2rem;">
          🚫 Vous n'êtes pas connecté. Rendez-vous dans le menu principal pour vous connecter.
        </p>
      ` : html`
        <div class="readonly-info">
          <div class="info-line"><span class="label">Username:</span> ${this.user.username}</div>
          <div class="info-line"><span class="label">Email:</span> ${this.user.email}</div>
        </div>

        <h3>Update Username</h3>
        <div class="form-group">
          <label class="form-label">New Username</label>
          <input class="form-input" .value=${this.newUsername} @input=${(e: Event) => this.newUsername = (e.target as HTMLInputElement).value} />
        </div>
        <button class="button" @click=${this.updateUsername}>Update Username</button>

        <h3 style="margin-top:2rem;">Change Password</h3>
        <div class="form-group">
          <label class="form-label">New Password</label>
          <input type="password" class="form-input" .value=${this.newPassword} @input=${(e: Event) => this.newPassword = (e.target as HTMLInputElement).value} />
        </div>
        <div class="form-group">
          <label class="form-label">Confirm Password</label>
          <input type="password" class="form-input" .value=${this.confirmPassword} @input=${(e: Event) => this.confirmPassword = (e.target as HTMLInputElement).value} />
        </div>
        <button class="button" @click=${this.changePassword}>Update Password</button>

        ${!this.user.twoFactorEnabled ? html`
          <div style="margin-top: 2rem;">
            <h3>Two-Factor Authentication (2FA)</h3>
            ${this.qrCode ? html`
              <p>Scanne ce code QR avec Authy :</p>
              <img src="${this.qrCode}" alt="QR Code" style="max-width: 200px;" />
              <form @submit=${this.handleVerify2FA}>
                <label>Code 2FA :</label>
                <input type="text" .value=${this.code2FA} @input=${(e: any) => this.code2FA = e.target.value} />
                <button type="submit">Vérifier</button>
              </form>
            ` : html`
              <button class="button" @click=${this.setup2FA}>Activer 2FA</button>
            `}
          </div>
        ` : html`
          <p>✅ 2FA activée</p>
        `}

        <button class="button" @click=${this.logout} style="margin-top: 3rem; background: #e74c3c;">
          Log Out
        </button>
      `}
    </div>
  `;
}
}