const db = require('../connection');

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
}

module.exports = DbAuth;