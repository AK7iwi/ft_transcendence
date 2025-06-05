const db = require('../connection');

class DbUpdate {
    static async createUser(userId, username, hashedPassword) {
        const stmt = db.prepare(`
            INSERT INTO user_profiles (user_id, username, password) 
            VALUES (?, ?, ?)`);
        return stmt.run(userId, username, hashedPassword);
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

module.exports = DbUpdate;