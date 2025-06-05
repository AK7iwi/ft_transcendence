const PasswordService = require('../../security/password/password.service');
const DbUpdate = require('../database/db_models/db.update');

class UpdateService {
    static async updateUsername(currentUsername, newUsername, serviceClient) {
        try {
            const result = await DbUpdate.updateUsername(currentUsername, newUsername);
            if (!result.changes) {
                throw new Error('User not found or username unchanged');
            }

            // Notify auth service to update username
            await serviceClient.put(`${process.env.AUTH_SERVICE_URL}/auth/internal/updateUsername`, {
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

    static async updatePassword(username, newPassword, serviceClient) {
        try {
            const hashedPassword = await PasswordService.hashPassword(newPassword);
            const result = await DbUpdate.updatePassword(username, hashedPassword);

            if (!result.changes) {
                throw new Error('User not found');
            }

            // Notify auth service to update password
            await serviceClient.put(`${process.env.AUTH_SERVICE_URL}/auth/internal/updatePassword`, {
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