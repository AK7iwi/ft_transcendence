import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import ApiService from '../services/api.service';

@customElement('home-view')
export class HomeView extends LitElement {
  static styles = css`
    :host {
      display: block;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      padding: 2rem;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    .main-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      height: 100%;
      width: 100%;
      padding-top: 5rem;
      overflow: hidden;
    }

    .welcome-title {
      text-align: center;
      font-size: 4rem;
      font-weight: bold;
      margin-bottom: 3rem;
      color: var(--color-text);
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
    }

    .auth-container {
      display: flex;
      gap: 2rem;
      justify-content: center;
      width: 100%;
      max-height: calc(100% - 15rem);
      overflow: hidden;
    }

    .auth-block {
      background: var(--color-surface);
      border-radius: 1rem;
      padding: 2rem;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s;
    }

    .auth-block:hover {
      transform: translateY(-4px);
    }

    .auth-title {
      font-size: 1.5rem;
      font-weight: bold;
      margin-bottom: 1.5rem;
      color: var(--color-text);
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-label {
      display: block;
      font-size: 0.9rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
      color: var(--color-text-secondary);
    }

    .form-input {
      width: 100%;
      padding: 0.8rem;
      font-size: 1rem;
      border-radius: 0.5rem;
      border: 2px solid var(--color-border);
      background: var(--color-background);
      color: var(--color-text);
      transition: border-color 0.2s;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--color-accent);
    }

    .submit-button {
      width: 100%;
      padding: 0.8rem;
      font-size: 1rem;
      font-weight: 500;
      color: white;
      background: var(--color-accent);
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .submit-button:hover {
      opacity: 0.9;
    }

    .error-message {
      color: var(--color-error);
      font-size: 0.875rem;
      margin-top: 0.5rem;
      margin-bottom: 1rem;
    }

    .submit-button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  `;

