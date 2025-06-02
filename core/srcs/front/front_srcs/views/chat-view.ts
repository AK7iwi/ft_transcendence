
import ApiService from '../services/api.service';
import { API_BASE_URL } from '../config';
import { Router } from '@vaadin/router';

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  blocked: boolean;
  avatar: string; // Ajoute cette ligne
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
    // Si user.id n’est pas défini, currentUserId vaut 0.

    this.loadConversations()
      .then(() => {
        // On rend après avoir récupéré la liste d’amis
        this.render();
      })
      .catch(err => {
        console.error('[Init] loadConversations failed:', err);
      });

    this.setupWebSocket();
    this.bindEvents();

    // Pour gérer la navigation vers "Invite to play" si on clique sur un bouton
    document.addEventListener('click', (e) => {
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

  disconnectedCallback() {
    // Quand l’élément est retiré du DOM, on ferme le WS
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  private bindEvents() {
    // Clicks sur les éléments à l’intérieur du composant
    this.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      // 1) Sélection d’une conversation
      // 1) Sélection d’une conversation
const convItem = target.closest('.conversation-item') as HTMLElement | null;
if (convItem) {
  const id = convItem.dataset.id;
  if (!id || id === this.selectedConversationId) {
    return; // pas de changement nécessaire
  }

  // → On met à jour immédiatement la conversation sélectionnée
  this.selectedConversationId = id;
  this.messages = [];      // optionnel : vider l’ancien chat
  this.render();           // on affiche tout de suite la nouvelle fenêtre (vide)

  // → Puis on charge l’historique en arrière‐plan
  this.loadMessages(id)
    .catch(err => {
      console.error('[loadMessages] failed:', err);
    })
    .then(() => {
      // Une fois l’historique reçu, on re‐render pour afficher les anciens messages
      this.render();
    });

  return;
}


      // 2) Invite to play
      if (target.closest('#invite-button')) {
        this.inviteToPlay(this.selectedConversationId);
        return;
      }

      if (target.closest('#block-button')) {
      this.handleBlockUser();
      return;
    }

    // Bouton « Débloquer »
    if (target.closest('#unblock-button')) {
      this.handleUnblockUser();
      return;
    }
      if (target.closest('#profile-button')) {
        this.viewFriendProfile(this.selectedConversationId);
        return;
      }
    });

    // Mise à jour de inputText au fur et à mesure qu’on tape
    this.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.id === 'input-message') {
        this.inputText = target.value;
      }
    });

    // Soumission du formulaire d’envoi de message
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

    this.conversations = friends.map(f => {
      let raw = f.avatar || "";

      // Nettoyage robuste du chemin de l'avatar pour éviter la duplication de 'avatars/'
      raw = raw.replace(/^(\/?avatars\/)+/, '');

      // Construction correcte de l'URL finale :
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





// private async loadConversations() {
//   try {
//     const friends = await ApiService.getFriends();
//     // (1) on récupère d’abord la liste d’amis
//     const blockedIds: number[] = await ApiService.getBlockedUsers();
//     // (2) on récupère la liste des IDs bloqués sous GET /auth/blocked
//     this.conversations = friends.map((f: any) => ({
//       id: String(f.id),
//       name: f.username,
//       lastMessage: '',
//       avatar: `${API_BASE_URL}/avatars/${f.avatar || 'default.png'}`,
//       blocked: blockedIds.includes(f.id),
//     }));
//   } catch (err) {
//     console.error('[loadConversations] error:', err);
//     throw err;
//   }
// }


  private setupWebSocket() {
    const wsUrl = API_BASE_URL.replace(/^http/, 'ws') + '/ws';
    console.log('[WS] Connecting to:', wsUrl);
    this.websocket = new WebSocket(wsUrl);

    this.websocket.addEventListener('open', () => {
      console.log('[WS] Connection ouverte');
      const token = localStorage.getItem('token');
      if (token) {
        // On envoie un message d’authentification dès que c’est ouvert
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
          // Structure attendue du serveur : { type: 'dm', senderId, text, timestamp }
          const { senderId, text } = data;
          // Si ce DM vient du user actuellement sélectionné
          if (String(senderId) === this.selectedConversationId) {
            const senderName =
              this.conversations.find(c => c.id === String(senderId))?.name || 'Inconnu';
            this.messages.push({ author: senderName, text, me: false });
            this.render();
          } else {
            // Tu peux, par exemple, mettre à jour lastMessage dans conversations,
            // ou afficher une notification "nouveau message"
            console.log(
              `[WS] Nouveau DM de ${senderId}, mais conversation ${
                this.selectedConversationId
              } n’est pas ouverte`
            );
          }
        }
        // Tu peux gérer d’autres types si nécessaire
      } catch (err) {
        console.error('[WS] Erreur en traitant le message:', err);
      }
    });

    this.websocket.addEventListener('close', () => {
      console.warn('[WS] WebSocket fermé');
      this.websocket = null;
    });

    this.websocket.addEventListener('error', (err) => {
      console.error('[WS] WebSocket erreur:', err);
    });
  }

  private async loadMessages(friendId: string) {
    try {
      console.log('[loadMessages] friendsId =', friendId);
      const result = await ApiService.getMessages(friendId);
      // On s’attend à un tableau de { sender: { id, username }, content }
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
      console.warn('[INVITE] Pas de friendId sélectionné');
      return;
    }
    if (!this.currentUserId) {
      console.warn('[INVITE] Pas d’utilisateur courant connu');
      return;
    }
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      console.warn('[INVITE] WebSocket non prêt ou non connecté');
      return;
    }

    const gameUrl = `/game-remote?id=${this.currentUserId}`;
    const invitationMessage = `
      <div>
        🎮 <strong>Invitation à jouer à Pong !</strong><br/>
        <button
          data-link="${gameUrl}"
          class="invite-play-btn m-3 px-3 py-3 bg-gradient-to-r from-white via-pink-100 to-purple-200 text-slate-900 hover:opacity-90 rounded-full transition">
          ▶ Jouer avec moi
        </button>
      </div>
    `;

    // Envoi côté serveur : type 'dm', payload : { toUserId, text }
    const payload = {
      type: 'dm',
      payload: {
        toUserId: Number(friendId),
        text: invitationMessage.trim(),
      },
    };
    this.websocket.send(JSON.stringify(payload));
    console.log('[INVITE] envoyée sur WebSocket:', payload);

    // On ajoute le message localement pour que l’utilisateur voit son propre message
    this.messages.push({
      author: 'Vous',
      text: invitationMessage.trim(),
      me: true,
    });
    this.render();
  }

  private async sendMessage() {
    const text = this.inputText.trim();
    if (!text) {
      return; // Rien à envoyer si c’est vide
    }
    const toUserId = Number(this.selectedConversationId);
    if (!toUserId) {
      console.warn('[sendMessage] Pas de conversation sélectionnée');
      return;
    }

    try {
      // 1) Envoi via l’API REST pour conserver en base de données
      await ApiService.sendMessage({ receiverId: toUserId, content: text });
      console.log('[sendMessage] REST API renvoyé OK');

      // 2) Envoi via WebSocket pour la livraison en temps réel
      const payload = {
        type: 'dm',
        payload: {
          toUserId,
          text,
        },
      };
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify(payload));
        console.log('[sendMessage] Envoyé sur WebSocket:', payload);
      } else {
        console.warn('[sendMessage] WS non ouvert, impossible d’envoyer le DM');
      }

      // 3) Ajout local du message pour afficher instantanément
      this.messages.push({ author: 'Vous', text, me: true });
      this.inputText = ''; // On vide l’input
      this.render();
    } catch (err) {
      console.error('[sendMessage] Erreur envoi:', err);
      this.flashMessage = 'Échec de l’envoi du message.';
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
    console.warn('[blockUser] Pas de conversation sélectionnée');
    return;
  }
  try {
    // 1) Appel à l’API pour bloquer
    await ApiService.blockUser(blockedId);

    // 2) Mettre à jour localement l’état “blocked” de cette conversation
    const conv = this.conversations.find((c) => c.id === String(blockedId));
    if (conv) conv.blocked = true;

    // 3) Afficher un message flash + re-render
    this.flashMessage = 'Utilisateur bloqué avec succès.';
    this.flashType = 'success';
    this.render();

    // 4) Effacer le message après 3 secondes
    setTimeout(() => {
      this.flashMessage = '';
      this.flashType = '';
      this.render();
    }, 3000);
  } catch (err) {
    console.error('[blockUser] failed:', err);
    this.flashMessage = 'Impossible de bloquer l’utilisateur.';
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
    console.warn('[unblockUser] Pas de conversation sélectionnée');
    return;
  }
  try {
    // 1) Appel à l’API pour débloquer
    await ApiService.unblockUser(unblockId);

    // 2) Mettre à jour localement l’état “blocked” de cette conversation
    const conv = this.conversations.find((c) => c.id === String(unblockId));
    if (conv) conv.blocked = false;

    // 3) Afficher un message flash + re-render
    this.flashMessage = 'Utilisateur débloqué avec succès.';
    this.flashType = 'success';
    this.render();

    // 4) Effacer le message après 3 secondes
    setTimeout(() => {
      this.flashMessage = '';
      this.flashType = '';
      this.render();
    }, 3000);
  } catch (err) {
    console.error('[unblockUser] failed:', err);
    this.flashMessage = 'Impossible de débloquer l’utilisateur.';
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
    window.location.href = `/friend-profile?id=${friendId}`;
  }

  render() {
    // Note : On reconstruit entièrement le innerHTML à chaque fois, 
    // donc on perd la sélection du caret dans l’input — ceci est juste pour la démo.
    // Si tu veux plus performant, envisage un diff ou un shadow DOM + lit-html / lit-element.

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
                // On récupère l’objet Conversation sélectionné
                const conv = this.conversations.find((x) => x.id === this.selectedConversationId)!;

                // On choisit le HTML du bouton selon conv.blocked
                const blockButtonHTML = conv.blocked
                  ? `<button
                       id="unblock-button"
                       class="px-3 py-1 bg-gradient-to-r from-green-500 via-green-600 to-green-700 text-white rounded-full hover:opacity-90 transition"
                     >
                       Débloquer
                     </button>`
                  : `<button
                       id="block-button"
                       class="px-3 py-1 bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white rounded-full hover:opacity-90 transition"
                     >
                       Bloquer
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
                      Inviter
                    </button>
                    <button
                      id="profile-button"
                      class="px-3 py-1 bg-gradient-to-r from-white via-pink-100 to-purple-200 text-slate-900 rounded-full hover:opacity-90 transition"
                    >
                      Profil
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
                          Pas de messages
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
                    placeholder="Tapez votre message…"
                    class="flex-1 px-4 py-2 rounded-l bg-white text-black focus:outline-none"
                    value="${this.inputText}"
                    autocomplete="off"
                  />
                  <button
                    id="send-button"
                    type="submit"
                    class="px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-r hover:opacity-90 transition"
                  >
                    Envoyer
                  </button>
                </form>
                `;
              })()
            : `
            <div class="flex-1 flex items-center justify-center text-gray-400 italic">
              Sélectionne une conversation pour démarrer
            </div>
          `
        }
      </main>
    </div>
  `;

  // Après avoir recréé le innerHTML, on remet le focus sur l’input
  const input = this.querySelector<HTMLInputElement>('#input-message');
  if (input) {
    setTimeout(() => input.focus(), 0);
  }
}
}

customElements.define('chat-view', ChatView);