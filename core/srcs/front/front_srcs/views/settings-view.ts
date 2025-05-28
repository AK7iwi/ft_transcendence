
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { SettingsService } from '../services/settings-service';
import type { GameSettings } from '../services/settings-service';
import ApiService from '../services/api.service';
import { API_BASE_URL } from '../config';

@customElement('settings-view')
export class SettingsView extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .settings-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    .section {
      background: var(--color-surface);
      border-radius: 1rem;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .section-title {
      font-size: 1.8rem;
      font-weight: bold;
      margin-bottom: 1.5rem;
      color: var(--color-text);
    }
    .setting-group {
      margin-bottom: 2rem;
    }
    .setting-label {
      font-size: 1.2rem;
      font-weight: 500;
      margin-bottom: 1rem;
      color: var(--color-text);
    }
    .color-options {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .color-button {
      width: 3rem;
      height: 3rem;
      border-radius: 50%;
      border: 3px solid transparent;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .color-button:hover {
      transform: scale(1.1);
    }
    .color-button.selected {
      border-color: var(--color-accent);
    }
    .number-input, .form-input {
      width: 100%;
      padding: 0.8rem;
      font-size: 1.2rem;
      border-radius: 0.5rem;
      border: 2px solid var(--color-border);
      background: var(--color-background);
      color: var(--color-text);
    }
    .save-button, .button {
      background-color: var(--color-accent);
      color: white;
      padding: 1rem 2rem;
      font-size: 1.2rem;
      border-radius: 0.5rem;
      border: none;
      cursor: pointer;
      transition: opacity 0.2s;
      display: block;
      width: 100%;
    }
    .button:hover, .save-button:hover {
      opacity: 0.9;
    }
    .form-group {
      margin-bottom: 1.5rem;
    }
    .success-message {
      color: green;
      font-weight: bold;
      margin-bottom: 1rem;
    }
    .error-message {
      color: red;
      font-weight: bold;
      margin-bottom: 1rem;
    }
  `;

  // Game Settings
  @state() private settings: GameSettings;
  @state() private showConfirmation = false;
  private settingsService: SettingsService;
  private colorOptions = ['black', 'red', 'blue', 'green', 'yellow', 'purple'];

  // User Settings
  @state() private user = { username: '', twoFactorEnabled: false };
  @state() private newUsername = '';
  @state() private newPassword = '';
  @state() private confirmPassword = '';
  @state() private qrCode = '';
  @state() private code2FA = '';
  @state() private isAuthenticated = false;
  @state() private successMessage = '';
  @state() private errorMessage = '';

  constructor() {
    super();
    this.settingsService = SettingsService.getInstance();
    this.settings = this.settingsService.getSettings();
  }

  connectedCallback() {
    super.connectedCallback();
    const token = localStorage.getItem('token');
    if (!token) return;

    ApiService.getProfile()
      .then(data => {
        this.user = {
          username: data.username,
          twoFactorEnabled: data.twoFactorEnabled,
        };
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

  private handleSettingChange(setting: keyof GameSettings, value: any) {
    this.settings = { ...this.settings, [setting]: value };
  }

  private saveSettings() {
    this.settingsService.updateSettings(this.settings);
    this.showConfirmation = true;
    setTimeout(() => {
      this.showConfirmation = false;
    }, 3000);
  }

  private async updateUsername() {
    try {
      const payload = {
        username: this.user.username,
        newUsername: this.newUsername
      };
      const updatedUser = await ApiService.updateUser(payload);
      this.user.username = updatedUser.username;
      localStorage.setItem('user', JSON.stringify(this.user));
      this.newUsername = '';
      this.showMessage('success', 'Username updated successfully');
    } catch (err) {
      console.error('Update username failed:', err);
      this.showMessage('error', 'Failed to update username');
    }
  }

  private async changePassword() {
    if (this.newPassword !== this.confirmPassword) {
      this.showMessage('error', 'Passwords do not match.');
      return;
    }
    try {
      await ApiService.updatePassword(this.user.username, this.newPassword);
      this.newPassword = '';
      this.confirmPassword = '';
      this.showMessage('success', 'Password updated successfully');
    } catch (err) {
      this.showMessage('error', 'Failed to update password');
    }
  }

  private async setup2FA() {
    try {
      const res = await ApiService.setup2FA();
      this.qrCode = res.qrCode;
    } catch (err) {
      this.showMessage('error', 'Erreur lors de la génération du QR code');
    }
  }

  private async handleVerify2FA(e: Event) {
    e.preventDefault();
    try {
      await ApiService.verify2FASetup(this.code2FA);
      this.user.twoFactorEnabled = true;
      localStorage.setItem('user', JSON.stringify(this.user));
      this.qrCode = '';
      this.code2FA = '';
      this.showMessage('success', '2FA activée avec succès');
    } catch (err) {
      this.showMessage('error', 'Échec de l’activation 2FA');
    }
  }

  render() {
    return html`
      <div class="settings-container">

        <!-- Game Settings -->
        <div class="section">
          <h1 class="section-title">Game Settings</h1>
          <div class="setting-group">
            <label class="setting-label">Ball Color</label>
            <div class="color-options">
              ${this.colorOptions.map(color => html`
                <button
                  @click=${() => this.handleSettingChange('ballColor', color)}
                  class="color-button ${this.settings.ballColor === color ? 'selected' : ''}"
                  style="background-color: ${color}"
                ></button>
              `)}
            </div>
          </div>

          <div class="setting-group">
            <label class="setting-label">Paddle Color</label>
            <div class="color-options">
              ${this.colorOptions.map(color => html`
                <button
                  @click=${() => this.handleSettingChange('paddleColor', color)}
                  class="color-button ${this.settings.paddleColor === color ? 'selected' : ''}"
                  style="background-color: ${color}"
                ></button>
              `)}
            </div>
          </div>

          <div class="setting-group">
            <label class="setting-label">End Score</label>
            <input type="number" class="number-input"
              .value=${this.settings.endScore}
              min="1" max="20"
              @input=${(e: Event) => this.handleSettingChange('endScore', +(e.target as HTMLInputElement).value)}
            />
          </div>

          <div class="setting-group">
            <label class="setting-label">Ball Speed</label>
            <input type="number" class="number-input"
              .value=${this.settings.ballSpeed}
              min="1" max="10"
              @input=${(e: Event) => this.handleSettingChange('ballSpeed', +(e.target as HTMLInputElement).value)}
            />
          </div>

          <div class="setting-group">
            <label class="setting-label">Paddle Speed</label>
            <input type="number" class="number-input"
              .value=${this.settings.paddleSpeed}
              min="1" max="10"
              @input=${(e: Event) => this.handleSettingChange('paddleSpeed', +(e.target as HTMLInputElement).value)}
            />
          </div>

          ${this.showConfirmation ? html`<div class="success-message">Settings saved successfully</div>` : ''}

          <button class="save-button" @click=${this.saveSettings}>Save Settings</button>
        </div>

        <!-- User Settings -->
        <div class="section">
          <h1 class="section-title">User Settings</h1>

          ${this.successMessage ? html`<div class="success-message">${this.successMessage}</div>` : ''}
          ${this.errorMessage ? html`<div class="error-message">${this.errorMessage}</div>` : ''}

          <div class="setting-group">
            <label class="setting-label">Current Username: ${this.user.username}</label>
            <div class="form-group">
              <label class="setting-label">New Username</label>
              <input class="form-input" .value=${this.newUsername} @input=${(e: Event) => this.newUsername = (e.target as HTMLInputElement).value} />
            </div>
            <button class="button" @click=${this.updateUsername}>Update Username</button>
          </div>

          <div class="setting-group">
            <label class="setting-label">Change Password</label>
            <div class="form-group">
              <label class="setting-label">New Password</label>
              <input type="password" class="form-input" .value=${this.newPassword} @input=${(e: Event) => this.newPassword = (e.target as HTMLInputElement).value} />
            </div>
            <div class="form-group">
              <label class="setting-label">Confirm Password</label>
              <input type="password" class="form-input" .value=${this.confirmPassword} @input=${(e: Event) => this.confirmPassword = (e.target as HTMLInputElement).value} />
            </div>
            <button class="button" @click=${this.changePassword}>Update Password</button>
          </div>

          <div class="setting-group">
            <label class="setting-label">Two-Factor Authentication (2FA)</label>
            ${this.user.twoFactorEnabled ? html`
              <p>✅ 2FA activée</p>
            ` : this.qrCode ? html`
              <div>
                <p>Scanne ce code QR avec ton application d’authentification :</p>
                <img src="${this.qrCode}" alt="QR Code" style="max-width: 200px;" />
                <form @submit=${this.handleVerify2FA}>
                  <label>Code :</label>
                  <input type="text" .value=${this.code2FA} @input=${(e: Event) => this.code2FA = (e.target as HTMLInputElement).value} />
                  <button class="button" type="submit">Vérifier</button>
                </form>
              </div>
            ` : html`
              <button class="button" @click=${this.setup2FA}>Activer 2FA</button>
            `}
          </div>
        </div>
      </div>
    `;
  }
}


// import { LitElement, html, css } from 'lit';
// import { customElement, state } from 'lit/decorators.js';
// import { SettingsService } from '../services/settings-service';
// import type { GameSettings } from '../services/settings-service';

// @customElement('settings-view')
// export class SettingsView extends LitElement {
//   static styles = css`
//     :host {
//       display: block;
//     }
//     .settings-container {
//       max-width: 800px;
//       margin: 0 auto;
//       padding: 2rem;
//     }
//     .section {
//       background: var(--color-surface);
//       border-radius: 1rem;
//       padding: 2rem;
//       margin-bottom: 2rem;
//       box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
//     }
//     .section-title {
//       font-size: 1.8rem;
//       font-weight: bold;
//       margin-bottom: 1.5rem;
//       color: var(--color-text);
//     }
//     .setting-group {
//       margin-bottom: 2rem;
//     }
//     .setting-label {
//       font-size: 1.2rem;
//       font-weight: 500;
//       margin-bottom: 1rem;
//       color: var(--color-text);
//     }
//     .color-options {
//       display: flex;
//       gap: 1rem;
//       flex-wrap: wrap;
//     }
//     .color-button {
//       width: 3rem;
//       height: 3rem;
//       border-radius: 50%;
//       border: 3px solid transparent;
//       cursor: pointer;
//       transition: transform 0.2s;
//     }
//     .color-button:hover {
//       transform: scale(1.1);
//     }
//     .color-button.selected {
//       border-color: var(--color-accent);
//     }
//     .number-input {
//       width: 100%;
//       padding: 0.8rem;
//       font-size: 1.2rem;
//       border-radius: 0.5rem;
//       border: 2px solid var(--color-border);
//       background: var(--color-background);
//       color: var(--color-text);
//     }
//     .toggle-container {
//       display: flex;
//       align-items: center;
//       justify-content: space-between;
//       padding: 1rem 0;
//     }
//     .toggle-label {
//       font-size: 1.2rem;
//       color: var(--color-text);
//     }
//     .toggle-switch {
//       position: relative;
//       width: 4rem;
//       height: 2rem;
//     }
//     .toggle-switch input {
//       opacity: 0;
//       width: 0;
//       height: 0;
//     }
//     .toggle-slider {
//       position: absolute;
//       cursor: pointer;
//       top: 0;
//       left: 0;
//       right: 0;
//       bottom: 0;
//       background-color: var(--color-border);
//       transition: .4s;
//       border-radius: 2rem;
//     }
//     .toggle-slider:before {
//       position: absolute;
//       content: "";
//       height: 1.6rem;
//       width: 1.6rem;
//       left: 0.2rem;
//       bottom: 0.2rem;
//       background-color: white;
//       transition: .4s;
//       border-radius: 50%;
//     }
//     input:checked + .toggle-slider {
//       background-color: var(--color-accent);
//     }
//     input:checked + .toggle-slider:before {
//       transform: translateX(2rem);
//     }
//     .save-button {
//       background-color: var(--color-accent);
//       color: white;
//       padding: 1rem 2rem;
//       font-size: 1.2rem;
//       border-radius: 0.5rem;
//       border: none;
//       cursor: pointer;
//       transition: opacity 0.2s;
//     }
//     .save-button:hover {
//       opacity: 0.9;
//     }
//   `;

//   @state()
//   private settings: GameSettings;
// @state()
// private showConfirmation = false;



//   private colorOptions = ['black', 'red', 'blue', 'green', 'yellow', 'purple'];
//   private settingsService: SettingsService;

//   constructor() {
//     super();
//     this.settingsService = SettingsService.getInstance();
//     this.settings = this.settingsService.getSettings();
//   }

//   private handleSettingChange(setting: keyof GameSettings, value: any) {
//     this.settings = { ...this.settings, [setting]: value };
//   }

// private saveSettings() {
//   this.settingsService.updateSettings(this.settings);
//   this.showConfirmation = true;
//   setTimeout(() => {
//     this.showConfirmation = false;
//   }, 3000); // Cache après 3 secondes
// }



//   render() {
//     return html`

//         <div class="settings-container">
//           <h1 class="section-title">Game Settings</h1>

//           <div class="section">
//             <div class="setting-group">
//               <label class="setting-label">Ball Color</label>
//               <div class="color-options">
//                 ${this.colorOptions.map(color => html`
//                   <button
//                     @click=${() => this.handleSettingChange('ballColor', color)}
//                     class="color-button ${this.settings.ballColor === color ? 'selected' : ''}"
//                     style="background-color: ${color}"
//                   ></button>
//                 `)}
//               </div>
//             </div>

//             <div class="setting-group">
//               <label class="setting-label">Paddle Color</label>
//               <div class="color-options">
//                 ${this.colorOptions.map(color => html`
//                   <button
//                     @click=${() => this.handleSettingChange('paddleColor', color)}
//                     class="color-button ${this.settings.paddleColor === color ? 'selected' : ''}"
//                     style="background-color: ${color}"
//                   ></button>
//                 `)}
//               </div>
//             </div>

//             <div class="setting-group">
//               <label class="setting-label">End Score</label>
//               <input
//                 type="number"
//                 .value=${this.settings.endScore}
//                 @input=${(e: Event) => this.handleSettingChange('endScore', +(e.target as HTMLInputElement).value)}
//                 min="1"
//                 max="20"
//                 class="number-input"
//               />
//             </div>

//             <div class="setting-group">
//               <label class="setting-label">Ball Speed</label>
//               <input
//                 type="number"
//                 .value=${this.settings.ballSpeed}
//                 @input=${(e: Event) => this.handleSettingChange('ballSpeed', +(e.target as HTMLInputElement).value)}
//                 min="1"
//                 max="10"
//                 class="number-input"
//               />
//             </div>

//             <div class="setting-group">
//               <label class="setting-label">Paddle Speed</label>
//               <input
//                 type="number"
//                 .value=${this.settings.paddleSpeed}
//                 @input=${(e: Event) => this.handleSettingChange('paddleSpeed', +(e.target as HTMLInputElement).value)}
//                 min="1"
//                 max="10"
//                 class="number-input"
//               />
//             </div>
//           </div>


//           <div class="flex justify-end">
//           ${this.showConfirmation ? html`
//   <div style="margin-bottom: 1rem; color: green; font-weight: bold;">
//     Settings saved successfully
//   </div>
// ` : ''}

//             <button
//               @click=${this.saveSettings}
//               class="save-button"
//             >
//               Save Settings
//             </button>
//           </div>
//         </div>

//     `;
//   }
// } 