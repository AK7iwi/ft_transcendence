const DbModel = require('../database/db.model');

class InternalService {
    static async updateUsername(currentUsername, newUsername) {
        await DbModel.updateUsername(currentUsername, newUsername);
    }

    static async updatePassword(username, hashedPassword) {
        await DbModel.updatePassword(username, hashedPassword);
    }
}

module.exports = InternalService;