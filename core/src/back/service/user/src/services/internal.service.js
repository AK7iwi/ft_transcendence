const DbModel = require('../database/db.model');

class InternalService {
    static async createUser(userId, username) {
        try {
            await DbModel.createUser(userId, username);
        } catch (error) {
            throw new Error(`Failed to create user: ${error.message}`);
        }
    }
}

module.exports = InternalService;