const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

// Ensure the database directory exists
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
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            two_factor_secret TEXT,
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

        db.exec(`CREATE TABLE IF NOT EXISTS tournament_matches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tournament_id INTEGER,
            game_id INTEGER,
            round INTEGER,
            match_number INTEGER,
            FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
            FOREIGN KEY (game_id) REFERENCES games(id)
        )`);

        console.log('Database tables initialized successfully');
    } catch (error) {
        console.error('Failed to initialize database tables:', error);
        process.exit(1);
    }
}

// ✅ Custom DB functions
async function getUserByUsername(username) {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username);
}

async function createUser({ username, email, password }) {
    const password_hash = await bcrypt.hash(password, 10);
    const stmt = db.prepare(`
        INSERT INTO users (username, email, password_hash)
        VALUES (?, ?, ?)
    `);
    stmt.run(username, email, password_hash);
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


module.exports.updateUser = updateUser;


// Initialize DB
initializeDatabase();

// ✅ Export custom API
module.exports = {
    db,
    initializeDatabase,
    getUserByUsername,
    createUser,
    updateUser,
    updatePassword,
    storeTwoFactorSecret,
    enableTwoFactor
};



// const Database = require('better-sqlite3');
// const path = require('path');
// const fs = require('fs');

// // Ensure the database directory exists
// const dbDir = process.env.DB_PATH ? path.dirname(process.env.DB_PATH) : path.join(__dirname, 'data');
// if (!fs.existsSync(dbDir)) {
//     fs.mkdirSync(dbDir, { recursive: true });
// }

// // Create a new database instance with better error handling
// let db;
// try {
//     const dbPath = process.env.DB_PATH || path.join(dbDir, 'database.sqlite');
//     console.log('Initializing database at:', dbPath);
    
//     db = new Database(dbPath, {
//         verbose: console.log,
//         fileMustExist: false // Allow creating new database if it doesn't exist
//     });

//     // Enable foreign keys
//     db.pragma('foreign_keys = ON');
// } catch (error) {
//     console.error('Failed to initialize database:', error);
//     process.exit(1);
// }

// // Create tables with better error handling
// function initializeDatabase() {
//     try {
//         // Users table
//         db.exec(`
//             CREATE TABLE IF NOT EXISTS users (
//                 id INTEGER PRIMARY KEY AUTOINCREMENT,
//                 username TEXT UNIQUE NOT NULL,
//                 email TEXT UNIQUE NOT NULL,
//                 password_hash TEXT NOT NULL,
//                 two_factor_secret TEXT,
//                 two_factor_enabled BOOLEAN DEFAULT 0,
//                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//                 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//             )
//         `);

//         // Games table
//         db.exec(`
//             CREATE TABLE IF NOT EXISTS games (
//                 id INTEGER PRIMARY KEY AUTOINCREMENT,
//                 player1_id INTEGER,
//                 player2_id INTEGER,
//                 winner_id INTEGER,
//                 score1 INTEGER DEFAULT 0,
//                 score2 INTEGER DEFAULT 0,
//                 status TEXT DEFAULT 'pending',
//                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//                 FOREIGN KEY (player1_id) REFERENCES users(id),
//                 FOREIGN KEY (player2_id) REFERENCES users(id),
//                 FOREIGN KEY (winner_id) REFERENCES users(id)
//             )
//         `);

//         // Tournaments table
//         db.exec(`
//             CREATE TABLE IF NOT EXISTS tournaments (
//                 id INTEGER PRIMARY KEY AUTOINCREMENT,
//                 name TEXT NOT NULL,
//                 status TEXT DEFAULT 'pending',
//                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//             )
//         `);

//         // Tournament matches table
//         db.exec(`
//             CREATE TABLE IF NOT EXISTS tournament_matches (
//                 id INTEGER PRIMARY KEY AUTOINCREMENT,
//                 tournament_id INTEGER,
//                 game_id INTEGER,
//                 round INTEGER,
//                 match_number INTEGER,
//                 FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
//                 FOREIGN KEY (game_id) REFERENCES games(id)
//             )
//         `);

//         console.log('Database tables initialized successfully');
//     } catch (error) {
//         console.error('Failed to initialize database tables:', error);
//         process.exit(1);
//     }
// }

// // Initialize the database
// initializeDatabase();

// // Export the database instance
// module.exports = db; 