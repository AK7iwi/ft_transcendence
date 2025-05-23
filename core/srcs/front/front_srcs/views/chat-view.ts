import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { wsInstance } from '../services/websocket-instance';

@customElement('chat-view')
export class ChatView extends LitElement {
static styles = css`
  :host {
    display: block;
    height: 100vh;
    font-family: sans-serif;
    box-sizing: border-box;
    background: transparent;
  }

  .chat-container {
    max-width: 600px;
    height: 80vh;
    margin: 5vh auto;
    display: flex;
    flex-direction: column;
  }

  h2 {
    text-align: center;
    padding: 0.5rem 0;
    margin: 0 0 1rem 0;
    font-size: 1.5rem;
    color: white;
  }

  .messages {
    flex: 1;
    padding: 1rem;
    overflow-y: auto;
    background: #f5f5f5;
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .message {
  margin-bottom: 0.75rem;
  word-wrap: break-word;
  color: black;
}


  .input {
    display: flex;
    padding: 0.5rem 0;
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
    transition: background 0.2s ease-in-out;
  }

  button:hover {
    background-color: #4f46e5;
  }
`;


  @state() private messages: { clientId: string; text: string }[] = [];
  @state() private inputMessage: string = '';

connectedCallback() {
  super.connectedCallback();
  console.log('[ChatView] Initialisation du chat');
  wsInstance.on('chat', this.handleIncomingMessage);
}

  disconnectedCallback() {
    super.disconnectedCallback();
    wsInstance.off('chat', this.handleIncomingMessage);
  }

handleIncomingMessage = (data: any) => {
  console.log('[ChatView] Message reçu :', data);
  this.messages = [...this.messages, data];
};

  sendMessage() {
    if (this.inputMessage.trim() !== '') {
      wsInstance.send('chat', { text: this.inputMessage });
      this.inputMessage = '';
    }
  }

  render() {
    return html`
      <div class="chat-container">
        <h2>Conversation</h2>
        <div class="messages">
          ${this.messages.map(msg => html`<div class="message"><strong>${msg.clientId}</strong>: ${msg.text}</div>`)}
        </div>
        <div class="input">
          <input
            type="text"
            .value=${this.inputMessage}
            @input=${(e: Event) => this.inputMessage = (e.target as HTMLInputElement).value}
            @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this.sendMessage(); }}
          />
          <button @click=${this.sendMessage}>Envoyer</button>
        </div>
      </div>
    `;
  }
}
