import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import ApiService from '../services/api.service';

@customElement('friend-view')
export class FriendView extends LitElement {
  static styles = css`
    .container {
      max-width: 600px;
      margin: 2rem auto;
    }

    input {
      padding: 0.5rem;
      margin-right: 0.5rem;
    }

    button {
      padding: 0.5rem 1rem;
    }

    .message {
      margin-top: 1rem;
      font-weight: bold;
    }

    .success {
      color: green;
    }

    .error {
      color: red;
    }

    ul {
      margin-top: 1.5rem;
      list-style: none;
      padding: 0;
    }

    li {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    img {
      border-radius: 50%;
    }
  `;

  @state() private username = '';
  @state() private message = '';
  @state() private messageType: 'success' | 'error' | '' = '';
  @state() private friends: { id: number; username: string; avatar: string }[] = [];

  connectedCallback() {
    super.connectedCallback();
    this.loadFriends();
  }

  async loadFriends() {
    try {
      const result = await ApiService.getFriends();
      this.friends = result.friends || result;
    } catch (err) {
      console.error('Failed to load friends:', err);
      this.message = 'Error loading friends';
      this.messageType = 'error';
    }
  }

  async handleAddFriend(e: Event) {
    e.preventDefault();
    this.message = '';
    this.messageType = '';

    if (!this.username.trim()) {
      this.message = 'Please enter a username';
      this.messageType = 'error';
      return;
    }

    try {
      const result = await ApiService.addFriend(this.username);
      this.message = result.message || 'Friend added';
      this.messageType = 'success';
      this.username = '';
      this.loadFriends();
    } catch (err: any) {
      this.message = err.message || 'Error';
      this.messageType = 'error';
    }
  }

  async handleRemoveFriend(friendId: number) {
    this.message = '';
    this.messageType = '';

    try {
      const result = await ApiService.removeFriend(friendId);
      this.message = result.message || 'Friend removed';
      this.messageType = 'success';
      this.loadFriends();
    } catch (err: any) {
      this.message = err.message || 'Error';
      this.messageType = 'error';
    }
  }

  render() {
    return html`
      <div class="container">
        <h2>Friend List</h2>

        <form @submit=${this.handleAddFriend}>
          <input
            type="text"
            .value=${this.username}
            @input=${(e: Event) => this.username = (e.target as HTMLInputElement).value}
            placeholder="Enter username"
            required
          />
          <button type="submit">Add Friend</button>
        </form>

        ${this.message
          ? html`<div class="message ${this.messageType}">${this.message}</div>`
          : null}

        <ul>
          ${this.friends.map(friend => html`
            <li>
              <img src="${friend.avatar || '/avatars/default.png'}" width="30" height="30" />
              ${friend.username}
              <button @click=${() => this.handleRemoveFriend(friend.id)}>Remove</button>
            </li>
          `)}
        </ul>
      </div>
    `;
  }
}
