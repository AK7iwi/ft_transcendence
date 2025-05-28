import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { SettingsService } from '../services/settings-service';
import type { GameSettings } from '../services/settings-service';

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
    .number-input {
      width: 100%;
      padding: 0.8rem;
      font-size: 1.2rem;
      border-radius: 0.5rem;
      border: 2px solid var(--color-border);
      background: var(--color-background);
      color: var(--color-text);
    }
    .toggle-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 0;
    }
    .toggle-label {
      font-size: 1.2rem;
      color: var(--color-text);
    }
    .toggle-switch {
      position: relative;
      width: 4rem;
      height: 2rem;
    }
    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    .toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: var(--color-border);
      transition: .4s;
      border-radius: 2rem;
    }
    .toggle-slider:before {
      position: absolute;
      content: "";
      height: 1.6rem;
      width: 1.6rem;
      left: 0.2rem;
      bottom: 0.2rem;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }
    input:checked + .toggle-slider {
      background-color: var(--color-accent);
    }
    input:checked + .toggle-slider:before {
      transform: translateX(2rem);
    }
    .save-button {
      background-color: var(--color-accent);
      color: white;
      padding: 1rem 2rem;
      font-size: 1.2rem;
      border-radius: 0.5rem;
      border: none;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .save-button:hover {
      opacity: 0.9;
    }
  `;

  @state()
  private settings: GameSettings;
@state()
private showConfirmation = false;



  private colorOptions = ['black', 'red', 'blue', 'green', 'yellow', 'purple'];
  private settingsService: SettingsService;

  constructor() {
    super();
    this.settingsService = SettingsService.getInstance();
    this.settings = this.settingsService.getSettings();
  }

  private handleSettingChange(setting: keyof GameSettings, value: any) {
    this.settings = { ...this.settings, [setting]: value };
  }

private saveSettings() {
  this.settingsService.updateSettings(this.settings);
  this.showConfirmation = true;
  setTimeout(() => {
    this.showConfirmation = false;
  }, 3000); // Cache après 3 secondes
}



  render() {
    return html`

        <div class="settings-container">
          <h1 class="section-title">Game Settings</h1>

          <div class="section">
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
              <input
                type="number"
                .value=${this.settings.endScore}
                @input=${(e: Event) => this.handleSettingChange('endScore', +(e.target as HTMLInputElement).value)}
                min="1"
                max="20"
                class="number-input"
              />
            </div>

            <div class="setting-group">
              <label class="setting-label">Ball Speed</label>
              <input
                type="number"
                .value=${this.settings.ballSpeed}
                @input=${(e: Event) => this.handleSettingChange('ballSpeed', +(e.target as HTMLInputElement).value)}
                min="1"
                max="10"
                class="number-input"
              />
            </div>

            <div class="setting-group">
              <label class="setting-label">Paddle Speed</label>
              <input
                type="number"
                .value=${this.settings.paddleSpeed}
                @input=${(e: Event) => this.handleSettingChange('paddleSpeed', +(e.target as HTMLInputElement).value)}
                min="1"
                max="10"
                class="number-input"
              />
            </div>
          </div>


          <div class="flex justify-end">
          ${this.showConfirmation ? html`
  <div style="margin-bottom: 1rem; color: green; font-weight: bold;">
    Settings saved successfully
  </div>
` : ''}

            <button
              @click=${this.saveSettings}
              class="save-button"
            >
              Save Settings
            </button>
          </div>
        </div>

    `;
  }
} 