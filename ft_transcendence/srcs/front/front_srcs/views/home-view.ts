import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('home-view')
export class HomeView extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 1rem;
    }
  `;

  render() {
    return html`
      <div class="flex flex-col items-center justify-center min-h-[80vh]">
        <h1 class="text-4xl font-bold mb-8">Welcome to Pong</h1>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
          <div class="bg-secondary/10 p-6 rounded-lg">
            <h2 class="text-2xl font-semibold mb-4">Quick Play</h2>
            <p class="mb-4">Jump right into a game of Pong!</p>
            <a href="/game" class="inline-block bg-accent text-primary px-6 py-2 rounded hover:bg-accent/80">
              Play Now
            </a>
          </div>
          <div class="bg-secondary/10 p-6 rounded-lg">
            <h2 class="text-2xl font-semibold mb-4">Tournaments</h2>
            <p class="mb-4">Compete in tournaments and win prizes!</p>
            <a href="/tournament" class="inline-block bg-accent text-primary px-6 py-2 rounded hover:bg-accent/80">
              Join Tournament
            </a>
          </div>
        </div>
      </div>
    `;
  }
} 