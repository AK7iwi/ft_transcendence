import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

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
  `;

  @state()
  private signInForm = {
    email: '',
    password: ''
  };

  @state()
  private signUpForm = {
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  private handleSignIn(e: Event) {
    e.preventDefault();
    // TODO: Implement sign in logic
    console.log('Sign in:', this.signInForm);
  }

  private handleSignUp(e: Event) {
    e.preventDefault();
    // TODO: Implement sign up logic
    console.log('Sign up:', this.signUpForm);
  }

  render() {
    return html`
      <div class="main-container">
        <h1 class="welcome-title">Welcome to Pong</h1>
        
        <div class="auth-container">
          <!-- Sign In Block -->
          <div class="auth-block">
            <h2 class="auth-title">Sign In</h2>
            <form @submit=${this.handleSignIn}>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input
                  type="email"
                  class="form-input"
                  .value=${this.signInForm.email}
                  @input=${(e: Event) => this.signInForm.email = (e.target as HTMLInputElement).value}
                  required
                  autocomplete="off"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Password</label>
                <input
                  type="password"
                  class="form-input"
                  .value=${this.signInForm.password}
                  @input=${(e: Event) => this.signInForm.password = (e.target as HTMLInputElement).value}
                  required
                  autocomplete="new-password"
                />
              </div>
              <button type="submit" class="submit-button">Sign In</button>
            </form>
          </div>

          <!-- Sign Up Block -->
          <div class="auth-block">
            <h2 class="auth-title">Sign Up</h2>
            <form @submit=${this.handleSignUp}>
              <div class="form-group">
                <label class="form-label">Username</label>
                <input
                  type="text"
                  class="form-input"
                  .value=${this.signUpForm.username}
                  @input=${(e: Event) => this.signUpForm.username = (e.target as HTMLInputElement).value}
                  required
                  autocomplete="off"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input
                  type="email"
                  class="form-input"
                  .value=${this.signUpForm.email}
                  @input=${(e: Event) => this.signUpForm.email = (e.target as HTMLInputElement).value}
                  required
                  autocomplete="off"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Password</label>
                <input
                  type="password"
                  class="form-input"
                  .value=${this.signUpForm.password}
                  @input=${(e: Event) => this.signUpForm.password = (e.target as HTMLInputElement).value}
                  required
                  autocomplete="new-password"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Confirm Password</label>
                <input
                  type="password"
                  class="form-input"
                  .value=${this.signUpForm.confirmPassword}
                  @input=${(e: Event) => this.signUpForm.confirmPassword = (e.target as HTMLInputElement).value}
                  required
                  autocomplete="new-password"
                />
              </div>
              <button type="submit" class="submit-button">Sign Up</button>
            </form>
          </div>
        </div>
      </div>
    `;
  }
} 