const DbUpdate = require('../database/db_models/db.update');

class InternalService {
    static async createUser(userId, username, hashedPassword) {
        try {
            await DbUpdate.createUser(userId, username, hashedPassword);
        } catch (error) {
            throw new Error(`Failed to create user: ${error.message}`);
        }
    }

    static async updateUsername(currentUsername, newUsername) {
        try {
            await DbUpdate.updateUsername(currentUsername, newUsername);
        } catch (error) {
            throw new Error(`Failed to update username: ${error.message}`);
        }
    }

    static async updatePassword(username, hashedPassword) {
        try {
            await DbUpdate.updatePassword(username, hashedPassword);
        } catch (error) {
            throw new Error(`Failed to update password: ${error.message}`);
        }
    }

    static async update2FASecret(userId, secret) {
        try {
            await DbUpdate.update2FASecret(userId, secret);
        } catch (error) {
            throw new Error(`Failed to create user: ${error.message}`);
        }
    }

    static async enable2FA(userId) {
        try {
            await DbUpdate.enable2FA(userId);
        } catch (error) {
            throw new Error(`Failed to enable 2FA: ${error.message}`);
        }
    }

    static async disable2FA(userId) {
        try {
            await DbUpdate.disable2FA(userId);   
        } catch (error) {
            throw new Error(`Failed to disable 2FA: ${error.message}`);
        }
    }
}

module.exports = InternalService;