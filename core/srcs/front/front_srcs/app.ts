import { Router } from '@vaadin/router';
import { wsInstance } from '../services/websocket-instance';
import './styles.css';

import './views/home-view.ts';
import './views/game-view.ts';
import './views/gamelog-view.ts';
import './views/game-remote-view.ts';
import './views/tournament-view.ts';
import './views/chat-view.ts';
import './views/friend-profile-view.ts';

import './views/friend-view.ts';
import './views/settings-view.ts';
import './views/profile-view.ts';
import './views/login-view.ts';
import './views/register-view.ts';

// new
import './views/navbar-view.ts';
import './views/footer-view.ts';



import { WebSocketService } from './services/websocket-service';

const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
const wsService = new WebSocketService(`${protocol}${window.location.hostname}:3000/ws`);
export default wsService;

// Fonction pour protéger les routes
function requireAuth(context: any, commands: any) {
  const token = localStorage.getItem('token');
  if (!token) {
    return commands.redirect('/login');
  }
  return undefined;
}

class PongApp extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.innerHTML = `<p hidden>pong-app loaded</p>`;
    this.updateLinks();
    this.toggleAuthButtons();
    this.setupRouter();
  }

  toggleAuthButtons() {
    const authButtons = document.querySelector('#auth-buttons') as HTMLElement;
    const token = localStorage.getItem('token');
    if (authButtons) {
      authButtons.style.display = token ? 'none' : 'flex';
    }
  }

  updateLinks() {
    const isAuthenticated = !!localStorage.getItem('token');
    const navLinks = document.querySelector('#nav-links');

    if (!navLinks) {
      console.warn('❌ nav-links not found');
      return;
    }

    navLinks.innerHTML = ''; // Reset existing links

    const staticLinks = [
      ,
    ];

    const authLinks = isAuthenticated ? [
      { href: '/gamelog', label: 'Game' },
      { href: '/tournament', label: 'Tournament' },
      { href: '/chat', label: 'Chat' },
      { href: '/friends', label: 'Friends' },
      { href: '/settings', label: 'Settings' },
      { href: '/profile', label: 'Profile' },
    ] : [];

    const createLink = ({ href, label, onClick }: any) => {
      const link = document.createElement('a');
      link.href = href;
      link.className =
        'relative transition duration-300 ease-in-out ' +
        'hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-indigo-400 hover:via-purple-500 hover:to-pink-500 ' +
        'after:content-[\'\'] after:absolute after:left-0 after:bottom-0 after:w-0 ' +
        'hover:after:w-full after:h-[2px] after:bg-gradient-to-r after:from-indigo-400 after:via-purple-500 after:to-pink-500 ' +
        'after:transition-all after:duration-300';
      link.innerHTML = `${label}`;
      if (onClick) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          onClick();
        });
      }
      return link;
    };

    staticLinks.forEach(link => navLinks.appendChild(createLink(link)));
    authLinks.forEach(link => navLinks.appendChild(createLink(link)));
  }

  logout() {
    localStorage.removeItem('token');
    this.updateLinks();
    this.toggleAuthButtons();
    window.location.href = '/';
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
      { path: '/gamelog', component: 'gamelog-view', action: requireAuth },
      { path: '/game-remote', component: 'game-remote-view' },
      { path: '/register', component: 'register-view' },
      { path: '/login', component: 'login-view' },

      // Routes protégées
      { path: '/tournament', component: 'tournament-view', action: requireAuth },
      { path: '/chat', component: 'chat-view', action: requireAuth },
      { path: '/friend-profile', component: 'friend-profile-view', action: requireAuth },
      { path: '/friends', component: 'friend-view', action: requireAuth },
      { path: '/settings', component: 'settings-view', action: requireAuth },
      { path: '/profile', component: 'profile-view', action: requireAuth },

	  

      { path: '(.*)', redirect: '/' }
    ]);
  }
}

customElements.define('pong-app', PongApp);