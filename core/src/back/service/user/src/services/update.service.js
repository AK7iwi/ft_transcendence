const PasswordService = require('../../security/password/password.service');
const DbModel = require('../database/db.model');

class UpdateService {
    static async updateUsername(currentUsername, newUsername) {
        try {
            const result = await DbModel.updateUsername(currentUsername, newUsername);
            if (!result.changes) {
                throw new Error('User not found or username unchanged');
            }

            // Notify auth service to update username
            await app.axios.put(`${process.env.AUTH_SERVICE_URL}/auth/internal/username`, {
                currentUsername,
                newUsername
            });

            return {
                username: newUsername
            };
        } catch (error) {
            throw new Error(`Failed to update username: ${error.message}`);
        }
    }

    static async updatePassword(username, newPassword) {
        try {
            const hashedPassword = await PasswordService.hashPassword(newPassword);
            const result = await DbModel.updatePassword(username, hashedPassword);

            if (!result.changes) {
                throw new Error('User not found');
            }

            // Notify auth service to update password
            await app.axios.put(`${process.env.AUTH_SERVICE_URL}/auth/internal/password`, {
                username,
                hashedPassword
            });

            return {
                username: username
            };
        } catch (error) {
            throw new Error(`Failed to update password: ${error.message}`);
        }
    }
}

module.exports = UpdateService;