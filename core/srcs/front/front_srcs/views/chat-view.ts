import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import ApiService from '../services/api.service';
import { API_BASE_URL } from '../config';

import { Router } from '@vaadin/router';

document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target.classList.contains('invite-play-btn')) {
    const route = target.getAttribute('data-link');
    if (route) {
      e.preventDefault();
      Router.go(route); // Navigation SPA sans reload
    }
  }
});


interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  avatar: string;
}

@customElement('chat-view')
export class ChatView extends LitElement {


private async handleBlockUser() {
  if (!this.selectedConversationId) return;
  try {
    const blockedId = Number(this.selectedConversationId);
    console.log('[BLOCK] Attempting to block ID:', blockedId);

    await ApiService.blockUser(blockedId);
    this.flashMessage = 'Utilisateur bloqué avec succès.';
    this.flashType = 'success';

    // Efface le message après 3 secondes
    setTimeout(() => {
      this.flashMessage = '';
      this.flashType = '';
    }, 3000);
  } catch (err) {
    console.error('Erreur lors du blocage de l’utilisateur :', err);
    this.flashMessage = 'Erreur lors du blocage.';
    this.flashType = 'error';
  }
}


  static styles = css`
    :host { display: block; }
    .flash-message {
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  border-radius: 0.5rem;
  font-weight: bold;
  text-align: center;
}
.flash-message.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}
.flash-message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

    .chat-wrapper { display: flex; max-width: 1200px; height: 700px; margin: 0 auto; padding: 2rem; gap: 2rem; overflow-x: hidden; }
    .conversations { width: 300px; height: 100%; border: 1px solid var(--color-border); border-radius: 0.5rem; background: var(--color-surface); overflow-y: auto; }
    .conversation-item { display: flex; align-items: center; padding: 1rem; border-bottom: 1px solid var(--color-border); cursor: pointer; transition: background 0.2s; }
    .conversation-item:last-child { border-bottom: none; }
    .conversation-item:hover, .conversation-item.selected { background: var(--color-hover); }
    .conversation-info { display: flex; flex-direction: column; }
    .conversation-name { font-weight: bold; color: var(--color-text); margin-bottom: 0.25rem; }
    .conversation-last { font-size: 0.9rem; color: var(--color-muted); }
    .chat-area { flex: 1; display: flex; flex-direction: column; height: 100%; }
    .chat-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 1rem; border-bottom: 1px solid var(--color-border); margin-bottom: 1rem; }
    .header-info { display: flex; align-items: center; }
    .chat-with-name { font-size: 1.5rem; font-weight: bold; color: var(--color-text); }
    .chat-actions { display: flex; gap: 0.5rem; }
    .chat-button { padding: 0.5rem 1rem; font-size: 0.9rem; border-radius: 0.5rem; border: none; cursor: pointer; transition: background 0.2s; }
    .invite-button { background: var(--color-accent); color: white; }
    .invite-button:hover { opacity: 0.9; }
    .block-button { background: var(--color-error); color: white; }
    .block-button:hover { opacity: 0.9; }
    .profile-button { background: var(--color-surface); color: var(--color-text); border: 1px solid var(--color-border); }
    .profile-button:hover { background: var(--color-hover); }
    .messages { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 1rem; background: var(--color-surface); }
    .message-container { display: flex; width: 100%; margin-bottom: 1rem; }
    .message-container.left { justify-content: flex-start; }
    .message-container.right { justify-content: flex-end; }
    .bubble { max-width: 60%; padding: 0.75rem 1rem; border-radius: 1rem; line-height: 1.4; overflow-wrap: break-word; word-break: break-word; white-space: normal; }
    .bubble.left { background: var(--color-surface); border: 1px solid var(--color-border); border-top-left-radius: 0; }
    .bubble.right { background: var(--color-accent); color: white; border-top-right-radius: 0; }
    .input-container { display: flex; margin-top: 1rem; }
    .input-container input { flex: 1; padding: 0.8rem; font-size: 1rem; border: 1px solid var(--color-border); border-radius: 0.5rem 0 0 0.5rem; }
    .send-button { padding: 0 1rem; background: var(--color-accent); color: white; border: none; border-radius: 0 0.5rem 0.5rem 0; cursor: pointer; }
    .send-button:disabled { opacity: 0.5; cursor: default; }
  `;

  @state() private websocket: WebSocket | null = null;
  @state() private inputText = '';
  @state() private selectedConversationId: string = '';
@state() private currentUserId: number = 0;

  @state() private messages: { author: string; text: string; me: boolean }[] = [];
  @state() private conversations: Conversation[] = [];
@state() private flashMessage: string = '';
@state() private flashType: 'success' | 'error' | '' = '';


connectedCallback() {
  super.connectedCallback();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  this.currentUserId = user?.id || 0;

  console.log('[CHAT] Connected as user ID:', this.currentUserId); // ✅ vérif visuelle

  this.loadFriendsAsConversations();
  this.setupWebSocket();
}

firstUpdated(_changedProperties: Map<string | number | symbol, unknown>) {
  this.renderRoot.addEventListener('click', (e: Event) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('invite-play-btn')) {
      const route = target.getAttribute('data-link');
      if (route) {
        e.preventDefault();
        Router.go(route);
      }
    }
  });
}


  async loadFriendsAsConversations() {
    const result = await ApiService.getFriends();
    this.conversations = result.map((friend: any) => ({
      id: String(friend.id),
      name: friend.username,
      lastMessage: '',
      avatar: `${API_BASE_URL}/avatars/${friend.avatar || 'default.png'}`
    }));
  }


  
  setupWebSocket() {
    this.websocket = new WebSocket(`${API_BASE_URL.replace(/^http/, 'ws')}/ws`);

    this.websocket.onopen = () => {
      const token = localStorage.getItem('token');
      if (token) {
        this.websocket!.send(JSON.stringify({
          type: 'auth',
          payload: { token }
        }));
      }
    };

    this.websocket.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'dm') {
          const { senderId, text } = data;

          if (String(senderId) === this.selectedConversationId) {
            this.messages = [
              ...this.messages,
              {
                author: this.conversations.find(c => c.id === String(senderId))?.name || 'Unknown',
                text,
                me: false
              }
            ];
          }
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    };
  }

