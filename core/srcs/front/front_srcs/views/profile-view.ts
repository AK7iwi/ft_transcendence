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

  connectedCallback() {
    super.connectedCallback();
    const stored = localStorage.getItem('user');
    if (stored) {
      this.user = JSON.parse(stored);
      this.newUsername = this.user.username;
    }
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

    console.log('Changing password to:', this.newPassword);
    // TODO: call backend API to change password
  }

  private logout() {
  localStorage.removeItem('user');
  window.location.href = '/';
}

  render() {
    return html`
      <div class="profile-container">
        <h2>My Profile</h2>

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
        
        <button class="button" @click=${this.logout} style="margin-top: 3rem; background: #e74c3c;">
        Log Out
        </button>
        </div>
    `;
  }
}


// import { LitElement, html, css } from 'lit';
// import { customElement, state } from 'lit/decorators.js';

// @customElement('profile-view')
// export class ProfileView extends LitElement {
//   static styles = css`
//     .profile-container {
//       padding: 2rem;
//       text-align: center;
//       color: var(--color-text);
//     }

//     h2 {
//       font-size: 2rem;
//       margin-bottom: 1rem;
//     }

//     .logout-button {
//       padding: 0.8rem 1.2rem;
//       font-size: 1rem;
//       border: none;
//       border-radius: 0.5rem;
//       background-color: var(--color-accent);
//       color: white;
//       cursor: pointer;
//     }

//     .logout-button:hover {
//       opacity: 0.9;
//     }
//   `;

//   @state()
//   private user: { username: string } | null = null;

//   connectedCallback() {
//     super.connectedCallback();
//     const stored = localStorage.getItem('user');
//     if (stored) {
//       this.user = JSON.parse(stored);
//     }
//   }

//   private logout() {
//     localStorage.removeItem('user');
//     this.user = null;
//   }

//   render() {
//     return html`
//       <div class="profile-container">
//         ${this.user
//           ? html`
//               <h2>Bienvenue, ${this.user.username} 👋</h2>
//               <button class="logout-button" @click=${this.logout}>Se déconnecter</button>
//             `
//           : html`
//               <h2>Vous n'êtes pas connecté.</h2>
//               <p>Veuillez vous connecter pour accéder à votre profil.</p>
//             `}
//       </div>
//     `;
//   }
// }
