import ApiService from '../services/api.service';
import { API_BASE_URL } from '../config';
import { Router } from '@vaadin/router';

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
private currentUserId = 0;
  constructor() {
    super();
  }

  connectedCallback() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
  this.currentUserId = user?.id || 0;
  this.loadConversations();
  this.setupWebSocket();
  this.bindEvents();
    document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;

  if (target.classList.contains('invite-play-btn')) {
    const route = target.getAttribute('data-link');
    if (route) {
      e.preventDefault();

      // Navigation SPA (si tu as un Router)

      Router.go(route);
    }
  }
});

  }

  bindEvents() {
    this.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('.conversation-item')) {
        const id = (target.closest('.conversation-item') as HTMLElement).dataset.id;
        if (id) this.loadMessages(id);
      }
      if (target.closest('#invite-button')) {
  this.inviteToPlay(this.selectedConversationId);
}

      if (target.closest('#block-button')) this.handleBlockUser();
      if (target.closest('#unblock-button')) this.handleUnblockUser();
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

  async handleUnblockUser() {
  const unblockId = Number(this.selectedConversationId);
  try {
    await ApiService.unblockUser(unblockId);
    this.flashMessage = 'User successfully unblocked.';
    this.flashType = 'success';
    setTimeout(() => {
      this.flashMessage = '';
      this.flashType = '';
      this.render();
    }, 3000);
    this.render();
  } catch (err) {
    console.error('Failed to unblock user:', err);
    this.flashMessage = 'Failed to unblock user.';
    this.flashType = 'error';
    this.render();
  }
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
      class="invite-play-btn mt-2 px-3 py-2 bg-indigo-500 text-white rounded hover:opacity-90">
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
  this.render()
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
                <button id="invite-button" class="px-3 py-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-full transition hover:opacity-90">
  <i class="fa-solid fa-gamepad"></i> Invite
</button>

                <button id="profile-button" class="px-3 py-1 bg-gradient-to-r from-white via-pink-100 to-purple-200 text-slate-900 hover:opacity-90 rounded-full transition">
                  <i class="fa-solid fa-eye"></i> Profile
                </button>
                <button id="block-button" class="px-3 py-1 bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white rounded-full transition hover:opacity-90">
  <i class="fa-solid fa-ban"></i> Block
</button>

<button id="unblock-button" class="px-3 py-1 bg-gradient-to-r from-green-500 via-green-600 to-green-700 text-white rounded-full transition hover:opacity-90">
  <i class="fa-solid fa-check"></i> Unblock
</button>

              </div>
            </div>
            <div class="flex-1 overflow-y-auto py-4 space-y-2 flex flex-col" style="min-height: 0;">
              ${this.messages.length === 0 ? `<div class="flex-1 flex items-center justify-center text-gray-400 italic">No messages yet</div>` : this.messages.map(msg => `
  <div class="${msg.me ? 'self-end text-right' : 'self-start'} ${msg.me ? 'bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500' : 'bg-gray-700'} px-4 py-2 rounded max-w-xs break-words">${msg.text}</div>
`).join('')}
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