private inviteToPlay(friendId?: string) {
  console.log('[INVITE] Clicked Invite to Play →', friendId);
  console.log('[INVITE] currentUserId =', this.currentUserId);
  console.log('[INVITE] WebSocket is', this.websocket);

  if (!friendId || !this.currentUserId) return;
  if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
    console.warn('[INVITE] WebSocket not ready');
    return;
  }

  const gameUrl = `/game-remote?id=${this.currentUserId}`;

  const invitationMessage = `
    <div>
      🎮 <strong>Invitation to play Pong!</strong><br/>
      <button 
        data-link="${gameUrl}" 
        class="invite-play-btn" 
        style="margin-top: 5px; padding: 6px 12px; background-color: #6366f1; color: white; border: none; border-radius: 4px; cursor: pointer;">
        ▶ Play with me
      </button>
    </div>
  `;

  this.websocket.send(JSON.stringify({
    type: 'dm',
    payload: {
      toUserId: Number(friendId),
      text: invitationMessage
    }
  }));

  console.log('[INVITE] Message sent over WebSocket:', invitationMessage);

  this.messages = [...this.messages, {
    author: 'You',
    text: invitationMessage,
    me: true
  }];
}



  async loadMessages(friendId: string) {
    this.selectedConversationId = friendId;

    try {
      const result = await ApiService.getMessages(friendId);
      this.messages = result.map((msg: any) => ({
        author: msg.sender?.username || '???',
        text: msg.content,
        me: msg.sender?.id === this.currentUserId
      }));

      this.updateComplete.then(() => {
        const container = this.renderRoot.querySelector('.messages')!;
        container.scrollTop = container.scrollHeight;
      });

    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }

  private handleInput(e: Event) {
    this.inputText = (e.target as HTMLInputElement).value;
  }

  async sendMessage() {
    if (!this.inputText.trim()) return;

    const toUserId = Number(this.selectedConversationId);
    const text = this.inputText.trim();

    try {
      await ApiService.sendMessage({ receiverId: toUserId, content: text });

      this.websocket?.send(JSON.stringify({
        type: 'dm',
        payload: { toUserId, text }
      }));

      this.messages = [...this.messages, {
        author: 'You',
        text,
        me: true
      }];
      this.inputText = '';

      this.updateComplete.then(() => {
        const container = this.renderRoot.querySelector('.messages')!;
        container.scrollTop = container.scrollHeight;
      });

    } catch (err) {
      console.error('❌ Échec envoi message:', err);
    }
  }
  private viewFriendProfile(friendId?: string) {
  if (!friendId) return;
  window.location.href = `/friend-profile?id=${friendId}`;
}


 render() {
  const current = this.conversations.find(c => c.id === this.selectedConversationId);

  return html`
    <div class="chat-wrapper">
      <div class="conversations">
        ${this.conversations.map(c => html`
          <div
            class="conversation-item ${this.selectedConversationId === c.id ? 'selected' : ''}"
            @click=${() => this.loadMessages(c.id)}
          >
            <div class="conversation-info">
              <div class="conversation-name">${c.name}</div>
              <div class="conversation-last">${c.lastMessage}</div>
            </div>
          </div>
        `)}
      </div>

      <div class="chat-area">
        ${current ? html`
          ${this.flashMessage ? html`
            <div class="flash-message ${this.flashType}">${this.flashMessage}</div>
          ` : ''}

          <div class="chat-header">
            <div class="header-info">
              <div class="chat-with-name">${current.name}</div>
            </div>
            <div class="chat-actions">
              <button
  class="chat-button invite-button"
  @click=${() => this.inviteToPlay(this.selectedConversationId)}
>
  Invite to Play
</button>

              <button
                class="chat-button profile-button"
                @click=${() => this.viewFriendProfile(current?.id)}
              >
                View Profile
              </button>
              <button
                class="chat-button block-button"
                @click=${this.handleBlockUser}
              >
                Block
              </button>
            </div>
          </div>

          <div class="messages">
            ${this.messages.map(msg => html`
              <div class="message-container ${msg.me ? 'right' : 'left'}">
                <div class="bubble ${msg.me ? 'right' : 'left'}">
                  ${unsafeHTML(msg.text)}
                </div>
              </div>
            `)}
          </div>

          <div class="input-container">
            <input
              type="text"
              placeholder="Type your message..."
              .value=${this.inputText}
              @input=${this.handleInput}
              @keypress=${(e: KeyboardEvent) => e.key === 'Enter' && this.sendMessage()}
            />
            <button
              class="send-button"
              ?disabled=${!this.inputText.trim()}
              @click=${this.sendMessage}
            >
              Send
            </button>
          </div>
        ` : html`
          <p style="padding: 2rem;">Select a conversation to begin</p>
        `}
      </div>
    </div>
  `;
}
}