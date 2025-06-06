const PasswordService = require('../../security/password/password.service');
const DbAuth = require('../database/db.auth');

class AuthService {
    static async registerUser(username, password, serviceClient) {
        try {
            const hashedPassword = await PasswordService.hashPassword(password);
            const result = await DbAuth.createUser(username, hashedPassword);
            
            await serviceClient.post(`${process.env.USER_SERVICE_URL}/user/internal/createUser`, {
                userId: result.lastInsertRowid,
                username: username,
                hashedPassword: hashedPassword
            });
            
            return {
                username: username
            };
        } catch (error) {
            if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                throw new Error('Username already exists');
            }
            
            if (error.code === 'SQLITE_ERROR') {
                throw new Error('Database error occurred');
            }
            
            throw new Error('Registration failed');
        }
    }

    static async loginUser(username, password) {
        try {
            const user = await DbAuth.getUserByUsername(username);
            if (!user) {
                throw new Error('User not found');
            }

            const isValid = await PasswordService.verifyPassword(password, user.password);
            if (!isValid) {
                throw new Error('Invalid password');
            }

            return {
                id: user.id,
                username: user.username,
                twoFactorEnabled: user.two_factor_enabled
            };
        } catch (error) {
            if (error.message === 'User not found' || error.message === 'Invalid password') {
                throw error;
            }
            throw new Error('Login failed');
        }
    }
}

module.exports = AuthService;
