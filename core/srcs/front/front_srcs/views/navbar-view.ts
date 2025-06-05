// navbar-view.ts
class NavbarView extends HTMLElement {
  connectedCallback() {
    this.update();    // Au chargement initial
    // Réagir aux changements de route
    window.addEventListener('popstate', () => this.update());
  }

  disconnectedCallback() {
    window.removeEventListener('popstate', () => this.update());
  }

  public update() {
    const isAuthenticated = !!localStorage.getItem('token');
    const isHomePage     = window.location.pathname === '/';

    // NOTE : on corrige ici la condition Sign In / Sign Up
    this.innerHTML = `
      <nav class="bg-gray-800 py-6 px-4 text-lg">
        <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <!-- Logo -->
          <div class="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent
                      bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500">
            <a href="/">PONG GAME</a>
          </div>

          ${!isHomePage && isAuthenticated
            ? `<div id="nav-links" class="flex-1 flex justify-center items-center gap-x-4">
                 <a href="/gamelog"    class="${this.linkClass()}">Game</a>
                 <a href="/tournament" class="${this.linkClass()}">Tournament</a>
                 <a href="/chat"       class="${this.linkClass()}">Chat</a>
                 <a href="/friends"    class="${this.linkClass()}">Friends</a>
                 <a href="/settings"   class="${this.linkClass()}">Settings</a>
                 <a href="/profile"    class="${this.linkClass()}">Profile</a>
               </div>`
            : `<div id="nav-links" class="flex-1"></div>`}

          ${!isAuthenticated
            ? `<a href="/login"    class="px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500
                                        text-white rounded-full hover:opacity-90 transition">
                 Sign In
               </a>
               <a href="/register" class="px-4 py-2 bg-gradient-to-r from-white via-pink-100 to-purple-200
                                        text-slate-900 rounded-full hover:opacity-90 transition">
                 Sign Up
               </a>`
            : ``}
        </div>
      </nav>
    `;

    // On intercepte la navigation interne sur les <a>
    this.querySelectorAll('a[href^="/"]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const href = (e.currentTarget as HTMLAnchorElement).getAttribute('href')!;
        history.pushState({}, '', href);
        window.dispatchEvent(new Event('popstate'));
      });
    });
  }

  private linkClass(): string {
    return [
      'relative',
      'transition',
      'duration-300',
      'ease-in-out',
      'hover:text-transparent',
      'hover:bg-clip-text',
      'hover:bg-gradient-to-r',
      'hover:from-indigo-400',
      'hover:via-purple-500',
      'hover:to-pink-500',
      "after:content-['']",
      'after:absolute',
      'after:left-0',
      'after:bottom-0',
      'after:w-0',
      'hover:after:w-full',
      'after:h-[2px]',
      'after:bg-gradient-to-r',
      'after:from-indigo-400',
      'after:via-purple-500',
      'after:to-pink-500',
      'after:transition-all',
      'after:duration-300'
    ].join(' ');
  }
}

customElements.define('navbar-view', NavbarView);
