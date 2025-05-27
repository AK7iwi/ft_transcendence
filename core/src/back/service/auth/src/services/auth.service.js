const PasswordService = require('../../security/password/password.service');
const UserModel = require('../database/user.model');

class AuthService {
    static async registerUser(username, password) {
        try {
            const hashedPassword = await PasswordService.hashPassword(password);
            const result = await UserModel.insertUser(username, hashedPassword);
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
            const user = await UserModel.findUserByUsername(username);
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
            console.error('Login error:', error);
            throw error;
        }
    }
}

module.exports = AuthService;
