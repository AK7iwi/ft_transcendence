import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import ApiService from '../services/api.service';
import { API_BASE_URL } from '../config';

@customElement('friend-profile-view')
export class FriendProfileView extends LitElement {
  static styles = css`
    .profile-container {
      padding: 2rem;
      max-width: 500px;
      margin: auto;
      color: var(--color-text);
    }
    h2 {
      font-size: 2rem;
      margin-bottom: 1.5rem;
      text-align: center;
    }
    .readonly-info {
      background: var(--color-surface);
      padding: 1rem;
      border-radius: 0.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .info-line {
      margin-bottom: 1rem;
      font-size: 1.1rem;
    }
    .label {
      font-weight: 600;
    }
    img {
      border-radius: 50%;
      border: 2px solid #ccc;
    }
    .back-button {
      margin-top: 2rem;
      display: block;
      width: 100%;
      text-align: center;
      padding: 0.75rem;
      background: var(--color-accent);
      color: white;
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
    }
    .back-button:hover {
      opacity: 0.9;
    }
  `;

  @state() private user = { username: '', avatar: '' };
  @state() private avatarUrl: string = '';

  connectedCallback() {
    super.connectedCallback();
    const urlParams = new URLSearchParams(window.location.search);
    const friendId = urlParams.get('id');
    if (!friendId) return;

    ApiService.getUserById(friendId)
      .then(data => {
        this.user = {
          username: data.username,
          avatar: data.avatar
        };
        this.avatarUrl = data.avatar && data.avatar !== ''
  ? (data.avatar.startsWith('/') ? `${API_BASE_URL}${data.avatar}` : `${API_BASE_URL}/avatars/${data.avatar}`)
  : `${API_BASE_URL}/avatars/default.png`;

      })
      .catch(err => {
        console.error('Erreur chargement profil ami:', err);
      });
  }

  render() {
    return html`
      <div class="profile-container">
        <h2>Profile of ${this.user.username}</h2>
        <div class="readonly-info">
          <div class="info-line"><span class="label">Username:</span> ${this.user.username}</div>
        </div>
        <div style="text-align: center;">
          <img src="${this.avatarUrl}" alt="Avatar" width="120" height="120" />
        </div>
        <button class="back-button" @click=${() => window.history.back()}>← Back to Chat</button>
      </div>
    `;
  }
}
