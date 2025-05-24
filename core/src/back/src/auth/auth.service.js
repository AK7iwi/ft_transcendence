const bcrypt = require('bcrypt');
const db = require('../database/db.index');
const jwt = require('jsonwebtoken');

class AuthService {

    // Input validation
    static validateUserInput(username, password) {
        const errors = [];
        
        // Username validation
        if (!username || username.length < 3 || username.length > 20) {
            errors.push('Username must be between 3 and 20 characters');
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            errors.push('Username can only contain letters, numbers, and underscores');
        }

        // Password validation
        if (!password || password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
            errors.push('Password must contain at least one uppercase letter, one lowercase letter, and one number');
        }

        return errors;
    }

    // Hash password with bcrypt
    static async hashPassword(password) {
        const saltRounds = 10;
        return await bcrypt.hash(password, saltRounds);
    }

    // Verify password against hash
    static async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    // Register new user with hashed password
    static async registerUser(username, password) {
        try {
            // Validate input
            const errors = this.validateUserInput(username, password);
            if (errors.length > 0) {
                throw new Error(errors.join(', '));
            }

            const hashedPassword = await this.hashPassword(password);
            
            // Use parameterized queries to prevent SQL injection
            const stmt = db.prepare(`
                INSERT INTO users (username, password)
                VALUES (?, ?, ?)
            `);
            
            const result = stmt.run(username, hashedPassword);
            return result.lastInsertRowid;
        } catch (error) {
            if (error.code === 'SQLITE_CONSTRAINT') {
                throw new Error('Username already exists');
            }
            throw error;
        }
    }

    static async loginUser(username, password) {
        try {
            if (!username || !password) {
                throw new Error('Username and password are required');
            }

            const stmt = db.prepare(`
                SELECT id, username, password
                FROM users
                WHERE username = ?
            `);

            const user = stmt.get(username);

            if (!user) {
                throw new Error('User not found');
            }

            const isValid = await this.verifyPassword(password, user.password);

            if (!isValid) {
                throw new Error('Invalid password');
            }

            // Generate JWT
            const token = jwt.sign(
                { id: user.id, username: user.username },
                process.env.JWT_SECRET || 'your-secret',
                { expiresIn: '1h' }
            );

            // Return profile + token
            return {
                id: user.id,
                username: user.username,
                token
            };
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }
}

module.exports = AuthService;