import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('tournament-view')
export class TournamentView extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-xl);
    }

    .tournament-grid {
      display: grid;
      gap: var(--spacing-lg);
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    }

    .tournament-card {
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      padding: var(--spacing-lg);
      border: 1px solid var(--color-border);
      transition: all var(--transition-normal);
      animation: slideUp var(--transition-normal);
    }

    .tournament-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
      border-color: var(--color-accent);
    }

    .tournament-name {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: var(--spacing-sm);
      color: var(--color-text);
    }

    .tournament-info {
      color: var(--color-text-secondary);
      font-size: 0.875rem;
      margin-bottom: var(--spacing-md);
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: uppercase;
    }

    .status-pending {
      background: rgba(245, 158, 11, 0.2);
      color: var(--color-warning);
    }

    .status-active {
      background: rgba(34, 197, 94, 0.2);
      color: var(--color-success);
    }

    .status-completed {
      background: rgba(99, 102, 241, 0.2);
      color: var(--color-accent);
    }

    .create-form {
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      padding: var(--spacing-xl);
      margin-bottom: var(--spacing-xl);
      border: 1px solid var(--color-border);
      animation: slideUp var(--transition-normal);
    }

    .form-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: var(--spacing-lg);
      color: var(--color-text);
    }

    .form-group {
      margin-bottom: var(--spacing-lg);
    }

    .form-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: var(--spacing-sm);
      color: var(--color-text-secondary);
    }

    .form-input {
      width: 100%;
      padding: var(--spacing-sm) var(--spacing-md);
      background: var(--color-background);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      color: var(--color-text);
      transition: all var(--transition-fast);
    }

    .form-input:focus {
      outline: none;
      border-color: var(--color-accent);
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--spacing-md);
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;

  @state()
  private tournaments: Array<{
    id: number;
    name: string;
    status: 'pending' | 'active' | 'completed';
    players: number;
  }> = [];

  @state()
  private isCreatingTournament = false;

  @state()
  private newTournamentName = '';

  render() {
    return html`
<div class="header">
          <h1 class="page-title">Tournaments</h1>
          <button 
            @click=${() => this.isCreatingTournament = true}
            class="btn btn-primary"
          >
            Create Tournament
          </button>
        </div>

        ${this.isCreatingTournament ? html`
          <div class="create-form">
            <h2 class="form-title">Create New Tournament</h2>
            <div class="form-group">
              <label class="form-label">Tournament Name</label>
              <input 
                type="text" 
                .value=${this.newTournamentName}
                @input=${(e: Event) => this.newTournamentName = (e.target as HTMLInputElement).value}
                class="form-input"
                placeholder="Enter tournament name"
              />
            </div>
            <div class="form-actions">
              <button 
                @click=${() => this.isCreatingTournament = false}
                class="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                @click=${this.createTournament}
                class="btn btn-primary"
              >
                Create
              </button>
            </div>
          </div>
        ` : ''}

        <div class="tournament-grid">
          ${this.tournaments.map(tournament => html`
            <div class="tournament-card">
              <h3 class="tournament-name">${tournament.name}</h3>
              <div class="tournament-info">
                <span class="status-badge status-${tournament.status}">
                  ${tournament.status}
                </span>
                <span class="ml-2">${tournament.players} players</span>
              </div>
              <button 
                @click=${() => this.joinTournament(tournament.id)}
                class="btn btn-primary w-full"
                ?disabled=${tournament.status !== 'pending'}
              >
                ${tournament.status === 'pending' ? 'Join' : 'View'}
              </button>
            </div>
          `)}
        </div>
    `;
  }

  private createTournament() {
    if (!this.newTournamentName) return;
    this.tournaments = [...this.tournaments, {
      id: Date.now(),
      name: this.newTournamentName,
      status: 'pending',
      players: 0
    }];
    this.newTournamentName = '';
    this.isCreatingTournament = false;
  }

  private joinTournament(tournamentId: number) {
    console.log('Joining tournament:', tournamentId);
  }
} 