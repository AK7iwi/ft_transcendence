import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { wsInstance } from '../services/websocket-instance';
import ApiService from '../services/api.service';

@customElement('chat-view')
export class ChatView extends LitElement {
  static styles = css`
    :host {
      display: block;
      height: 100vh;
      font-family: sans-serif;
      background: transparent;
    }

    .layout {
      display: flex;
      height: 100%;
    }

    .sidebar {
      width: 250px;
      background: #1e1e2f;
      color: white;
      padding: 1rem;
      box-sizing: border-box;
      border-right: 1px solid #333;
    }

    .friend {
      padding: 0.5rem;
      cursor: pointer;
      border-radius: 6px;
    }

    .friend:hover {
      background: #2c2c44;
    }

    .friend.selected {
      background: #3f3f6b;
    }

    .chat-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 1rem;
      box-sizing: border-box;
    }

    .messages {
      flex: 1;
      overflow-y: auto;
      background: #f5f5f5;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      color: black;
    }

    .message {
      margin-bottom: 0.75rem;
      word-wrap: break-word;
    }

    .input {
      display: flex;
      gap: 0.5rem;
    }

    input {
      flex: 1;
      padding: 0.75rem;
      font-size: 1rem;
      border: 1px solid #ccc;
      border-radius: 6px;
      background: white;
    }

    button {
      padding: 0.75rem 1.25rem;
      font-size: 1rem;
      background-color: #6366f1;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }

    button:hover {
      background-color: #4f46e5;
    }
  `;

  @state() private friends: any[] = [];
  @state() private selectedFriend: any = null;
  @state() private messages: { clientId: string; text: string }[] = [];
  @state() private inputMessage: string = '';
  @state() private currentUserId: number | null = null;

connectedCallback() {
  super.connectedCallback();
  wsInstance.on('dm', this.handleIncomingMessage); // tout de suite !
  this.fetchInitialData();
}


  disconnectedCallback() {
    super.disconnectedCallback();
    wsInstance.off('dm', this.handleIncomingMessage);
  }

  async fetchInitialData() {
    try {
      const [userRes, friends] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }).then(res => res.json()),
        ApiService.getFriends()
      ]);

      this.currentUserId = userRes.id;
      this.friends = friends.friends || friends;

      if (!this.selectedFriend && this.friends.length > 0) {
        this.selectedFriend = this.friends[0];
      }

      console.log('⚙️ [Init OK] currentUserId =', this.currentUserId);
      console.log('⚙️ [Init OK] selectedFriend =', this.selectedFriend);

      wsInstance.on('dm', this.handleIncomingMessage);
    } catch (err) {
      console.error('❌ Erreur de chargement initial :', err);
    }
  }

handleIncomingMessage = (message: any) => {
  if (this.currentUserId === null || this.selectedFriend === null) {
    setTimeout(() => this.handleIncomingMessage(message), 100); // attendre que l'init finisse
    return;
  }

  const isOwnMessage = message.senderId === this.currentUserId;
  const isFromSelectedFriend = message.senderId === this.selectedFriend.id;

  if (isOwnMessage || isFromSelectedFriend) {
    this.messages = [
      ...this.messages,
      {
        clientId: isOwnMessage ? 'Vous' : this.selectedFriend.username,
        text: message.text
      }
    ];
    console.log('[ChatView] ✅ Message affiché');
  } else {
    console.warn('[ChatView] ❌ Ignoré : senderId ne correspond pas');
  }
};


  sendMessage() {
    if (this.inputMessage.trim() && this.selectedFriend) {
      wsInstance.send('dm', {
        toUserId: this.selectedFriend.id,
        text: this.inputMessage
      });

      this.messages = [
        ...this.messages,
        {
          clientId: 'Vous',
          text: this.inputMessage
        }
      ];
      this.inputMessage = '';
    }
  }

  selectFriend(friend: any) {
    this.selectedFriend = friend;
    this.messages = []; // TODO: charger historique si besoin
  }

  render() {
    return html`
      <div class="layout">
        <div class="sidebar">
          <h3>Mes amis</h3>
          ${this.friends.map(friend => html`
            <div
              class="friend ${this.selectedFriend?.id === friend.id ? 'selected' : ''}"
              @click=${() => this.selectFriend(friend)}
            >
              ${friend.username}
            </div>
          `)}
        </div>

        <div class="chat-area">
          ${this.selectedFriend
            ? html`
              <h2>Chat avec ${this.selectedFriend.username}</h2>
              <div class="messages">
                ${this.messages.map(msg => html`
                  <div class="message">
                    <strong>${msg.clientId}</strong>: ${msg.text}
                  </div>
                `)}
              </div>
              <div class="input">
                <input
                  type="text"
                  .value=${this.inputMessage}
                  @input=${(e: Event) => (this.inputMessage = (e.target as HTMLInputElement).value)}
                  @keydown=${(e: KeyboardEvent) => {
                    if (e.key === 'Enter') this.sendMessage();
                  }}
                />
                <button @click=${this.sendMessage}>Envoyer</button>
              </div>
            `
            : html`<p>Sélectionnez un ami pour commencer à discuter.</p>`}
        </div>
      </div>
    `;
  }
}
