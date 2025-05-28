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
import './views/login-view.ts';
import './views/register-view.ts';

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
  this.toggleAuthButtons(); // ← ici
  this.setupRouter();
}


  toggleAuthButtons() {
  const isAuthenticated = !!localStorage.getItem('token');
  const authButtons = document.querySelector('#auth-buttons');

  if (authButtons) {
    authButtons.classList.toggle('hidden', isAuthenticated);
  }
}

updateLinks() {
  const isAuthenticated = !!localStorage.getItem('token');
  const navLinks = document.querySelector('#nav-links');

  if (!navLinks) {
    console.warn('❌ nav-links not found');
    return;
  }

  navLinks.innerHTML = ''; // Nettoyer l'existant

  // Ces liens doivent toujours être visibles
  const staticLinks = [
    { href: '/', icon: 'fa-solid fa-house', label: 'Home' },
    { href: '/game', icon: 'fa-solid fa-gamepad', label: 'Game' },
  ];

  // Liens visibles uniquement si l’utilisateur est connecté
  const authLinks = [
    { href: '/tournament', icon: 'fa-solid fa-trophy', label: 'Tournament' },
    { href: '/chat', icon: 'fa-solid fa-comments', label: 'Chat' },
    { href: '/friends', icon: 'fa-solid fa-user-group', label: 'Friends' },
    { href: '/settings', icon: 'fa-solid fa-gear', label: 'Settings' },
    { href: '/profile', icon: 'fa-solid fa-user', label: 'Profile' },
  ];

  const createLink = ({ href, icon, label }: any) => {
    const link = document.createElement('a');
    link.href = href;
    link.className = 'relative transition duration-300 ease-in-out hover:text-indigo-500 after:content-[\'\'] after:absolute after:left-0 after:bottom-0 after:w-0 hover:after:w-full after:h-[2px] after:bg-indigo-500 after:transition-all after:duration-300';
    link.innerHTML = `<i class="${icon}"></i> ${label}`;
    return link;
  };

  // Ajout des liens publics
  staticLinks.forEach(link => navLinks.appendChild(createLink(link)));

  // Ajout des liens dynamiques selon l'état
const dynamicLinks = isAuthenticated ? authLinks : [];
  dynamicLinks.forEach(link => navLinks.appendChild(createLink(link)));
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

      // Routes protégées
      { path: '/tournament', component: 'tournament-view', action: requireAuth },
      { path: '/chat', component: 'chat-view', action: requireAuth },
      { path: '/friends', component: 'friend-view', action: requireAuth },
      { path: '/settings', component: 'settings-view', action: requireAuth },
      { path: '/profile', component: 'profile-view', action: requireAuth },

      { path: '(.*)', redirect: '/' }
    ]);
  }
}

customElements.define('pong-app', PongApp);
