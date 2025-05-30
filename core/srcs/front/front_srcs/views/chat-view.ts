import ApiService from '../services/api.service';
import { API_BASE_URL } from '../config';

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  avatar: string;
}

class ChatView extends HTMLElement {
  private websocket: WebSocket | null = null;
  private conversations: Conversation[] = [];
  private selectedConversationId = '';
  private inputText = '';
  private messages: { author: string; text: string; me: boolean }[] = [];
  private flashMessage = '';
  private flashType: 'success' | 'error' | '' = '';
  private currentUserId = Number(localStorage.getItem('userId'));

  constructor() {
    super();
  }

  connectedCallback() {
    this.loadConversations();
    this.setupWebSocket();
    this.bindEvents();
  }

  bindEvents() {
    this.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('.conversation-item')) {
        const id = (target.closest('.conversation-item') as HTMLElement).dataset.id;
        if (id) this.loadMessages(id);
      }
      if (target.closest('#block-button')) this.handleBlockUser();
      if (target.closest('#profile-button')) this.viewFriendProfile(this.selectedConversationId);
    });

    this.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.id === 'input-message') this.inputText = target.value;
    });

    this.addEventListener('submit', (e) => {
      if ((e.target as HTMLFormElement).id === 'form-message') {
        e.preventDefault();
        this.sendMessage();
      }
    });
  }

  async loadConversations() {
    const result = await ApiService.getFriends();
    this.conversations = result.map((friend: any) => ({
      id: String(friend.id),
      name: friend.username,
      lastMessage: '',
      avatar: `${API_BASE_URL}/avatars/${friend.avatar || 'default.png'}`,
    }));
    this.render();
  }

  setupWebSocket() {
    this.websocket = new WebSocket(`${API_BASE_URL.replace(/^http/, 'ws')}/ws`);
    this.websocket.onopen = () => {
      const token = localStorage.getItem('token');
      if (token) {
        this.websocket!.send(JSON.stringify({ type: 'auth', payload: { token } }));
      }
    };

    this.websocket.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'dm') {
          const { senderId, text } = data;
          if (String(senderId) === this.selectedConversationId) {
            const senderName = this.conversations.find(c => c.id === String(senderId))?.name || 'Unknown';
            this.messages.push({ author: senderName, text, me: false });
            this.render();
          }
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    };
  }

  async loadMessages(friendId: string) {
    this.selectedConversationId = friendId;
    try {
      const result = await ApiService.getMessages(friendId);
      this.messages = result.map((msg: any) => ({
        author: msg.sender?.username || '???',
        text: msg.content,
        me: msg.sender?.id === this.currentUserId,
      }));
      this.render();
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }

  async sendMessage() {
    if (!this.inputText.trim()) return;
    const toUserId = Number(this.selectedConversationId);
    const text = this.inputText.trim();
    try {
      await ApiService.sendMessage({ receiverId: toUserId, content: text });
      this.websocket?.send(JSON.stringify({ type: 'dm', payload: { toUserId, text } }));
      this.messages.push({ author: 'You', text, me: true });
      this.inputText = '';
      this.render();
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  }

  async handleBlockUser() {
    const blockedId = Number(this.selectedConversationId);
    try {
      await ApiService.blockUser(blockedId);
      this.flashMessage = 'User successfully blocked.';
      this.flashType = 'success';
      setTimeout(() => {
        this.flashMessage = '';
        this.flashType = '';
        this.render();
      }, 3000);
      this.render();
    } catch (err) {
      console.error('Failed to block user:', err);
      this.flashMessage = 'Failed to block user.';
      this.flashType = 'error';
      this.render();
    }
  }

  viewFriendProfile(friendId?: string) {
    if (!friendId) return;
    window.location.href = `/friend-profile?id=${friendId}`;
  }

  render() {
    this.innerHTML = `
      <div class="flex h-[100vh] bg-gradient-to-b from-[#0f172a] to-[#1e293b] text-white overflow-hidden">
        <aside class="w-1/4 border-r border-gray-700 p-4 overflow-y-auto">
          <h2 class="text-lg font-semibold mb-4"><i class="fa-solid fa-comments"></i> Conversations</h2>
          <ul class="space-y-2">
            ${this.conversations.map(c => `
              <li class="${c.id === this.selectedConversationId ? 'p-[2px] rounded bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500' : ''}">
                <div class="conversation-item bg-gray-800 p-3 rounded hover:bg-gray-700 cursor-pointer" data-id="${c.id}">
                  <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
                      <i class="fa-solid fa-user-tie text-white"></i>
                    </div>
                    <div>
                      <p class="font-semibold">${c.name}</p>
                    </div>
                  </div>
                </div>
              </li>`).join('')}
          </ul>
        </aside>
        <main class="flex-1 flex flex-col p-4 overflow-hidden">
          ${this.flashMessage ? `<div class="mb-4 text-center font-semibold rounded p-2 ${this.flashType === 'success' ? 'bg-green-500' : 'bg-red-500'}">${this.flashMessage}</div>` : ''}
          ${this.selectedConversationId ? `
            <div class="flex justify-between items-center border-b border-gray-700 pb-3">
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
                  <i class="fa-solid fa-user-tie text-white"></i>
                </div>
                <h3 class="text-lg font-semibold">${this.conversations.find(c => c.id === this.selectedConversationId)?.name || ''}</h3>
              </div>
              <div class="space-x-2">
                <button class="px-3 py-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-full transition hover:opacity-90">
                  <i class="fa-solid fa-gamepad"></i> Invite
                </button>
                <button id="profile-button" class="px-3 py-1 bg-gradient-to-r from-white via-pink-100 to-purple-200 text-slate-900 hover:opacity-90 rounded-full transition">
                  <i class="fa-solid fa-eye"></i> Profile
                </button>
                <button id="block-button" class="px-3 py-1 bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white rounded-full transition hover:opacity-90">
                  <i class="fa-solid fa-ban"></i> Block
                </button>
              </div>
            </div>
            <div class="flex-1 overflow-y-auto py-4 space-y-2 flex flex-col" style="min-height: 0;">
              ${this.messages.length === 0 ? `<div class="flex-1 flex items-center justify-center text-gray-400 italic">No messages yet</div>` : this.messages.map(msg => `
                <div class="${msg.me ? 'self-end text-right' : 'self-start'} ${msg.me ? 'bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500' : 'bg-gray-700'} px-4 py-2 rounded max-w-xs break-words">${msg.text}</div>`).join('')}
            </div>
            <form id="form-message" class="flex mt-4 pt-2 border-t border-gray-700">
              <input id="input-message" type="text" placeholder="Type your message..." class="flex-1 px-4 py-2 rounded-l bg-white text-black focus:outline-none" value="${this.inputText}" />
              <button id="send-button" type="submit" class="px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-r transition hover:opacity-90">
                <i class="fa-solid fa-paper-plane"></i> Send
              </button>
            </form>` : `<p class="text-center mt-20">Select a conversation to begin</p>`}
        </main>
      </div>
    `;
  }
}

customElements.define('chat-view', ChatView);


// import { LitElement, html, css } from 'lit';
// import { customElement, state } from 'lit/decorators.js';
// import { unsafeHTML } from 'lit/directives/unsafe-html.js';

// import ApiService from '../services/api.service';
// import { API_BASE_URL } from '../config';

// import { Router } from '@vaadin/router';

// document.addEventListener('click', (e) => {
//   const target = e.target as HTMLElement;
//   if (target.classList.contains('invite-play-btn')) {
//     const route = target.getAttribute('data-link');
//     if (route) {
//       e.preventDefault();
//       Router.go(route); // Navigation SPA sans reload
//     }
//   }
// });


// interface Conversation {
//   id: string;
//   name: string;
//   lastMessage: string;
//   avatar: string;
// }

// @customElement('chat-view')
// export class ChatView extends LitElement {


// private async handleBlockUser() {
//   if (!this.selectedConversationId) return;
//   try {
//     const blockedId = Number(this.selectedConversationId);
//     console.log('[BLOCK] Attempting to block ID:', blockedId);

//     await ApiService.blockUser(blockedId);
//     this.flashMessage = 'Utilisateur bloqué avec succès.';
//     this.flashType = 'success';

//     // Efface le message après 3 secondes
//     setTimeout(() => {
//       this.flashMessage = '';
//       this.flashType = '';
//     }, 3000);
//   } catch (err) {
//     console.error('Erreur lors du blocage de l’utilisateur :', err);
//     this.flashMessage = 'Erreur lors du blocage.';
//     this.flashType = 'error';
//   }
// }


//   static styles = css`
//     :host { display: block; }
//     .flash-message {
//   padding: 0.75rem 1rem;
//   margin-bottom: 1rem;
//   border-radius: 0.5rem;
//   font-weight: bold;
//   text-align: center;
// }
// .flash-message.success {
//   background-color: #d4edda;
//   color: #155724;
//   border: 1px solid #c3e6cb;
// }
// .flash-message.error {
//   background-color: #f8d7da;
//   color: #721c24;
//   border: 1px solid #f5c6cb;
// }

//     .chat-wrapper { display: flex; max-width: 1200px; height: 700px; margin: 0 auto; padding: 2rem; gap: 2rem; overflow-x: hidden; }
//     .conversations { width: 300px; height: 100%; border: 1px solid var(--color-border); border-radius: 0.5rem; background: var(--color-surface); overflow-y: auto; }
//     .conversation-item { display: flex; align-items: center; padding: 1rem; border-bottom: 1px solid var(--color-border); cursor: pointer; transition: background 0.2s; }
//     .conversation-item:last-child { border-bottom: none; }
//     .conversation-item:hover, .conversation-item.selected { background: var(--color-hover); }
//     .conversation-info { display: flex; flex-direction: column; }
//     .conversation-name { font-weight: bold; color: var(--color-text); margin-bottom: 0.25rem; }
//     .conversation-last { font-size: 0.9rem; color: var(--color-muted); }
//     .chat-area { flex: 1; display: flex; flex-direction: column; height: 100%; }
//     .chat-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 1rem; border-bottom: 1px solid var(--color-border); margin-bottom: 1rem; }
//     .header-info { display: flex; align-items: center; }
//     .chat-with-name { font-size: 1.5rem; font-weight: bold; color: var(--color-text); }
//     .chat-actions { display: flex; gap: 0.5rem; }
//     .chat-button { padding: 0.5rem 1rem; font-size: 0.9rem; border-radius: 0.5rem; border: none; cursor: pointer; transition: background 0.2s; }
//     .invite-button { background: var(--color-accent); color: white; }
//     .invite-button:hover { opacity: 0.9; }
//     .block-button { background: var(--color-error); color: white; }
//     .block-button:hover { opacity: 0.9; }
//     .profile-button { background: var(--color-surface); color: var(--color-text); border: 1px solid var(--color-border); }
//     .profile-button:hover { background: var(--color-hover); }
//     .messages { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 1rem; background: var(--color-surface); }
//     .message-container { display: flex; width: 100%; margin-bottom: 1rem; }
//     .message-container.left { justify-content: flex-start; }
//     .message-container.right { justify-content: flex-end; }
//     .bubble { max-width: 60%; padding: 0.75rem 1rem; border-radius: 1rem; line-height: 1.4; overflow-wrap: break-word; word-break: break-word; white-space: normal; }
//     .bubble.left { background: var(--color-surface); border: 1px solid var(--color-border); border-top-left-radius: 0; }
//     .bubble.right { background: var(--color-accent); color: white; border-top-right-radius: 0; }
//     .input-container { display: flex; margin-top: 1rem; }
//     .input-container input { flex: 1; padding: 0.8rem; font-size: 1rem; border: 1px solid var(--color-border); border-radius: 0.5rem 0 0 0.5rem; }
//     .send-button { padding: 0 1rem; background: var(--color-accent); color: white; border: none; border-radius: 0 0.5rem 0.5rem 0; cursor: pointer; }
//     .send-button:disabled { opacity: 0.5; cursor: default; }
//   `;

//   @state() private websocket: WebSocket | null = null;
//   @state() private inputText = '';
//   @state() private selectedConversationId: string = '';
// @state() private currentUserId: number = 0;

//   @state() private messages: { author: string; text: string; me: boolean }[] = [];
//   @state() private conversations: Conversation[] = [];
// @state() private flashMessage: string = '';
// @state() private flashType: 'success' | 'error' | '' = '';


// connectedCallback() {
//   super.connectedCallback();

//   const user = JSON.parse(localStorage.getItem('user') || '{}');
//   this.currentUserId = user?.id || 0;

//   console.log('[CHAT] Connected as user ID:', this.currentUserId); // ✅ vérif visuelle

//   this.loadFriendsAsConversations();
//   this.setupWebSocket();
// }

// firstUpdated(_changedProperties: Map<string | number | symbol, unknown>) {
//   this.renderRoot.addEventListener('click', (e: Event) => {
//     const target = e.target as HTMLElement;
//     if (target.classList.contains('invite-play-btn')) {
//       const route = target.getAttribute('data-link');
//       if (route) {
//         e.preventDefault();
//         Router.go(route);
//       }
//     }
//   });
// }


//   async loadFriendsAsConversations() {
//     const result = await ApiService.getFriends();
//     this.conversations = result.map((friend: any) => ({
//       id: String(friend.id),
//       name: friend.username,
//       lastMessage: '',
//       avatar: `${API_BASE_URL}/avatars/${friend.avatar || 'default.png'}`
//     }));
//   }


  
//   setupWebSocket() {
//     this.websocket = new WebSocket(`${API_BASE_URL.replace(/^http/, 'ws')}/ws`);

//     this.websocket.onopen = () => {
//       const token = localStorage.getItem('token');
//       if (token) {
//         this.websocket!.send(JSON.stringify({
//           type: 'auth',
//           payload: { token }
//         }));
//       }
//     };

//     this.websocket.onmessage = (event: MessageEvent) => {
//       try {
//         const data = JSON.parse(event.data);
//         if (data.type === 'dm') {
//           const { senderId, text } = data;

//           if (String(senderId) === this.selectedConversationId) {
//             this.messages = [
//               ...this.messages,
//               {
//                 author: this.conversations.find(c => c.id === String(senderId))?.name || 'Unknown',
//                 text,
//                 me: false
//               }
//             ];
//           }
//         }
//       } catch (err) {
//         console.error('WebSocket message error:', err);
//       }
//     };
//   }

// private inviteToPlay(friendId?: string) {
//   console.log('[INVITE] Clicked Invite to Play →', friendId);
//   console.log('[INVITE] currentUserId =', this.currentUserId);
//   console.log('[INVITE] WebSocket is', this.websocket);

//   if (!friendId || !this.currentUserId) return;
//   if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
//     console.warn('[INVITE] WebSocket not ready');
//     return;
//   }

//   const gameUrl = `/game-remote?id=${this.currentUserId}`;

//   const invitationMessage = `
//     <div>
//       🎮 <strong>Invitation to play Pong!</strong><br/>
//       <button 
//         data-link="${gameUrl}" 
//         class="invite-play-btn" 
//         style="margin-top: 5px; padding: 6px 12px; background-color: #6366f1; color: white; border: none; border-radius: 4px; cursor: pointer;">
//         ▶ Play with me
//       </button>
//     </div>
//   `;

//   this.websocket.send(JSON.stringify({
//     type: 'dm',
//     payload: {
//       toUserId: Number(friendId),
//       text: invitationMessage
//     }
//   }));

//   console.log('[INVITE] Message sent over WebSocket:', invitationMessage);

//   this.messages = [...this.messages, {
//     author: 'You',
//     text: invitationMessage,
//     me: true
//   }];
// }



//   async loadMessages(friendId: string) {
//     this.selectedConversationId = friendId;

//     try {
//       const result = await ApiService.getMessages(friendId);
//       this.messages = result.map((msg: any) => ({
//         author: msg.sender?.username || '???',
//         text: msg.content,
//         me: msg.sender?.id === this.currentUserId
//       }));

//       this.updateComplete.then(() => {
//         const container = this.renderRoot.querySelector('.messages')!;
//         container.scrollTop = container.scrollHeight;
//       });

//     } catch (err) {
//       console.error('Failed to load messages:', err);
//     }
//   }

//   private handleInput(e: Event) {
//     this.inputText = (e.target as HTMLInputElement).value;
//   }

//   async sendMessage() {
//     if (!this.inputText.trim()) return;

//     const toUserId = Number(this.selectedConversationId);
//     const text = this.inputText.trim();

//     try {
//       await ApiService.sendMessage({ receiverId: toUserId, content: text });

//       this.websocket?.send(JSON.stringify({
//         type: 'dm',
//         payload: { toUserId, text }
//       }));

//       this.messages = [...this.messages, {
//         author: 'You',
//         text,
//         me: true
//       }];
//       this.inputText = '';

//       this.updateComplete.then(() => {
//         const container = this.renderRoot.querySelector('.messages')!;
//         container.scrollTop = container.scrollHeight;
//       });

//     } catch (err) {
//       console.error('❌ Échec envoi message:', err);
//     }
//   }
//   private viewFriendProfile(friendId?: string) {
//   if (!friendId) return;
//   window.location.href = `/friend-profile?id=${friendId}`;
// }


//  render() {
//   const current = this.conversations.find(c => c.id === this.selectedConversationId);

//   return html`
//     <div class="chat-wrapper">
//       <div class="conversations">
//         ${this.conversations.map(c => html`
//           <div
//             class="conversation-item ${this.selectedConversationId === c.id ? 'selected' : ''}"
//             @click=${() => this.loadMessages(c.id)}
//           >
//             <div class="conversation-info">
//               <div class="conversation-name">${c.name}</div>
//               <div class="conversation-last">${c.lastMessage}</div>
//             </div>
//           </div>
//         `)}
//       </div>

//       <div class="chat-area">
//         ${current ? html`
//           ${this.flashMessage ? html`
//             <div class="flash-message ${this.flashType}">${this.flashMessage}</div>
//           ` : ''}

//           <div class="chat-header">
//             <div class="header-info">
//               <div class="chat-with-name">${current.name}</div>
//             </div>
//             <div class="chat-actions">
//               <button
//   class="chat-button invite-button"
//   @click=${() => this.inviteToPlay(this.selectedConversationId)}
// >
//   Invite to Play
// </button>

//               <button
//                 class="chat-button profile-button"
//                 @click=${() => this.viewFriendProfile(current?.id)}
//               >
//                 View Profile
//               </button>
//               <button
//                 class="chat-button block-button"
//                 @click=${this.handleBlockUser}
//               >
//                 Block
//               </button>
//             </div>
//           </div>

//           <div class="messages">
//             ${this.messages.map(msg => html`
//               <div class="message-container ${msg.me ? 'right' : 'left'}">
//                 <div class="bubble ${msg.me ? 'right' : 'left'}">
//                   ${unsafeHTML(msg.text)}
//                 </div>
//               </div>
//             `)}
//           </div>

//           <div class="input-container">
//             <input
//               type="text"
//               placeholder="Type your message..."
//               .value=${this.inputText}
//               @input=${this.handleInput}
//               @keypress=${(e: KeyboardEvent) => e.key === 'Enter' && this.sendMessage()}
//             />
//             <button
//               class="send-button"
//               ?disabled=${!this.inputText.trim()}
//               @click=${this.sendMessage}
//             >
//               Send
//             </button>
//           </div>
//         ` : html`
//           <p style="padding: 2rem;">Select a conversation to begin</p>
//         `}
//       </div>
//     </div>
//   `;
// }
// }