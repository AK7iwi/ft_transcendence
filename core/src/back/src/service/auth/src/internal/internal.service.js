const DbAuth = require('../database/db.auth');

class InternalService {
    static async updateUsername(currentUsername, newUsername) {
        try {
            await DbAuth.updateUsername(currentUsername, newUsername);
        } catch (error) {
            throw error;
        }
    }

    static async updatePassword(username, hashedPassword) {
        try {
            await DbAuth.updatePassword(username, hashedPassword);
        } catch (error) {
            throw error;
        }
    }
}

module.exports = InternalService;