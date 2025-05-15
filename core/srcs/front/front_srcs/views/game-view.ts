import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('game-view')
export class GameView extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .game-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 80vh;
      min-width: 80vw;
      box-sizing: border-box;
      background: #70358;
    }
    .responsive-canvas {
      width: 90vw;
      height: 70vh;
      max-width: 1000px;
      max-height: 700px;
      min-width: 300px;
      min-height: 200px;
      background: white;
      border: 2px solid red;
      display: block;
    }

  `;


  render() {
    console.log('Rendering game-view');
    return html`
      <div class="game-container">
        <div style="color: white; font-size: 2rem;">Big Pong</div>
        <canvas class="responsive-canvas"></canvas>
      </div>
    `;
  }
} 