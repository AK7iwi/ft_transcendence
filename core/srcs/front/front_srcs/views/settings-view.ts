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
  `;

  @state()
  private settings: GameSettings;

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
  }

  render() {
    return html`
      <base-view>
        <div class="max-w-2xl mx-auto">
          <h1 class="text-3xl font-bold mb-8">Settings</h1>

          <div class="space-y-8">
            <!-- Game Settings -->
            <section class="bg-primary p-6 rounded-lg">
              <h2 class="text-xl font-bold mb-4">Game Settings</h2>
              
              <div class="space-y-4">
                <!-- Ball Color -->
                <div>
                  <label class="block text-sm font-medium mb-2">Ball Color</label>
                  <div class="flex space-x-2">
                    ${this.colorOptions.map(color => html`
                      <button
                        @click=${() => this.handleSettingChange('ballColor', color)}
                        class="w-8 h-8 rounded-full ${this.settings.ballColor === color ? 'ring-2 ring-accent' : ''}"
                        style="background-color: ${color}"
                      ></button>
                    `)}
                  </div>
                </div>

                <!-- Paddle Color -->
                <div>
                  <label class="block text-sm font-medium mb-2">Paddle Color</label>
                  <div class="flex space-x-2">
                    ${this.colorOptions.map(color => html`
                      <button
                        @click=${() => this.handleSettingChange('paddleColor', color)}
                        class="w-8 h-8 rounded-full ${this.settings.paddleColor === color ? 'ring-2 ring-accent' : ''}"
                        style="background-color: ${color}"
                      ></button>
                    `)}
                  </div>
                </div>

                <!-- End Score -->
                <div>
                  <label class="block text-sm font-medium mb-2">End Score</label>
                  <input
                    type="number"
                    .value=${this.settings.endScore}
                    @input=${(e: Event) => this.handleSettingChange('endScore', +(e.target as HTMLInputElement).value)}
                    min="1"
                    max="20"
                    class="w-full"
                  />
                </div>

                <!-- Ball Speed -->
                <div>
                  <label class="block text-sm font-medium mb-2">Ball Speed</label>
                  <input
                    type="number"
                    .value=${this.settings.ballSpeed}
                    @input=${(e: Event) => this.handleSettingChange('ballSpeed', +(e.target as HTMLInputElement).value)}
                    min="1"
                    max="10"
                    class="w-full"
                  />
                </div>

                <!-- Paddle Speed -->
                <div>
                  <label class="block text-sm font-medium mb-2">Paddle Speed</label>
                  <input
                    type="number"
                    .value=${this.settings.paddleSpeed}
                    @input=${(e: Event) => this.handleSettingChange('paddleSpeed', +(e.target as HTMLInputElement).value)}
                    min="1"
                    max="10"
                    class="w-full"
                  />
                </div>
              </div>
            </section>

            <!-- Audio Settings -->
            <section class="bg-primary p-6 rounded-lg">
              <h2 class="text-xl font-bold mb-4">Audio Settings</h2>
              
              <div class="space-y-4">
                <!-- Sound Effects -->
                <div class="flex items-center justify-between">
                  <label class="text-sm font-medium">Sound Effects</label>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      .checked=${this.settings.soundEnabled}
                      @change=${(e: Event) => this.handleSettingChange('soundEnabled', (e.target as HTMLInputElement).checked)}
                      class="sr-only peer"
                    />
                    <div class="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                  </label>
                </div>

                <!-- Background Music -->
                <div class="flex items-center justify-between">
                  <label class="text-sm font-medium">Background Music</label>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      .checked=${this.settings.musicEnabled}
                      @change=${(e: Event) => this.handleSettingChange('musicEnabled', (e.target as HTMLInputElement).checked)}
                      class="sr-only peer"
                    />
                    <div class="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                  </label>
                </div>
              </div>
            </section>

            <!-- Save Button -->
            <div class="flex justify-end">
              <button
                @click=${this.saveSettings}
                class="bg-accent text-white py-2 px-6 rounded hover:bg-opacity-90"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </base-view>
    `;
  }
} 