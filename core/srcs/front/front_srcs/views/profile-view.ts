import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('profile-view')
export class ProfileView extends LitElement {
  static styles = css`
    .profile-container {
      padding: 2rem;
      text-align: center;
      color: var(--color-text);
    }

    h2 {
      font-size: 2rem;
      margin-bottom: 1rem;
    }

    .logout-button {
      padding: 0.8rem 1.2rem;
      font-size: 1rem;
      border: none;
      border-radius: 0.5rem;
      background-color: var(--color-accent);
      color: white;
      cursor: pointer;
    }

    .logout-button:hover {
      opacity: 0.9;
    }
  `;

  @state()
  private user: { username: string } | null = null;

  connectedCallback() {
    super.connectedCallback();
    const stored = localStorage.getItem('user');
    if (stored) {
      this.user = JSON.parse(stored);
    }
  }

  private logout() {
    localStorage.removeItem('user');
    this.user = null;
  }

  render() {
    return html`
      <div class="profile-container">
        ${this.user
          ? html`
              <h2>Bienvenue, ${this.user.username} 👋</h2>
              <button class="logout-button" @click=${this.logout}>Se déconnecter</button>
            `
          : html`
              <h2>Vous n'êtes pas connecté.</h2>
              <p>Veuillez vous connecter pour accéder à votre profil.</p>
            `}
      </div>
    `;
  }
}
