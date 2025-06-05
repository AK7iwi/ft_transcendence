const db = require('../connection');

class DbGetter {
    static async getUserByUsername(username) {
        const stmt = db.prepare(`
            SELECT id, username, password, two_factor_enabled
            FROM user_profiles
            WHERE username = ?
        `);
        return stmt.get(username);
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

    static async getUser(userId) {
        const stmt = db.prepare('SELECT id, user_id, username, avatar, two_factor_enabled, wins, losses FROM user_profiles WHERE user_id = ?');
        return stmt.get(userId);
    }
}

module.exports = DbGetter;