const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

const dbDir = process.env.DB_PATH ? path.dirname(process.env.DB_PATH) : path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Create database
let db;
try {
    const dbPath = process.env.DB_PATH || path.join(dbDir, 'database.sqlite');
    console.log('Initializing database at:', dbPath);
    db = new Database(dbPath, { verbose: console.log });
    db.pragma('foreign_keys = ON');
} catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
}

// Initialize tables
function initializeDatabase() {
    try {
        db.exec(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            two_factor_secret TEXT,
            avatar TEXT,
            two_factor_enabled BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        db.exec(`CREATE TABLE IF NOT EXISTS games (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player1_id INTEGER,
            player2_id INTEGER,
            winner_id INTEGER,
            score1 INTEGER DEFAULT 0,
            score2 INTEGER DEFAULT 0,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (player1_id) REFERENCES users(id),
            FOREIGN KEY (player2_id) REFERENCES users(id),
            FOREIGN KEY (winner_id) REFERENCES users(id)
        )`);

        db.exec(`CREATE TABLE IF NOT EXISTS tournaments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        // mat : db for history
        db.exec(`CREATE TABLE IF NOT EXISTS match_history (
          match_id        INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id         INTEGER NOT NULL,
          opponent        TEXT NOT NULL,
          result          TEXT CHECK(result IN ('win', 'loss')) NOT NULL,
          score_user      INTEGER NOT NULL,
          score_opponent  INTEGER NOT NULL,
          played_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );`)
        db.exec(`CREATE TABLE IF NOT EXISTS tournament_matches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tournament_id INTEGER,
            game_id INTEGER,
            round INTEGER,
            match_number INTEGER,
            FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
            FOREIGN KEY (game_id) REFERENCES games(id)
        )`);
                db.exec(`CREATE TABLE IF NOT EXISTS friends (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            friend_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, friend_id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (friend_id) REFERENCES users(id)
            
        )`);
        db.exec(`CREATE TABLE IF NOT EXISTS blocked_users (
  user_id INTEGER,
  blocked_id INTEGER,
  PRIMARY KEY (user_id, blocked_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (blocked_id) REFERENCES users(id)
        )`);
db.exec(`CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(sender_id) REFERENCES users(id),
  FOREIGN KEY(receiver_id) REFERENCES users(id)
);`);
db.exec(`CREATE TABLE IF NOT EXISTS blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    blocker_id INTEGER NOT NULL,
    blocked_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE
);`);
db.exec(`
  DROP TABLE IF EXISTS game_results;
  CREATE TABLE game_results (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    winner_id  INTEGER,
    loser_id   INTEGER,
    played_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (loser_id)  REFERENCES users(id) ON DELETE CASCADE
  );
`);

// (3) Définissez seulement ces deux UPDATE dans le trigger :
db.exec(`
  DROP TRIGGER IF EXISTS increment_stats_after_insert;

CREATE TRIGGER increment_stats_after_insert
  AFTER INSERT ON game_results
  FOR EACH ROW
BEGIN
  -- Si un winner_id a été fourni, on augmente “wins”
  UPDATE users
    SET wins = wins + 1
    WHERE id = NEW.winner_id;

  -- Si un loser_id a été fourni (non NULL), on augmente “losses”
  UPDATE users
    SET losses = losses + 1
    WHERE id = NEW.loser_id;
END;
`);
db.exec(`CREATE TABLE IF NOT EXISTS remote_games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player1_id INTEGER NOT NULL,
  player2_id INTEGER NOT NULL,
  score1 INTEGER NOT NULL,
  score2 INTEGER NOT NULL,
  winner_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player1_id) REFERENCES users(id),
  FOREIGN KEY (player2_id) REFERENCES users(id),
  FOREIGN KEY (winner_id) REFERENCES users(id)
);`);


// Ajout sécurisé des colonnes "wins" et "losses"
try {
    db.prepare(`ALTER TABLE users ADD COLUMN wins INTEGER DEFAULT 0`).run();
} catch (err) {
    if (!err.message.includes('duplicate column name')) {
        console.error('Erreur en ajoutant la colonne wins :', err.message);
    }
}

try {
    db.prepare(`ALTER TABLE users ADD COLUMN losses INTEGER DEFAULT 0`).run();
} catch (err) {
    if (!err.message.includes('duplicate column name')) {
        console.error('Erreur en ajoutant la colonne losses :', err.message);
    }
}



        // Ajout sécurisé de la colonne "status"
        try {
            db.prepare(`ALTER TABLE friends ADD COLUMN status TEXT DEFAULT 'accepted'`).run();
        } catch (err) {
            if (!err.message.includes('duplicate column name')) {
                console.error('Erreur en ajoutant la colonne status :', err.message);
            }
        }



        console.log('Database tables initialized successfully');
    } catch (error) {
        console.error('Failed to initialize database tables:', error);
        process.exit(1);
    }
}

function saveRemoteGame({ player1Id, player2Id, score1, score2, winnerId }) {
  const stmt = db.prepare(`
    INSERT INTO remote_games (player1_id, player2_id, score1, score2, winner_id)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(player1Id, player2Id, score1, score2, winnerId);
}


