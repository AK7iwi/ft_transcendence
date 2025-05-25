import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import ApiService from '../services/api.service';

@customElement('register-view')
export class RegisterView extends LitElement {
  static styles = css`
    form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-width: 400px;
    }

    input, button {
      padding: 0.75rem;
      font-size: 1rem;
    }
      .success {
  color: green;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}


    .error {
      color: red;
    }
  `;

  @state() private signUpForm = { username: '', password: '', confirmPassword: '' };
  @state() private signUpError = '';
  @state() private isLoading = false;
@state() private signUpSuccess = '';


  private validatePassword(password: string): string[] {
    const errors = [];
    if (password.length < 8) errors.push('Password must be at least 8 characters long');
    if (!/(?=.*[a-z])/.test(password)) errors.push('Password must contain at least one lowercase letter');
    if (!/(?=.*[A-Z])/.test(password)) errors.push('Password must contain at least one uppercase letter');
    if (!/(?=.*\d)/.test(password)) errors.push('Password must contain at least one number');
    return errors;
  }

private async handleSignUp(e: Event) {
  e.preventDefault();
  this.signUpError = '';
  this.signUpSuccess = '';
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

    await ApiService.register(username, password);

    // ✅ Succès
    this.signUpSuccess = 'Account successfully created! You can now log in.';
    this.signUpError = ''; // Efface toute erreur précédente
  } catch (error: any) {
    this.signUpError = error.message || 'Registration failed';
    this.signUpSuccess = ''; // Efface un éventuel message de succès
  } finally {
    this.isLoading = false;
  }
}


  render() {
    return html`
      <form @submit=${this.handleSignUp}>
        <input type="text" placeholder="Username" .value=${this.signUpForm.username} @input=${e => this.signUpForm.username = (e.target as HTMLInputElement).value} required />
        <input type="password" placeholder="Password" .value=${this.signUpForm.password} @input=${e => this.signUpForm.password = (e.target as HTMLInputElement).value} required />
        <input type="password" placeholder="Confirm Password" .value=${this.signUpForm.confirmPassword} @input=${e => this.signUpForm.confirmPassword = (e.target as HTMLInputElement).value} required />
        <button type="submit" ?disabled=${this.isLoading}>${this.isLoading ? 'Signing up...' : 'Sign Up'}</button>
        ${this.signUpSuccess ? html`<div class="success">${this.signUpSuccess}</div>` : ''}
        ${this.signUpError ? html`<div class="error">${this.signUpError}</div>` : ''}
      </form>
    `;
  }
}
