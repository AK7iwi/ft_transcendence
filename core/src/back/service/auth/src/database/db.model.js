const db = require('./connection');

class DbModel {
    static async createTable() {
        const stmt = db.prepare(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                two_factor_secret TEXT,
                two_factor_enabled BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        stmt.run();
    }

    static async insertUser(username, password) {
        const stmt = db.prepare(`
            INSERT INTO users (username, password)
            VALUES (?, ?)
        `);
        return stmt.run(username, password);
    }

    static async findUserByUsername(username) {
        const stmt = db.prepare(`
            SELECT id, username, password, two_factor_enabled
            FROM users
            WHERE username = ?
        `);
        return stmt.get(username);
    }

    static async update2FASecret(userId, secret) {
        const stmt = db.prepare(`
            UPDATE users 
            SET two_factor_secret = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);
        return stmt.run(secret, userId);
    }

    static async enable2FA(userId) {
        const stmt = db.prepare(`
            UPDATE users 
            SET two_factor_enabled = 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);
        return stmt.run(userId);
    }

    static async disable2FA(userId) {
        const stmt = db.prepare(`
            UPDATE users 
            SET two_factor_enabled = 0,
                two_factor_secret = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);
        return stmt.run(userId);
    }

    static async getTwoFactorEnabled(userId) {
        const stmt = db.prepare(`
            SELECT two_factor_enabled
            FROM users
            WHERE id = ?
        `);
        const result = stmt.get(userId);
        return result ? result.two_factor_enabled : false;
    }
    
    static async getTwoFactorSecret(userId) {
        const stmt = db.prepare(`
            SELECT two_factor_secret
            FROM users
            WHERE id = ?
        `);
        const result = stmt.get(userId);
        return result ? result.two_factor_secret : null;
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

    static async updatePassword(username, hashedPassword) {
        const stmt = db.prepare(`
            UPDATE users 
            SET password = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE username = ?
        `);
        return stmt.run(hashedPassword, username);
    }
}

module.exports = DbModel;