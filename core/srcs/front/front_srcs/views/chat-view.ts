import ApiService from '../services/api.service';
import { API_BASE_URL } from '../config';
import { navigateTo } from '@/app';

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  blocked: boolean;
  avatar: string;
}

interface Message {
  author: string;
  text: string;
  me: boolean;
}

class ChatView extends HTMLElement {
  private websocket: WebSocket | null = null;
  private conversations: Conversation[] = [];
  private selectedConversationId: string = '';
  private inputText: string = '';
  private messages: Message[] = [];
  private flashMessage: string = '';
  private flashType: 'success' | 'error' | '' = '';
  private currentUserId: number = 0;

  private avatarUrl: string = '';

  constructor() {
    super();
  }

  connectedCallback() {
    const userJson = localStorage.getItem('user') || '{}';
    const user = JSON.parse(userJson);
    this.currentUserId = user?.id ?? 0;

    this.loadConversations()
      .then(() => {

        this.render();
      })
      .catch(err => {
        console.error('[Init] loadConversations failed:', err);
      });

    this.setupWebSocket();
    this.bindEvents();


    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('invite-play-btn')) {
        const route = target.getAttribute('data-link');
        if (route) {
          e.preventDefault();
          history.pushState({}, '', route);
window.dispatchEvent(new PopStateEvent('popstate'));

        }
      }
    });
  }

  disconnectedCallback() {

    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  private bindEvents() {

    this.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;



const convItem = target.closest('.conversation-item') as HTMLElement | null;
if (convItem) {
  const id = convItem.dataset.id;
  if (!id || id === this.selectedConversationId) {
    return; 
  }


  this.selectedConversationId = id;
  this.messages = [];      
  this.render();          


  this.loadMessages(id)
    .catch(err => {
      console.error('[loadMessages] failed:', err);
    })
    .then(() => {

      this.render();
    });

  return;
}



      if (target.closest('#invite-button')) {
        this.inviteToPlay(this.selectedConversationId);
        return;
      }

      if (target.closest('#block-button')) {
      this.handleBlockUser();
      return;
    }


    if (target.closest('#unblock-button')) {
      this.handleUnblockUser();
      return;
    }
      if (target.closest('#profile-button')) {
        this.viewFriendProfile(this.selectedConversationId);
        return;
      }
    });


    this.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.id === 'input-message') {
        this.inputText = target.value;
      }
    });


    this.addEventListener('submit', (e) => {
      const form = e.target as HTMLFormElement;
      if (form.id === 'form-message') {
        e.preventDefault();
        this.sendMessage();
      }
    });
  }

