const DbModel = require('../database/db.model');

class InternalService {
    static async updateUsername(currentUsername, newUsername) {
        try {
            await DbModel.updateUsername(currentUsername, newUsername);
        } catch (error) {
            throw new Error(`Failed to update username: ${error.message}`);
        }
    }

    static async updatePassword(username, hashedPassword) {
        try {
            await DbModel.updatePassword(username, hashedPassword);
        } catch (error) {
            throw new Error(`Failed to update password: ${error.message}`);
        }
    }
}

module.exports = InternalService;