import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import ApiService from '../services/api.service';


function clearSessionStorage() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('gameSettings');
}

@customElement('login-view')

export class LoginView extends LitElement {
  static styles = css`

    .message {
      font-size: 1.2rem;
      text-align: center;
      color: var(--color-text);
      background: var(--color-surface);
      padding: 2rem;
      border-radius: 1rem;
      max-width: 400px;
      margin: 4rem auto;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-width: 400px;
      margin: 4rem auto;
    }

    input, button {
      padding: 0.75rem;
      font-size: 1rem;
    }

    .error {
      color: red;
    }
  `;

  @state() private signInForm = { username: '', password: '' };
  @state() private signInError = '';
  @state() private isLoading = false;
  @state() private show2FAForm = false;
  @state() private code2FA = '';
  @state() private isAuthenticated = false;

connectedCallback() {
  super.connectedCallback();
  const token = localStorage.getItem('token');

  if (!token) {
    clearSessionStorage();
    this.isAuthenticated = false;
    return;
  }

  ApiService.getProfile()
    .then(() => {
      this.isAuthenticated = true;
    })
    .catch(() => {
      clearSessionStorage();
      this.isAuthenticated = false;
    });
}

private async checkAuth() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;

    await ApiService.getProfile();
    this.isAuthenticated = true;
  } catch {
    clearSessionStorage();
    this.isAuthenticated = false;
  }
}


  private async handleSignIn(e: Event) {
    e.preventDefault();
    this.signInError = '';
    this.isLoading = true;

    try {
      const { username, password } = this.signInForm;
      if (!username || !password) throw new Error('Please fill in all fields');

      const response = await ApiService.login(username, password);

      if (response.twofa) {
        this.show2FAForm = true;
        return;
      }

      localStorage.setItem('user', JSON.stringify({ username: response.user.username }));
      localStorage.setItem('token', response.token); // Enregistre le token
      window.location.href = '/profile';
    } catch (error: any) {
      this.signInError = error.message || 'Login failed';
    } finally {
      this.isLoading = false;
    }
  }

  private async handle2FASubmit(e: Event) {
    e.preventDefault();
    try {
      const result = await ApiService.verify2FA(this.code2FA);
      window.location.href = '/profile';
    } catch (err: any) {
      this.signInError = err.message || '2FA failed';
    }
  }

  render() {
    if (this.isAuthenticated) {
      return html`<div class="message">Tu es déjà connecté !</div>`;
    }

    return html`
      ${this.show2FAForm ? html`
        <form @submit=${this.handle2FASubmit}>
          <input type="text" placeholder="2FA Code" .value=${this.code2FA} @input=${e => this.code2FA = (e.target as HTMLInputElement).value} required />
          <button type="submit">Verify</button>
        </form>
      ` : html`
        <form @submit=${this.handleSignIn}>
          <input type="text" placeholder="Username" .value=${this.signInForm.username} @input=${e => this.signInForm.username = (e.target as HTMLInputElement).value} required />
          <input type="password" placeholder="Password" .value=${this.signInForm.password} @input=${e => this.signInForm.password = (e.target as HTMLInputElement).value} required />
          <button type="submit" ?disabled=${this.isLoading}>${this.isLoading ? 'Signing in...' : 'Sign In'}</button>
          ${this.signInError ? html`<div class="error">${this.signInError}</div>` : ''}
        </form>
      `}
    `;
  }
}