private async loadConversations() {
  try {
    const friends = await ApiService.getFriends();
    const blockedIds = await ApiService.getBlockedUsers();

    this.conversations = friends.map((f: any) => {
      let raw = f.avatar || "";


      raw = raw.replace(/^(\/?avatars\/)+/, '');


      const avatarUrl = raw
        ? `${API_BASE_URL}/avatars/${raw}`
        : `${API_BASE_URL}/avatars/default.png`;

      return {
        id: String(f.id),
        name: f.username,
        lastMessage: "",
        avatar: avatarUrl,
        blocked: blockedIds.includes(f.id),
      };
    });
  } catch (err) {
    console.error("[loadConversations] error:", err);
    throw err;
  }
}






  private setupWebSocket() {
    const wsUrl = API_BASE_URL.replace(/^http/, 'ws') + '/ws';
    console.log('[WS] Connecting to:', wsUrl);
    this.websocket = new WebSocket(wsUrl);

    this.websocket.addEventListener('open', () => {
      console.log('[WS] Open connection');
      const token = localStorage.getItem('token');
      if (token) {

        const authMsg = { type: 'auth', payload: { token } };
        this.websocket!.send(JSON.stringify(authMsg));
        console.log('[WS] Sent auth:', authMsg);
      }
    });

    this.websocket.addEventListener('message', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[WS] Received:', data);

        if (data.type === 'dm') {

          const { senderId, text } = data;

          if (String(senderId) === this.selectedConversationId) {
            const senderName =
              this.conversations.find(c => c.id === String(senderId))?.name || 'Unknown';
            this.messages.push({ author: senderName, text, me: false });
            this.render();
          } else {


            console.log(
              `[WS] New DM of ${senderId}, but conversation ${
                this.selectedConversationId
              } is not open`
            );
          }
        }

      } catch (err) {
        console.error('[WS] Error processing message:', err);
      }
    });

    this.websocket.addEventListener('close', () => {
      console.warn('[WS] WebSocket closed');
      this.websocket = null;
    });

    this.websocket.addEventListener('error', (err) => {
      console.error('[WS] WebSocket error:', err);
    });
  }

  private async loadMessages(friendId: string) {
    try {
      console.log('[loadMessages] friendsId =', friendId);
      const result = await ApiService.getMessages(friendId);

      this.messages = result.map((msg: any) => ({
        author: msg.sender?.username || '???',
        text: msg.content,
        me: msg.sender?.id === this.currentUserId,
      }));
      return;
    } catch (err) {
      console.error('[loadMessages] error:', err);
      throw err;
    }
  }

  private inviteToPlay(friendId?: string) {
    console.log('[INVITE] inviteToPlay friendId=', friendId);

    if (!friendId) {
      console.warn('[INVITE] No friendId selected');
      return;
    }
    if (!this.currentUserId) {
      console.warn('[INVITE] No known current user');
      return;
    }
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      console.warn('[INVITE] WebSocket not ready or not connected');
      return;
    }

    const gameUrl = `/game-remote?id=${this.currentUserId}`;
    const invitationMessage = `
      <div>
        🎮 <strong>Invitation to play Pong!</strong><br/>
        <button
          data-link="${gameUrl}"
          class="invite-play-btn m-3 px-3 py-3 bg-gradient-to-r from-white via-pink-100 to-purple-200 text-slate-900 hover:opacity-90 rounded-full transition">
          ▶ Play with me
        </button>
      </div>
    `;


    const payload = {
      type: 'dm',
      payload: {
        toUserId: Number(friendId),
        text: invitationMessage.trim(),
      },
    };
    this.websocket.send(JSON.stringify(payload));
    console.log('[INVITE] sent over WebSocket:', payload);


    this.messages.push({
      author: 'You',
      text: invitationMessage.trim(),
      me: true,
    });
    this.render();
  }

  private async sendMessage() {
    const text = this.inputText.trim();
    if (!text) {
      return; 
    }
    const toUserId = Number(this.selectedConversationId);
    if (!toUserId) {
      console.warn('[sendMessage] No conversation selected');
      return;
    }

    try {

      await ApiService.sendMessage({ receiverId: toUserId, content: text });
      console.log('[sendMessage] REST API returned OK');


      const payload = {
        type: 'dm',
        payload: {
          toUserId,
          text,
        },
      };
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify(payload));
        console.log('[sendMessage] Sent over WebSocket:', payload);
      } else {
        console.warn('[sendMessage] WS not opened, unable to send DM');
      }


      this.messages.push({ author: 'You', text, me: true });
      this.inputText = '';
      this.render();
    } catch (err) {
      console.error('[sendMessage] Sending error:', err);
      this.flashMessage = 'Failed to send message.';
      this.flashType = 'error';
      this.render();
      setTimeout(() => {
        this.flashMessage = '';
        this.flashType = '';
        this.render();
      }, 3000);
    }
  }

  private async handleBlockUser() {
  const blockedId = Number(this.selectedConversationId);
  if (!blockedId) {
    console.warn('[blockUser] No conversation selected');
    return;
  }
  try {

    await ApiService.blockUser(blockedId);


    const conv = this.conversations.find((c) => c.id === String(blockedId));
    if (conv) conv.blocked = true;


    this.flashMessage = 'User successfully blocked.';
    this.flashType = 'success';
    this.render();


    setTimeout(() => {
      this.flashMessage = '';
      this.flashType = '';
      this.render();
    }, 3000);
  } catch (err) {
    console.error('[blockUser] failed:', err);
    this.flashMessage = 'Unable to block user.';
    this.flashType = 'error';
    this.render();
    setTimeout(() => {
      this.flashMessage = '';
      this.flashType = '';
      this.render();
    }, 3000);
  }
}

