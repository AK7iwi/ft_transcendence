const db = require('./connection');

class DbModel {
    static async createTable() {
        const stmt = db.prepare(`
            CREATE TABLE IF NOT EXISTS user_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                username TEXT NOT NULL,
                password TEXT NOT NULL,
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

    static async createUser(userId, username, hashedPassword) {
        const stmt = db.prepare(`
            INSERT INTO user_profiles (user_id, username, password) 
            VALUES (?, ?, ?)`);
        return stmt.run(userId, username, hashedPassword);
    }
}

module.exports = DbModel; 