const DbChat = require('../database/db.chat');

class InternalService {
    static async createUser(userId, username) {
        try {
            await DbChat.createUser(userId, username);
        } catch (error) {
            throw error;
        }
    }

    static async updateUsername(currentUsername, newUsername) {
        try {
            await DbChat.updateUsername(currentUsername, newUsername);
        } catch (error) {
            throw error;
        }
    }
}

module.exports = InternalService;