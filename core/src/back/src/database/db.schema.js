const db = require('./db.index');

// Create users table
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        two_factor_secret TEXT,
        avatar TEXT,
        two_factor_enabled BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// Create games table
db.exec(`
    CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player1_id INTEGER,
        player2_id INTEGER,
        winner_id INTEGER,
        score1 INTEGER DEFAULT 0,
        score2 INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player1_id) REFERENCES users(id),
        FOREIGN KEY (player2_id) REFERENCES users(id),
        FOREIGN KEY (winner_id) REFERENCES users(id)
    )
`);

// Create tournaments table
db.exec(`
    CREATE TABLE IF NOT EXISTS tournaments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// Create tournament_participants table
db.exec(`
    CREATE TABLE IF NOT EXISTS tournament_matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tournament_id INTEGER,
        game_id INTEGER,
        round INTEGER,
        match_number INTEGER,
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
        FOREIGN KEY (game_id) REFERENCES games(id)
)`);

db.exec(`
    CREATE TABLE IF NOT EXISTS friends (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        friend_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, friend_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (friend_id) REFERENCES users(id)
)`);


try {
    db.prepare(`ALTER TABLE friends ADD COLUMN status TEXT DEFAULT 'accepted'`).run();
} catch (err) {
    if (!err.message.includes('duplicate column name')) {
        console.error('Erreur en ajoutant la colonne status :', err.message);
    }
}

module.exports = db; 