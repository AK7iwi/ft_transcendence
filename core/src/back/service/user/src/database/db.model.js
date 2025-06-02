const db = require('./connection');

class DbModel {
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
    


    
    // DB UPDATE 
    static async createUser(userId, username, hashedPassword) {
        const stmt = db.prepare(`
            INSERT INTO user_profiles (user_id, username, password) 
            VALUES (?, ?, ?)`);
        return stmt.run(userId, username, hashedPassword);
    }

    static async secret2FA(userId, secret) {
        const stmt = db.prepare(`
            UPDATE user_profiles 
            SET two_factor_secret = ?
            WHERE user_id = ?
        `);
        return stmt.run(secret, userId);
    }

    static async enable2FA(userId) {
        const stmt = db.prepare(`
            UPDATE user_profiles 
            SET two_factor_enabled = 1
        `);
        return stmt.run(userId);
    }

    static async disable2FA(userId) {
        const stmt = db.prepare(`
            UPDATE user_profiles 
            SET two_factor_enabled = 0,
                two_factor_secret = NULL
        `);
        return stmt.run(userId);
    }   
}
module.exports = DbModel; 