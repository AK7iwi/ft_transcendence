const DbAuth = require('../database/db.auth');

class InternalService {
    static async updateUsername(currentUsername, newUsername) {
        try {
            await DbAuth.updateUsername(currentUsername, newUsername);
        } catch (error) {
            throw new Error(`Failed to update username: ${error.message}`);
        }
    }

    static async updatePassword(username, hashedPassword) {
        try {
            await DbAuth.updatePassword(username, hashedPassword);
        } catch (error) {
            throw new Error(`Failed to update password: ${error.message}`);
        }
    }
}

module.exports = InternalService;