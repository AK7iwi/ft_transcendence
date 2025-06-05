const db = require('../connection');

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
}
module.exports = DbUser; 