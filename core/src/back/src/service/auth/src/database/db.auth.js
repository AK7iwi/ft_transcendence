const db = require('./connection');

class DbAuth {
    static async createTable() {
        const stmt = db.prepare(`
            CREATE TABLE IF NOT EXISTS user_profiles (
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

    //Create user
    static async createUser(username, password) {
        const stmt = db.prepare(`
            INSERT INTO user_profiles (username, password)
            VALUES (?, ?)
        `);
        return stmt.run(username, password);
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

    static async getTwoFactorEnabled(userId) {
        const stmt = db.prepare(`
            SELECT two_factor_enabled
            FROM user_profiles
            WHERE id = ?
        `);
        const result = stmt.get(userId);
        return result ? result.two_factor_enabled : false;
    }
    
    static async getTwoFactorSecret(userId) {
        const stmt = db.prepare(`
            SELECT two_factor_secret
            FROM user_profiles
            WHERE id = ?
        `);
        const result = stmt.get(userId);
        return result ? result.two_factor_secret : null;
    }

    //INTERNAL ROUTES
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


    static async getUserByUsername(username) {
        const stmt = db.prepare(`
            SELECT id, username, password, two_factor_enabled
            FROM user_profiles
            WHERE username = ?
        `);
        return stmt.get(username);
    }
    
}

module.exports = DbAuth;