function updateAllWinLossCounts() {
  // Réinitialise les compteurs
  db.prepare(`UPDATE users SET wins = 0, losses = 0`).run();

  // Compte les victoires
  db.prepare(`
    UPDATE users SET wins = (
      SELECT COUNT(*) FROM game_results WHERE winner_id = users.id
    )
  `).run();

  // Compte les défaites
  db.prepare(`
    UPDATE users SET losses = (
      SELECT COUNT(*) FROM game_results WHERE loser_id = users.id
    )
  `).run();
}


// Custom DB functions
async function getUserByUsername(username) {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username);
}

function getUserByUsernameforMat(username) {
  console.log('[DB] Looking up:', username); // 🔍 log input
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  const user = stmt.get(username);
  console.log('[DB] Found:', user); // 🔍 log result
  return user; 
}

async function createUser({ username, password }) {
    const password_hash = await bcrypt.hash(password, 10);
    const stmt = db.prepare(`
        INSERT INTO users (username, password_hash)
        VALUES (?, ?)
    `);
    stmt.run(username, password_hash);
}

async function updateUser(currentUsername, newUsername) {
  let updates = [];
  let params = [];

  if (newUsername) {
    updates.push('username = ?');
    params.push(newUsername);
  }

  if (updates.length === 0) return;

  params.push(currentUsername);

  const stmt = db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE username = ?`);
  stmt.run(...params);
}

async function updatePassword(username, newPassword) {
  const password_hash = await bcrypt.hash(newPassword, 10);
  const stmt = db.prepare(`UPDATE users SET password_hash = ? WHERE username = ?`);
  stmt.run(password_hash, username);
}

async function storeTwoFactorSecret(username, secret) {
  const stmt = db.prepare(`UPDATE users SET two_factor_secret = ? WHERE username = ?`);
  stmt.run(secret, username);
}

async function enableTwoFactor(username) {
  const stmt = db.prepare(`UPDATE users SET two_factor_enabled = 1 WHERE username = ?`);
  stmt.run(username);
}

function recordGameResultTournament(winnerId, loserId) {
  const stmt = db.prepare(`
    INSERT INTO game_results (winner_id, loser_id)
    VALUES (?, ?)
  `);
  stmt.run(winnerId, loserId);
}

function recordMatchHistory({ userId, opponent, result, scoreUser, scoreOpponent, playedAt }) {
  const stmt = db.prepare(`
    INSERT INTO match_history (user_id, opponent, result, score_user, score_opponent, played_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(userId, opponent, result, scoreUser, scoreOpponent, playedAt);
}


// function recordMatchHistory({ userId, opponent, result, scoreUser, scoreOpponent }) {
//   const stmt = db.prepare(`
//     INSERT INTO match_history (user_id, opponent, result, score_user, score_opponent)
//     VALUES (?, ?, ?, ?, ?)
//   `);
//   stmt.run(userId, opponent, result, scoreUser, scoreOpponent);
// }

function getUserById(userId) {
  const stmt = db.prepare('SELECT username FROM users WHERE id = ?');
  return stmt.get(userId);
}



// module.exports.updateUser = updateUser;


// Initialize DB
initializeDatabase();


// Export custom API
module.exports = {
    db,
    initializeDatabase,
     getUserById,
    getUserByUsername,
    getUserByUsernameforMat,
    createUser,
    updateUser,
    updatePassword,
    storeTwoFactorSecret,
    enableTwoFactor,
    recordGameResultTournament,
    recordMatchHistory,
    saveRemoteGame,
};
