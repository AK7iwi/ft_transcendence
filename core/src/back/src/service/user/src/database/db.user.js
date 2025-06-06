const db = require('./connection');

class DbUser {
    static async createTable() {
        const stmt = db.prepare(`
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
        stmt.run();
    }

    static async getUser(userId) {
        const stmt = db.prepare('SELECT id, user_id, username, avatar, two_factor_enabled, wins, losses FROM user_profiles WHERE user_id = ?');
        return stmt.get(userId);
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
            WHERE id = ?
        `);
        return stmt.run(secret, userId);
    }

    static async enable2FA(userId) {
        const stmt = db.prepare(`
            UPDATE user_profiles 
            SET two_factor_enabled = 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);
        return stmt.run(userId);
    }

    static async disable2FA(userId) {
        const stmt = db.prepare(`
            UPDATE user_profiles 
            SET two_factor_enabled = 0,
                two_factor_secret = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);
        return stmt.run(userId);
    }
}

module.exports = DbUser; 