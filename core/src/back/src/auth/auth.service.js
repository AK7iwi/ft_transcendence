const bcrypt = require('bcrypt');
const db = require('../database/db.index');
const { generateToken } = require('../security/jwt');

class AuthService {
    // Validation constants
    static USERNAME_MIN_LENGTH = 3;
    static USERNAME_MAX_LENGTH = 20;
    static PASSWORD_MIN_LENGTH = 8;
    static USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;
    static PASSWORD_PATTERN = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

    // Input validation
    static validateUserInput(username, password) {
        const errors = [];
        
        // Username validation
        if (!username || username.length < this.USERNAME_MIN_LENGTH || username.length > this.USERNAME_MAX_LENGTH) {
            errors.push(`Username must be between ${this.USERNAME_MIN_LENGTH} and ${this.USERNAME_MAX_LENGTH} characters`);
        }
        if (!this.USERNAME_PATTERN.test(username)) {
            errors.push('Username can only contain letters, numbers, and underscores');
        }

        // Password validation
        if (!password || password.length < this.PASSWORD_MIN_LENGTH) {
            errors.push(`Password must be at least ${this.PASSWORD_MIN_LENGTH} characters long`);
        }
        if (!this.PASSWORD_PATTERN.test(password)) {
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
                VALUES (?, ?)
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

            // Generate JWT using the imported function
            const token = generateToken({
                id: user.id,
                username: user.username
            });

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