private async handleUnblockUser() {
  const unblockId = Number(this.selectedConversationId);
  if (!unblockId) {
    console.warn('[unblockUser] No conversation selected');
    return;
  }
  try {

    await ApiService.unblockUser(unblockId);


    const conv = this.conversations.find((c) => c.id === String(unblockId));
    if (conv) conv.blocked = false;


    this.flashMessage = 'User successfully unblocked.';
    this.flashType = 'success';
    this.render();


    setTimeout(() => {
      this.flashMessage = '';
      this.flashType = '';
      this.render();
    }, 3000);
  } catch (err) {
    console.error('[unblockUser] failed:', err);
    this.flashMessage = 'Unable to unblock user.';
    this.flashType = 'error';
    this.render();
    setTimeout(() => {
      this.flashMessage = '';
      this.flashType = '';
      this.render();
    }, 3000);
  }
}


  private viewFriendProfile(friendId?: string) {
    if (!friendId) return;
    navigateTo(`/friend-profile?id=${friendId}`);
  }

  render() {

    this.innerHTML = `
    <div class="flex h-[80vh] bg-gradient-to-b from-[#0f172a] to-[#1e293b] text-white overflow-hidden">
      <aside class="w-1/4 border-r border-gray-700 p-4 overflow-y-auto">
        <h2 class="text-lg font-semibold mb-4">
          Conversations
        </h2>
        <ul class="space-y-2">
          ${this.conversations
            .map((c) => `
              <li>
                <div
                  class="conversation-item bg-gray-800 p-3 rounded hover:bg-gray-700 cursor-pointer flex items-center space-x-3 ${
                    c.id === this.selectedConversationId ? 'ring-2 ring-indigo-400' : ''
                  }"
                  data-id="${c.id}"
                >
                  <img
  src="${c.avatar}"
  alt="Avatar"
  class="w-8 h-8 rounded-full object-cover"
/>

                  <div class="flex-1">
                    <p class="font-semibold">${c.name}</p>
                    <p class="text-gray-400 text-sm">${c.lastMessage || ''}</p>
                  </div>
                </div>
              </li>
            `).join('')}
        </ul>
      </aside>

      <main class="flex-1 flex flex-col p-4 overflow-hidden">
        ${this.flashMessage
          ? `<div class="mb-4 text-center font-semibold rounded p-2 ${
              this.flashType === 'success' ? 'bg-green-500' : 'bg-red-500'
            }">${this.flashMessage}</div>`
          : ''}

        ${
          this.selectedConversationId
            ? (() => {

                const conv = this.conversations.find((x) => x.id === this.selectedConversationId)!;


                const blockButtonHTML = conv.blocked
                  ? `<button
                       id="unblock-button"
                       class="px-3 py-1 bg-gradient-to-r from-green-500 via-green-600 to-green-700 text-white rounded-full hover:opacity-90 transition"
                     >
                       Unblock
                     </button>`
                  : `<button
                       id="block-button"
                       class="px-3 py-1 bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white rounded-full hover:opacity-90 transition"
                     >
                       Block
                     </button>`;

                return `
                <div class="flex justify-between items-center border-b border-gray-700 pb-3">
                  <div class="flex items-center space-x-3">
                    
                    <h3 class="text-lg font-semibold">${conv.name}</h3>
                  </div>
                  <div class="space-x-2">
                    <button
                      id="invite-button"
                      class="px-3 py-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-full hover:opacity-90 transition"
                    >
                      Invite
                    </button>
                    <button
                      id="profile-button"
                      class="px-3 py-1 bg-gradient-to-r from-white via-pink-100 to-purple-200 text-slate-900 rounded-full hover:opacity-90 transition"
                    >
                      Profile
                    </button>
                    ${blockButtonHTML}
                  </div>
                </div>

                <div
                  class="flex-1 overflow-y-auto py-4 space-y-2 flex flex-col"
                  style="min-height: 0;"
                >
                  ${
                    this.messages.length === 0
                      ? `<div class="flex-1 flex items-center justify-center text-gray-400 italic">
                          No messages
                        </div>`
                      : this.messages
                          .map((msg) => `
                    <div
                      class="${
                        msg.me ? 'self-end text-right' : 'self-start'
                      } ${
                              msg.me
                                ? 'bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500'
                                : 'bg-gray-700'
                            } px-4 py-2 rounded max-w-xs break-words"
                    >
                      ${msg.text}
                    </div>
                  `).join('')
                  }
                </div>

                <form id="form-message" class="flex mt-4 pt-2 border-t border-gray-700">
                  <input
                    id="input-message"
                    type="text"
                    placeholder="Type your message..."
                    class="flex-1 px-4 py-2 rounded-l bg-white text-black focus:outline-none"
                    value="${this.inputText}"
                    autocomplete="off"
                  />
                  <button
                    id="send-button"
                    type="submit"
                    class="px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-r hover:opacity-90 transition"
                  >
                    Send
                  </button>
                </form>
                `;
              })()
            : `
            <div class="flex-1 flex items-center justify-center text-gray-400 italic">
              Select a conversation to start
            </div>
          `
        }
      </main>
    </div>
  `;


  const input = this.querySelector<HTMLInputElement>('#input-message');
  if (input) {
    setTimeout(() => input.focus(), 0);
  }
}
}

customElements.define('chat-view', ChatView);