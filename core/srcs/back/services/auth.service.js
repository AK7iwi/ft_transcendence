const bcrypt = require('bcrypt');
const db = require('../db');

class AuthService {
    // Input validation
    static validateUserInput(username, email, password) {
        const errors = [];
        
        // Username validation
        if (!username || username.length < 3 || username.length > 20) {
            errors.push('Username must be between 3 and 20 characters');
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            errors.push('Username can only contain letters, numbers, and underscores');
        }

        // Email validation
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push('Invalid email format');
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
    static async registerUser(username, email, password) {
        try {
            // Validate input
            const errors = this.validateUserInput(username, email, password);
            if (errors.length > 0) {
                throw new Error(errors.join(', '));
            }

            const hashedPassword = await this.hashPassword(password);
            
            // Use parameterized queries to prevent SQL injection
            const stmt = db.prepare(`
                INSERT INTO users (username, email, password_hash)
                VALUES (?, ?, ?)
            `);
            
            const result = stmt.run(username, email, hashedPassword);
            return result.lastInsertRowid;
        } catch (error) {
            if (error.code === 'SQLITE_CONSTRAINT') {
                throw new Error('Username or email already exists');
            }
            throw error;
        }
    }

    // Login user with password verification
    static async loginUser(username, password) {
        try {
            // Validate input
            if (!username || !password) {
                throw new Error('Username and password are required');
            }

            // Use parameterized queries to prevent SQL injection
            const stmt = db.prepare(`
                SELECT id, username, password_hash
                FROM users
                WHERE username = ?
            `);
            
            const user = stmt.get(username);
            
            if (!user) {
                throw new Error('User not found');
            }

            const isValid = await this.verifyPassword(password, user.password_hash);
            
            if (!isValid) {
                throw new Error('Invalid password');
            }

            return {
                id: user.id,
                username: user.username
            };
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }
}

module.exports = AuthService;