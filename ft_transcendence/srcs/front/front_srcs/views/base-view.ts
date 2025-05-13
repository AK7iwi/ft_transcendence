import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('base-view')
export class BaseView extends LitElement {
  static styles = css`
    :host {
      display: block;
      animation: fadeIn var(--transition-normal);
    }

    .container {
      max-width: 1280px;
      margin: 0 auto;
      padding: var(--spacing-lg);
    }

    .page-title {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: var(--spacing-xl);
      background: linear-gradient(135deg, var(--color-accent), #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .section {
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      padding: var(--spacing-xl);
      margin-bottom: var(--spacing-xl);
      box-shadow: var(--shadow-md);
      border: 1px solid var(--color-border);
      transition: transform var(--transition-normal);
    }

    .section:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    .section-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: var(--spacing-lg);
      color: var(--color-text);
    }

    .grid {
      display: grid;
      gap: var(--spacing-lg);
    }

    .grid-2 {
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    }

    .grid-3 {
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    }

    .flex {
      display: flex;
    }

    .flex-col {
      flex-direction: column;
    }

    .items-center {
      align-items: center;
    }

    .justify-between {
      justify-content: space-between;
    }

    .gap-4 {
      gap: var(--spacing-md);
    }

    .gap-8 {
      gap: var(--spacing-xl);
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

  render() {
    return html`
      <div class="container">
        <slot></slot>
      </div>
    `;
  }
} 