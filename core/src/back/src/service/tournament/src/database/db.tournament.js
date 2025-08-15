const db = require('./connection');

class DbTournament {
    static async createTable() {
        // Create users table
        const usersStmt = db.prepare(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                user_id INTEGER NOT NULL,
                username TEXT NOT NULL UNIQUE,
                avatar TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        usersStmt.run();

        // Create game_results table
        const gameResultsStmt = db.prepare(`
            CREATE TABLE IF NOT EXISTS game_results (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                winner_id  INTEGER,
                loser_id   INTEGER,
                played_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (loser_id)  REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        gameResultsStmt.run();

        const matchStmt = db.prepare(`
            CREATE TABLE IF NOT EXISTS match_history (
                match_id        INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id         INTEGER NOT NULL,
                opponent        TEXT NOT NULL,
                result          TEXT CHECK(result IN ('win', 'loss')) NOT NULL,
                score_user      INTEGER NOT NULL,
                score_opponent  INTEGER NOT NULL,
                played_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
            )
        `);
        matchStmt.run();
        
    }

    static async createGameResult(winnerId, loserId) {
        const stmt = db.prepare(`
            INSERT INTO game_results (winner_id, loser_id)
            VALUES (?, ?)
        `);
        return stmt.run(winnerId, loserId);
    }
    
    static async createMatchHistory(userId, opponent, result, scoreUser, scoreOpponent, playedAt) {
        const stmt = db.prepare(`
            INSERT INTO match_history (user_id, opponent, result, score_user, score_opponent, played_at)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(userId, opponent, result, scoreUser, scoreOpponent, playedAt);
    }

    static async getUserByUsername(username) {
        const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
        return stmt.get(username);
    }

    static async getUserById(userId) {
        const stmt = db.prepare('SELECT * FROM users WHERE user_id = ?');
        return stmt.get(userId);
    }

    // Internal routes
    static async createUser(userId, username) {
        const stmt = db.prepare(`
            INSERT INTO users (user_id, username) 
            VALUES (?, ?)
        `);
        return stmt.run(userId, username);
    }

    static async updateUsername(currentUsername, newUsername) {
        const stmt = db.prepare(`
            UPDATE users 
            SET username = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE username = ?
        `);
        return stmt.run(newUsername, currentUsername);
    }

    static async updateAvatar(userId, avatarPath) {
        const stmt = db.prepare(`
            UPDATE users 
            SET avatar = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
        `);
        return stmt.run(avatarPath, userId);
    }
}

module.exports = DbTournament;