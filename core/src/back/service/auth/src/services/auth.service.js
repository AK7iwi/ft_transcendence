const PasswordService = require('../../security/password/password.service');
const DbModel = require('../database/db.model');
const axios = require('axios');

class AuthService {
    static async registerUser(username, password, axiosInstance) {
        try {
            const hashedPassword = await PasswordService.hashPassword(password);
            const result = await DbModel.insertUser(username, hashedPassword);
            
            await axiosInstance.post(`${process.env.USER_SERVICE_URL}/user/internal/user`, {
                userId: result.lastInsertRowid,
                username: username
            });

            return result.lastInsertRowid;
        } catch (error) {
            if (error.code === 'SQLITE_CONSTRAINT') {
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
            const user = await DbModel.findUserByUsername(username);
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
