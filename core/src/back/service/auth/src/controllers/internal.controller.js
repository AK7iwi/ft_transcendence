const InternalService = require('../services/internal.service');

class InternalController {
    static async updateUsername(request, reply) {
        try {
            const { currentUsername, newUsername } = request.body;
            await InternalService.updateUsername(currentUsername, newUsername);
            
            return reply.code(200).send({
                success: true,
                message: 'Username updated in auth service'
            });
        } catch (error) {
            request.log.error({
                err: error,
                currentUsername,
                newUsername
            }, 'Failed to update username in auth service');
            return reply.code(400).send({
                success: false,
                message: error.message
            });
        }
    }

    static async updatePassword(request, reply) {
        try {
            const { username, hashedPassword } = request.body;
            await InternalService.updatePassword(username, hashedPassword);
            return reply.code(200).send({
                success: true,
                message: 'Password updated in auth service'
            });
        } catch (error) {
            request.log.error({
                err: error,
                username
            }, 'Failed to update password in auth service');
            return reply.code(400).send({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new InternalController();    