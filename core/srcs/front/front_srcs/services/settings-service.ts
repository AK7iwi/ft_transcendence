export interface GameSettings {
  ballColor: string;
  paddleColor: string;
  endScore: number;
  ballSpeed: number;
  paddleSpeed: number;
  soundEnabled: boolean;
  musicEnabled: boolean;
}

export class SettingsService {
  private static instance: SettingsService;
  private settings: GameSettings = {
    ballColor: 'black',
    paddleColor: 'black',
    endScore: 3,
    ballSpeed: 5,
    paddleSpeed: 5,
    soundEnabled: true,
    musicEnabled: true
  };

  private constructor() {
    // Load settings from localStorage if available
    const savedSettings = localStorage.getItem('gameSettings');
    if (savedSettings) {
      this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
    }
  }

  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  public getSettings(): GameSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<GameSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    localStorage.setItem('gameSettings', JSON.stringify(this.settings));
    // Dispatch event to notify components of settings change
    window.dispatchEvent(new CustomEvent('settingsChanged', { detail: this.settings }));
  }
} 