  @state() private signInForm = { username: '', password: '' };
  @state() private signUpForm = { username: '', password: '', confirmPassword: '' };
  @state() private signInError = '';
  @state() private signUpError = '';
  @state() private isLoading = false;
  @state() private isAuthenticated = false;
  @state() private code2FA = '';
  @state() private show2FAForm = false;

connectedCallback() {
  super.connectedCallback();

  const token = localStorage.getItem('token');
  if (!token) {
    this.isAuthenticated = false;
    return;
  }

  // Vérifie le token côté serveur
  ApiService.getProfile()
    .then(() => {
      this.isAuthenticated = true;
    })
    .catch(() => {
      // Token invalide → utilisateur déconnecté
      this.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    });
}

private async handleSignIn(e: Event) {
    e.preventDefault();
    this.signInError = '';
    this.isLoading = true;

    try {
      const { username, password } = this.signInForm;
      if (!username || !password) throw new Error('Please fill in all fields');

      const response = await ApiService.login(username, password);
      console.log('Login response:', response);

      if (response.twofa) {
        this.resetForms();
        this.show2FAForm = true;
      } else {
        localStorage.setItem('user', JSON.stringify({ username: response.user.username }));
        this.resetForms();
        window.location.href = '/profile';
      }

    } catch (error) {
      this.signInError = error instanceof Error ? error.message : 'Login failed';
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


private async handleSignUp(e: Event) {
  e.preventDefault();
  this.signUpError = '';
  this.isLoading = true;

  try {
    const { username, password, confirmPassword } = this.signUpForm;

    if (!username || !password || !confirmPassword)
      throw new Error('Please fill in all fields');

    if (password !== confirmPassword)
      throw new Error('Passwords do not match');

    const passwordErrors = this.validatePassword(password);
    if (passwordErrors.length > 0)
      throw new Error(passwordErrors.join(', '));

    const response = await ApiService.register(username, password);
console.log('Registration successful:', response);

// ✅ Réinitialisation seulement en cas de succès complet
this.resetForms();
this.signUpError = '';


  } catch (error) {
    // ✅ Garde l'erreur pour affichage
    this.signUpError = error instanceof Error
      ? error.message
      : 'Registration failed';
  } finally {
    this.isLoading = false;
  }
}


  private resetForms() {
    this.signInForm = { username: '', password: '' };
    this.signUpForm = { username: '', password: '', confirmPassword: '' };
    // this.signInError = '';
    // this.signUpError = '';
  }

  private validatePassword(password: string): string[] {
    const errors = [];
    if (password.length < 8) errors.push('Password must be at least 8 characters long');
    if (!/(?=.*[a-z])/.test(password)) errors.push('Password must contain at least one lowercase letter');
    if (!/(?=.*[A-Z])/.test(password)) errors.push('Password must contain at least one uppercase letter');
    if (!/(?=.*\d)/.test(password)) errors.push('Password must contain at least one number');
    return errors;
  }

render() {
    return html`
      <div class="main-container">
        <h1 class="welcome-title">Welcome to Pong</h1>

        ${this.show2FAForm ? html`
          <div class="auth-block">
            <h2 class="auth-title">Two-Factor Verification</h2>
            <form @submit=${this.handle2FASubmit}>
              <div class="form-group">
                <label class="form-label">Enter 2FA Code</label>
                <input type="text" class="form-input" .value=${this.code2FA} @input=${(e: Event) => this.code2FA = (e.target as HTMLInputElement).value} required />
              </div>
              ${this.signInError ? html`<div class="error-message">${this.signInError}</div>` : ''}
              <button type="submit" class="submit-button">Verify</button>
            </form>
          </div>
        ` : html`
          <div class="auth-container">
            <div class="auth-block">
              <h2 class="auth-title">Sign In</h2>
              <form @submit=${this.handleSignIn}>
                <div class="form-group">
                  <label class="form-label">Username</label>
                  <input type="text" class="form-input" .value=${this.signInForm.username} @input=${(e: Event) => this.signInForm.username = (e.target as HTMLInputElement).value} required ?disabled=${this.isLoading} />
                </div>
                <div class="form-group">
                  <label class="form-label">Password</label>
                  <input type="password" class="form-input" .value=${this.signInForm.password} @input=${(e: Event) => this.signInForm.password = (e.target as HTMLInputElement).value} required ?disabled=${this.isLoading} />
                </div>
                ${this.signInError ? html`<div class="error-message">${this.signInError}</div>` : ''}
                <button type="submit" class="submit-button" ?disabled=${this.isLoading}>
                  ${this.isLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            </div>

            <div class="auth-block">
              <h2 class="auth-title">Sign Up</h2>
              <form @submit=${this.handleSignUp}>
                <div class="form-group">
                  <label class="form-label">Username</label>
                  <input type="text" class="form-input" .value=${this.signUpForm.username} @input=${(e: Event) => this.signUpForm.username = (e.target as HTMLInputElement).value} required ?disabled=${this.isLoading} />
                </div>
                <div class="form-group">
                  <label class="form-label">Password</label>
                  <input type="password" class="form-input" .value=${this.signUpForm.password} @input=${(e: Event) => this.signUpForm.password = (e.target as HTMLInputElement).value} required ?disabled=${this.isLoading} />
                </div>
                <div class="form-group">
                  <label class="form-label">Confirm Password</label>
                  <input type="password" class="form-input" .value=${this.signUpForm.confirmPassword} @input=${(e: Event) => this.signUpForm.confirmPassword = (e.target as HTMLInputElement).value} required ?disabled=${this.isLoading} />
                </div>
                ${this.signUpError ? html`<div class="error-message">${this.signUpError}</div>` : ''}
                <button type="submit" class="submit-button" ?disabled=${this.isLoading}>
                  ${this.isLoading ? 'Signing up...' : 'Sign Up'}
                </button>
              </form>
            </div>
          </div>
        `}
      </div>
    `;
  }
}
