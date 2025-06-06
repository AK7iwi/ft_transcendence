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
import './views/navbar-view.ts';
import './views/footer-view.ts';
import { WebSocketService } from './services/websocket-service';
import { API_BASE_URL } from './config';

// Si on est en dev local, on vide le localStorage
function isLocalDevHost(): boolean {
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
    return true;
  }
  const privateIPv4 = /^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})$/;
  return privateIPv4.test(host);
}

if (isLocalDevHost()) {
  console.log('[DEV] Vider le localStorage automatiquement');
  localStorage.clear();
}

// Initialisation du WebSocket à partir de API_BASE_URL
const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
const wsUrl      = `${wsProtocol}${API_BASE_URL.substring(API_BASE_URL.indexOf('://'))}/ws`;
const wsService  = new WebSocketService(wsUrl);

export default wsService;
// import { WebSocketService } from './services/websocket-service';
// import { API_BASE_URL } from './config';


// // WebSocket init
// const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
// const wsService = new WebSocketService(`${protocol}${window.location.hostname}:3000/ws`);
// export default wsService;

// // simple, au démarrage de l’app (avant de monter le router, etc.)
// // if (window.location.hostname === 'localhost') {
//   //   localStorage.clear();
//   // }
  
  
// function isLocalDevHost(): boolean {
//   const host = window.location.hostname;

//   // 1a. localhost, 127.0.0.1, ::1
//   if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
//     return true;
//   }

//   // 1b. Plage IPv4 privée 10.x.x.x, 192.168.x.x, 172.16.x.x – 172.31.x.x
//   // On utilise un simple regex pour les IPv4 privées
//   const privateIPv4 = /^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})$/;
//   if (privateIPv4.test(host)) {
//     return true;
//   }

//   // Si vous avez d’autres cas (ex : un DNS local spécifique), ajoutez-les ici.
//   return false;
// }

// if (isLocalDevHost()) {
//   console.log('[DEV] Vider le localStorage automatiquement');
//   localStorage.clear();
// }


  // ---- ROUTER ---- //
type Route = {
  path: string;
  component: string;
  protected?: boolean;
};

const routes: Route[] = [
  { path: '/', component: 'home-view' },
  { path: '/game', component: 'game-view' },
  { path: '/gamelog', component: 'gamelog-view', protected: true },
  { path: '/game-remote', component: 'game-remote-view' },
  { path: '/register', component: 'register-view' },
  { path: '/login', component: 'login-view' },
  { path: '/tournament', component: 'tournament-view', protected: true },
  { path: '/chat', component: 'chat-view', protected: true },
  { path: '/friend-profile', component: 'friend-profile-view', protected: true },
  { path: '/friends', component: 'friend-view', protected: true },
  { path: '/settings', component: 'settings-view', protected: true },
  { path: '/profile', component: 'profile-view', protected: true },
];


function navigateTo(path: string) {
  if (window.location.pathname !== path) {	// new - (évite d’ajouter plusieurs fois la même page dans l’historique, empêche de re-render inutilement une page déjà affichée)
    history.pushState({}, '', path);
    renderRoute();
    window.dispatchEvent(new Event('popstate'));
  }
}

// function navigateTo(path: string) {
//   history.pushState({}, '', path);
//   renderRoute();
//   window.dispatchEvent(new Event('popstate'));
// }

function renderRoute() {
  const main = document.querySelector('main');
  if (!main) return;

  const route = routes.find(r => r.path === window.location.pathname);
  const token = localStorage.getItem('token');

  if (!route) {
    navigateTo('/');
    return;
  }

  if (route.protected && !token) {
    navigateTo('/login');
    return;
  }

  main.innerHTML = `<${route.component}></${route.component}>`;
  // Force la mise à jour de la navbar (se déclenche après chaque changement de route, Met à jour dynamiquement sans reload)
  const navbar = document.querySelector('navbar-view') as any;	// new
  if (navbar?.update) navbar.update(); 							// new
}

// Listen to browser back/forward
window.addEventListener('popstate', renderRoute);

// Intercept in-app <a> navigation
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('/')) {
    e.preventDefault();
    navigateTo(target.getAttribute('href')!);
  }
});

// ---- APP COMPONENT ---- //

class PongApp extends HTMLElement {
  connectedCallback() {
    document.body.className = 'bg-slate-900 text-white';
    this.innerHTML = `<p hidden>pong-app loaded</p>`;
    renderRoute();
  }

  logout() {
    localStorage.removeItem('token');
    navigateTo('/');
  }
}

customElements.define('pong-app', PongApp);

export { navigateTo };




// class PongApp extends HTMLElement {
//   constructor() {
//     super();
//   }

//   connectedCallback() {
//     document.body.className = 'bg-slate-900 text-white';
//     this.innerHTML = `<p hidden>pong-app loaded</p>`;
//     this.updateLinks();
//     this.toggleAuthButtons();
//     this.setupRouter();
//   }

//   toggleAuthButtons() {
//     const authButtons = document.querySelector('#auth-buttons') as HTMLElement;
//     const token = localStorage.getItem('token');
//     if (authButtons) {
//       authButtons.style.display = token ? 'none' : 'flex';
//     }
//   }

//   updateLinks() {
//     const isAuthenticated = !!localStorage.getItem('token');
//     const navLinks = document.querySelector('#nav-links');

//     if (!navLinks) {
//       console.warn('❌ nav-links not found');
//       return;
//     }

//     navLinks.innerHTML = '';

//     const staticLinks: { href: string; label: string }[] = [];

//     const authLinks = isAuthenticated
//       ? [
//           { href: '/gamelog', label: 'Game' },
//           { href: '/tournament', label: 'Tournament' },
//           { href: '/chat', label: 'Chat' },
//           { href: '/friends', label: 'Friends' },
//           { href: '/settings', label: 'Settings' },
//           { href: '/profile', label: 'Profile' },
//         ]
//       : [];

//     const createLink = ({ href, label, onClick }: any) => {
//       const link = document.createElement('a');
//       link.href = href;
//       link.className =
//         'relative transition duration-300 ease-in-out ' +
//         'hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-indigo-400 hover:via-purple-500 hover:to-pink-500 ' +
//         'after:content-[""] after:absolute after:left-0 after:bottom-0 after:w-0 ' +
//         'hover:after:w-full after:h-[2px] after:bg-gradient-to-r after:from-indigo-400 after:via-purple-500 after:to-pink-500 ' +
//         'after:transition-all after:duration-300';
//       link.innerHTML = label;
//       if (onClick) {
//         link.addEventListener('click', (e) => {
//           e.preventDefault();
//           onClick();
//         });
//       }
//       return link;
//     };

//     staticLinks.forEach(link => navLinks.appendChild(createLink(link)));
//     authLinks.forEach(link => navLinks.appendChild(createLink(link)));
//   }

//   logout() {
//     localStorage.removeItem('token');
//     this.updateLinks();
//     this.toggleAuthButtons();
//     navigateTo('/');
//   }

//   setupRouter() {
//     renderRoute();
//   }
// }

// customElements.define('pong-app', PongApp);

// export { navigateTo };