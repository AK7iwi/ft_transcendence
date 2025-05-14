import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('home-view')
export class HomeView extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 2rem;
      width: 100%;
    }
  `;

  render() {
    return html`
      <div class="flex flex-col items-center justify-center min-h-[80vh] w-full">
        <h1 class="text-6xl font-bold mb-12">Welcome to Pong</h1>
        <div class="grid grid-cols-2 gap-12 max-w-7xl w-full">
          <div class="bg-secondary/10 p-8 rounded-lg">
            <p class="text-2xl mb-6">Jump right into a game of Pong!</p>
          </div>
          <div class="bg-secondary/10 p-8 rounded-lg">
            <p class="text-2xl mb-6">Join a tournament!</p>
            <button class="btn btn-secondary text-xl px-8 py-4">Join Tournament</button>
          </div>
        </div>
      </div>
    `;
  }
} 