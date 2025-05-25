const db = require('../database/db.index');
const DbService = require('../database/db.service');

class AuthService {
    // Register new user with hashed password
    static async registerUser(username, password) {
        try {
            const hashedPassword = await DbService.hashPassword(password);
            
            // Use parameterized queries to prevent SQL injection
            const stmt = db.prepare(`
                INSERT INTO users (username, password)
                VALUES (?, ?)
            `);
            
            const result = stmt.run(username, hashedPassword);
            return result.lastInsertRowid;
        } catch (error) {
            if (error.code === 'SQLITE_CONSTRAINT' 
                || error.message.includes('UNIQUE constraint failed: users.username')
            ) {
                throw new Error('Username already exists');
            }
            throw error;
        }
    }

    static async loginUser(username, password) {
        try {
            const stmt = db.prepare(`
                SELECT id, username, password
                FROM users
                WHERE username = ?
            `);

            const user = stmt.get(username);
            if (!user) {
                throw new Error('User not found');
            }

            const isValid = await DbService.verifyPassword(password, user.password);
            if (!isValid) {
                throw new Error('Invalid password');
            }

            return {
                id: user.id,
                username: user.username,
                twoFactorEnabled: user.two_factor_enabled
            };
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }
}

module.exports = AuthService;