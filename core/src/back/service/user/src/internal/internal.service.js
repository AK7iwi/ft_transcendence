const DbModel = require('../database/db.model');

class InternalService {
    static async createUser(userId, username, hashedPassword) {
        try {
            await DbModel.createUser(userId, username, hashedPassword);
        } catch (error) {
            throw new Error(`Failed to create user: ${error.message}`);
        }
    }

    static async secret2FA(userId, secret) {
        try {
            await DbModel.secret2FA(userId, secret);
        } catch (error) {
            throw new Error(`Failed to create user: ${error.message}`);
        }
    }

    static async enable2FA(userId) {
        try {
            await DbModel.enable2FA(userId);
        } catch (error) {
            throw new Error(`Failed to enable 2FA: ${error.message}`);
        }
    }

    static async disable2FA(userId) {
        try {
            await DbModel.disable2FA(userId);   
        } catch (error) {
            throw new Error(`Failed to disable 2FA: ${error.message}`);
        }
    }
}

module.exports = InternalService;