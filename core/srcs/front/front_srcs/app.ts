import { Router } from '@vaadin/router';
import { wsInstance } from '../services/websocket-instance';
import './styles.css';

import './views/home-view.ts';
import './views/game-view.ts';
import './views/tournament-view.ts';
import './views/chat-view.ts';
import './views/friend-view.ts';
import './views/settings-view.ts';
import './views/profile-view.ts';
import './views/friend-profile-view.ts';
import './views/login-view.ts';
import './views/register-view.ts';

import { WebSocketService } from './services/websocket-service';

const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
const wsService = new WebSocketService(`${protocol}${window.location.hostname}:3000/ws`);
export default wsService;

class PongApp extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.innerHTML = `<p hidden>pong-app loaded</p>`; // placeholder pour éviter de casser l’arbre DOM
    this.updateLinks();
    this.setupRouter();
  }

  updateLinks() {
    const isAuthenticated = !!localStorage.getItem('token');
    const navLinks = document.querySelector('#nav-links'); // ⚠️ important : doit être en dehors de <pong-app>

    if (navLinks) {
      navLinks.innerHTML = `
        ${!isAuthenticated ? `<a href="/register" class="text-white hover:text-purple-400 font-medium text-lg px-3 py-1 rounded-md transition">Register</a>` : ''}
        <a href="/game" class="text-white hover:text-purple-400 font-medium text-lg px-3 py-1 rounded-md transition">Game</a>
        <a href="/tournament" class="text-white hover:text-purple-400 font-medium text-lg px-3 py-1 rounded-md transition">Tournament</a>
        <a href="/chat" class="text-white hover:text-purple-400 font-medium text-lg px-3 py-1 rounded-md transition">Chat</a>
        <a href="/friends" class="text-white hover:text-purple-400 font-medium text-lg px-3 py-1 rounded-md transition">Friends</a>
        <a href="/settings" class="text-white hover:text-purple-400 font-medium text-lg px-3 py-1 rounded-md transition">Settings</a>
        <a href="/profile" class="text-white hover:text-purple-400 font-medium text-lg px-3 py-1 rounded-md transition">Profile</a>
      `;
    }
  }


  
  setupRouter() {
    const outlet = document.querySelector('main');
    if (!outlet) {
      console.error('❌ <main> element not found in DOM!');
      return;
    }

    const router = new Router(outlet);
    router.setRoutes([
  { path: '/', component: 'home-view' },
  { path: '/game', component: 'game-view' },
  { path: '/register', component: 'register-view' },
  { path: '/login', component: 'login-view' },

  // Routes protégées (uniquement si connecté)
  { path: '/tournament', component: 'tournament-view', action: requireAuth },
  { path: '/chat', component: 'chat-view', action: requireAuth },
  { path: '/friends', component: 'friend-view', action: requireAuth },
  { path: '/settings', component: 'settings-view', action: requireAuth },
  { path: '/profile', component: 'profile-view', action: requireAuth },
  { path: '/friend-profile', component: 'friend-profile-view', action: requireAuth },

  { path: '(.*)', redirect: '/' }
]);

  }
}

customElements.define('pong-app', PongApp);
