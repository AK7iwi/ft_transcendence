const db = require('./connection');

class UserModel {
    static async createTable() {
        const stmt = db.prepare(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                avatar TEXT,
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
}

module.exports = UserModel; 