const DbUser = require('../database/db.user');

class InternalService {
    static async createUser(userId, username, hashedPassword) {
        try {
            await DbUser.createUser(userId, username, hashedPassword);
        } catch (error) {
            throw error;
        }
    }

    static async update2FASecret(userId, secret) {
        try {
            await DbUser.update2FASecret(userId, secret);
        } catch (error) {
            throw error;
        }
    }

    static async enable2FA(userId) {
        try {
            await DbUser.enable2FA(userId);
        } catch (error) {
            throw error;
        }
    }

    static async disable2FA(userId) {
        try {
            await DbUser.disable2FA(userId);   
        } catch (error) {
            throw error;
        }
    }
}

module.exports = InternalService;