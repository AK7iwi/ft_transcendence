import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('profile-view')
export class ProfileView extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
  `;

  @state()
  private user = {
    username: 'Player1',
    email: 'player1@example.com',
    twoFactorEnabled: false,
    stats: {
      gamesPlayed: 0,
      gamesWon: 0,
      tournamentsWon: 0,
      winRate: '0%'
    }
  };

  @state()
  private isEditing = false;

  @state()
  private editForm = {
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  render() {
    return html`
      <base-view>
        <div class="max-w-4xl mx-auto">
          <div class="flex justify-between items-center mb-8">
            <h1 class="text-3xl font-bold">Profile</h1>
            <button 
              @click=${() => this.isEditing = true}
              class="bg-accent text-white py-2 px-4 rounded hover:bg-opacity-90"
            >
              Edit Profile
            </button>
          </div>

          ${this.isEditing ? this.renderEditForm() : this.renderProfile()}
        </div>
      </base-view>
    `;
  }

  private renderProfile() {
    return html`
      <div class="grid gap-8 md:grid-cols-2">
        <!-- User Info -->
        <section class="bg-primary p-6 rounded-lg">
          <h2 class="text-xl font-bold mb-4">User Information</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-400">Username</label>
              <p class="text-lg">${this.user.username}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-400">Email</label>
              <p class="text-lg">${this.user.email}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-400">Two-Factor Authentication</label>
              <p class="text-lg">${this.user.twoFactorEnabled ? 'Enabled' : 'Disabled'}</p>
            </div>
          </div>
        </section>

        <!-- Stats -->
        <section class="bg-primary p-6 rounded-lg">
          <h2 class="text-xl font-bold mb-4">Game Statistics</h2>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-400">Games Played</label>
              <p class="text-2xl font-bold">${this.user.stats.gamesPlayed}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-400">Games Won</label>
              <p class="text-2xl font-bold">${this.user.stats.gamesWon}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-400">Tournaments Won</label>
              <p class="text-2xl font-bold">${this.user.stats.tournamentsWon}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-400">Win Rate</label>
              <p class="text-2xl font-bold">${this.user.stats.winRate}</p>
            </div>
          </div>
        </section>
      </div>
    `;
  }

  private renderEditForm() {
    return html`
      <div class="bg-primary p-6 rounded-lg">
        <h2 class="text-xl font-bold mb-4">Edit Profile</h2>
        <form @submit=${this.handleSubmit} class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              .value=${this.editForm.username}
              @input=${(e: Event) => this.editForm = {...this.editForm, username: (e.target as HTMLInputElement).value}}
              class="w-full p-2 rounded bg-gray-800 text-white border border-gray-700"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              .value=${this.editForm.email}
              @input=${(e: Event) => this.editForm = {...this.editForm, email: (e.target as HTMLInputElement).value}}
              class="w-full p-2 rounded bg-gray-800 text-white border border-gray-700"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Current Password</label>
            <input
              type="password"
              .value=${this.editForm.currentPassword}
              @input=${(e: Event) => this.editForm = {...this.editForm, currentPassword: (e.target as HTMLInputElement).value}}
              class="w-full p-2 rounded bg-gray-800 text-white border border-gray-700"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">New Password</label>
            <input
              type="password"
              .value=${this.editForm.newPassword}
              @input=${(e: Event) => this.editForm = {...this.editForm, newPassword: (e.target as HTMLInputElement).value}}
              class="w-full p-2 rounded bg-gray-800 text-white border border-gray-700"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Confirm Password</label>
            <input
              type="password"
              .value=${this.editForm.confirmPassword}
              @input=${(e: Event) => this.editForm = {...this.editForm, confirmPassword: (e.target as HTMLInputElement).value}}
              class="w-full p-2 rounded bg-gray-800 text-white border border-gray-700"
            />
          </div>
          <div class="flex justify-end space-x-4">
            <button
              type="button"
              @click=${() => this.isEditing = false}
              class="px-4 py-2 text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="bg-accent text-white py-2 px-4 rounded hover:bg-opacity-90"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    `;
  }

  private handleSubmit(e: Event) {
    e.preventDefault();
    // Profile update logic will be added here
    console.log('Updating profile:', this.editForm);
    this.isEditing = false;
  }
} 