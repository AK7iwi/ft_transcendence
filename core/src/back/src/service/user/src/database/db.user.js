const db = require('./connection');

class DbUser {
    static async createTable() {
        //Create user_profiles table
        const userStmt = db.prepare(`
            CREATE TABLE IF NOT EXISTS user_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                username TEXT NOT NULL,
                password TEXT NOT NULL,
                avatar TEXT,
                two_factor_secret TEXT,
                two_factor_enabled BOOLEAN DEFAULT 0,
                wins INTEGER DEFAULT 0,
                losses INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        userStmt.run();

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

    static async updateUsername(currentUsername, newUsername) {
        const stmt = db.prepare(`
            UPDATE user_profiles 
            SET username = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE username = ?
        `);
        return stmt.run(newUsername, currentUsername);
    }

    static async updatePassword(username, hashedPassword) {
        const stmt = db.prepare(`
            UPDATE user_profiles 
            SET password = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE username = ?
        `);
        return stmt.run(hashedPassword, username);
    }
    
    static async getUser(userId) {
        const stmt = db.prepare('SELECT id, user_id, username, avatar, two_factor_enabled, wins, losses FROM user_profiles WHERE user_id = ?');
        return stmt.get(userId);
    }
    
    static async getMatchHistory(userId) {
        const stmt = db.prepare(`
            SELECT
                match_id,
                user_id,
                opponent,
                result,
                score_user,
                score_opponent,
                played_at
            FROM match_history
            WHERE user_id = ?
            ORDER BY played_at DESC
        `);
        return stmt.all(userId);
    }
    
    static async getUserStats(userId) {
        const stmt = db.prepare(`
            SELECT wins, losses
            FROM user_profiles
            WHERE user_id = ?
        `);
        return stmt.get(userId);
    }

    static async updateAvatar(userId, avatarPath) {
        const stmt = db.prepare(`
            UPDATE user_profiles
            SET avatar = ?, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
        `);
        return stmt.run(avatarPath, userId);
    }

    //INTERNAL ROUTES
    
    static async createUser(userId, username, hashedPassword) {
        const stmt = db.prepare(`
            INSERT INTO user_profiles (user_id, username, password) 
            VALUES (?, ?, ?)`);
        return stmt.run(userId, username, hashedPassword);
    }

    static async update2FASecret(userId, secret) {
        const stmt = db.prepare(`
            UPDATE user_profiles 
            SET two_factor_secret = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
        `);
        return stmt.run(secret, userId);
    }

    static async enable2FA(userId) {
        const stmt = db.prepare(`
            UPDATE user_profiles 
            SET two_factor_enabled = 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
        `);
        return stmt.run(userId);
    }

    static async disable2FA(userId) {
        const stmt = db.prepare(`
            UPDATE user_profiles 
            SET two_factor_enabled = 0,
                two_factor_secret = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
        `);
        return stmt.run(userId);
    }

    // Add match history entry
    static async createMatchHistory(userId, opponent, result, scoreUser, scoreOpponent, playedAt) {
        const stmt = db.prepare(`
            INSERT INTO match_history (user_id, opponent, result, score_user, score_opponent, played_at)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(userId, opponent, result, scoreUser, scoreOpponent, playedAt);
    }

    // Update user statistics
    static async updateUserStats(userId, result) {
        if (result === 'win') {
            const stmt = db.prepare(`
                UPDATE user_profiles 
                SET wins = wins + 1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
            `);
            return stmt.run(userId);
        } else if (result === 'loss') {
            const stmt = db.prepare(`
                UPDATE user_profiles 
                SET losses = losses + 1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
            `);
            return stmt.run(userId);
        }
    }

    //static async 
}

module.exports = DbUser; 