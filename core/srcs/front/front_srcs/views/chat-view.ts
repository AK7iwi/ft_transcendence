import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  avatar: string;
}

@customElement('chat-view')
export class ChatView extends LitElement {
  static styles = css`
    :host { display: block; }
    .chat-wrapper {
      display: flex;
      max-width: 1200px;
      height: 700px;
      margin: 0 auto;
      padding: 2rem;
      gap: 2rem;
      overflow-x: hidden;
    }
    .conversations {
      width: 300px;
      height: 100%;
      border: 1px solid var(--color-border);
      border-radius: 0.5rem;
      background: var(--color-surface);
      overflow-y: auto;
    }
    .conversation-item {
      display: flex;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid var(--color-border);
      cursor: pointer;
      transition: background 0.2s;
    }
    .conversation-item:last-child { border-bottom: none; }
    .conversation-item:hover,
    .conversation-item.selected { background: var(--color-hover); }
    .avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; margin-right: 1rem; }
    .conversation-info { display: flex; flex-direction: column; }
    .conversation-name { font-weight: bold; color: var(--color-text); margin-bottom: 0.25rem; }
    .conversation-last { font-size: 0.9rem; color: var(--color-muted); }
    .chat-area { flex: 1; display: flex; flex-direction: column; height: 100%; }
    .chat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--color-border);
      margin-bottom: 1rem;
    }
    .header-info {
      display: flex;
      align-items: center;
    }
    .avatar-large { width: 50px; height: 50px; border-radius: 50%; object-fit: cover; margin-right: 1rem; }
    .chat-with-name { font-size: 1.5rem; font-weight: bold; color: var(--color-text); }
    .chat-actions {
      display: flex;
      gap: 0.5rem;
    }
    .chat-button {
      padding: 0.5rem 1rem;
      font-size: 0.9rem;
      border-radius: 0.5rem;
      border: none;
      cursor: pointer;
      transition: background 0.2s;
    }
    .invite-button { background: var(--color-accent); color: white; }
    .invite-button:hover { opacity: 0.9; }
    .block-button { background: var(--color-error); color: white; }
    .block-button:hover { opacity: 0.9; }
    .messages {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 1rem;
      background: var(--color-surface);
    }
    .message-container {
      display: flex;
      width: 100%;
      margin-bottom: 1rem;
    }
    .message-container.left { justify-content: flex-start; }
    .message-container.right { justify-content: flex-end; }
    .bubble {
      max-width: 60%;
      padding: 0.75rem 1rem;
      border-radius: 1rem;
      line-height: 1.4;
      overflow-wrap: break-word;
      word-break: break-word;
      white-space: normal;
    }
    .bubble.left {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-top-left-radius: 0;
    }
    .bubble.right {
      background: var(--color-accent);
      color: white;
      border-top-right-radius: 0;
    }
    .input-container { display: flex; margin-top: 1rem; }
    .input-container input {
      flex: 1;
      padding: 0.8rem;
      font-size: 1rem;
      border: 1px solid var(--color-border);
      border-radius: 0.5rem 0 0 0.5rem;
    }
    .send-button {
      padding: 0 1rem;
      background: var(--color-accent);
      color: white;
      border: none;
      border-radius: 0 0.5rem 0.5rem 0;
      cursor: pointer;
    }
    .send-button:disabled { opacity: 0.5; cursor: default; }
  `;

  @state() private messages: { author: string; text: string; me: boolean }[] = [];
  @state() private inputText = '';
  @state() private conversations: Conversation[] = Array.from({ length: 20 }, (_, i) => ({
    id: `${i + 1}`,
    name: `User ${i + 1}`,
    lastMessage: `Last message from User ${i + 1}`,
    avatar: `/assets/avatars/user${i + 1}.jpg`
  }));
  @state() private selectedConversationId: string = '1';

  constructor() {
    super();
    this.loadMessages(this.selectedConversationId);
  }

  private loadMessages(convoId: string) {
    this.selectedConversationId = convoId;
    this.messages = [
      { author: this.conversations.find(c => c.id === convoId)!.name, text: 'Hello there!', me: false },
      { author: 'You', text: 'Hi!', me: true }
    ];
    this.updateComplete.then(() => {
      const container = this.renderRoot.querySelector('.messages')!;
      container.scrollTop = container.scrollHeight;
    });
  }

  private handleInput(e: Event) { this.inputText = (e.target as HTMLInputElement).value; }

  private sendMessage() {
    if (!this.inputText.trim()) return;
    this.messages = [...this.messages, { author: 'You', text: this.inputText, me: true }];
    this.inputText = '';
    this.updateComplete.then(() => {
      const container = this.renderRoot.querySelector('.messages')!;
      container.scrollTop = container.scrollHeight;
    });
  }

  render() {
    const current = this.conversations.find(c => c.id === this.selectedConversationId)!;
    return html`
      <div class="chat-wrapper">
        <div class="conversations">
          ${this.conversations.map(c => html`
            <div class="conversation-item ${this.selectedConversationId === c.id ? 'selected' : ''}" @click=${() => this.loadMessages(c.id)}>
              <img src="${c.avatar}" alt="${c.name} avatar" class="avatar" />
              <div class="conversation-info">
                <div class="conversation-name">${c.name}</div>
                <div class="conversation-last">${c.lastMessage}</div>
              </div>
            </div>
          `)}
        </div>
        <div class="chat-area">
          <div class="chat-header">
            <div class="header-info">
              <img src="${current.avatar}" alt="${current.name} avatar" class="avatar-large" />
              <div class="chat-with-name">${current.name}</div>
            </div>
            <div class="chat-actions">
              <button class="chat-button invite-button" @click=${() => console.log('Invite clicked')}>Invite to Play</button>
              <button class="chat-button block-button" @click=${() => console.log('Block clicked')}>Block</button>
            </div>
          </div>
          <div class="messages">
            ${this.messages.map(msg => html`
              <div class="message-container ${msg.me ? 'right' : 'left'}">
                <div class="bubble ${msg.me ? 'right' : 'left'}">${msg.text}</div>
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
            <button class="send-button" ?disabled=${!this.inputText.trim()} @click=${this.sendMessage}>Send</button>
          </div>
        </div>
      </div>`;
  }
}