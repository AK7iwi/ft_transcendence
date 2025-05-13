import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { Router } from '@vaadin/router';
import './styles.css';

@customElement('pong-app')
export class PongApp extends LitElement {
  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      background: linear-gradient(135deg, var(--color-background), #1e1b4b);
    }

    .nav-container {
      background: rgba(30, 41, 59, 0.8);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      position: sticky;
      top: 0;
      z-index: 50;
    }

    .nav-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      max-width: 1280px;
      margin: 0 auto;
    }

    .logo {
      font-size: 1.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--color-accent), #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-decoration: none;
      transition: transform var(--transition-fast);
    }

    .logo:hover {
      transform: scale(1.05);
    }

    .nav-links {
      display: flex;
      gap: 2rem;
      align-items: center;
    }

    .nav-link {
      color: var(--color-text);
      text-decoration: none;
      font-weight: 500;
      padding: 0.5rem 1rem;
      border-radius: var(--radius-md);
      transition: all var(--transition-fast);
    }

    .nav-link:hover {
      color: var(--color-accent);
      background: rgba(99, 102, 241, 0.1);
    }

    main {
      max-width: 1280px;
      margin: 0 auto;
      padding: 2rem;
      animation: fadeIn var(--transition-normal);
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;

  firstUpdated() {
    const router = new Router(this.shadowRoot?.querySelector('main'));
    router.setRoutes([
      { path: '/', component: 'home-view' },
      { path: '/game', component: 'game-view' },
      { path: '/tournament', component: 'tournament-view' },
      { path: '/settings', component: 'settings-view' },
      { path: '/profile', component: 'profile-view' },
      { path: '(.*)', redirect: '/' }
    ]);
  }

  render() {
    return html`
      <div class="min-h-screen flex flex-col">
        <nav class="nav-container">
          <div class="nav-content">
            <a href="/" class="logo">Pong</a>
            <div class="nav-links">
              <a href="/game" class="nav-link">Game</a>
              <a href="/tournament" class="nav-link">Tournament</a>
              <a href="/settings" class="nav-link">Settings</a>
              <a href="/profile" class="nav-link">Profile</a>
            </div>
          </div>
        </nav>
        <main></main>
      </div>
    `;
  }
} 