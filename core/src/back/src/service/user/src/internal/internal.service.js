const DbUser = require('../database/db.user');

class InternalService {
    static async createUser(userId, username, hashedPassword) {
        try {
            await DbUser.createUser(userId, username, hashedPassword);
        } catch (error) {
            throw new Error(`Failed to create user: ${error.message}`);
        }
    }

    static async update2FASecret(userId, secret) {
        try {
            await DbUser.update2FASecret(userId, secret);
        } catch (error) {
            throw new Error(`Failed to create user: ${error.message}`);
        }
    }

    static async enable2FA(userId) {
        try {
            await DbUser.enable2FA(userId);
        } catch (error) {
            throw new Error(`Failed to enable 2FA: ${error.message}`);
        }
    }

    static async disable2FA(userId) {
        try {
            await DbUser.disable2FA(userId);   
        } catch (error) {
            throw new Error(`Failed to disable 2FA: ${error.message}`);
        }
    }
}

module.exports = InternalService;