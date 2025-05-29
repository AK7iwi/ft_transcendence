const InternalService = require('../services/internal.service');

class InternalController {
    static async updateUsername(request, reply) {
        try {
            const { currentUsername, newUsername } = request.body;
            await InternalService.updateUsername(currentUsername, newUsername);
            
            return reply.code(200).send({
                success: true,
                message: 'Username updated in auth service',
                data: {
                    username: newUsername
                }
            });
        } catch (error) {
            request.log.error('[UPDATE USERNAME ERROR]', error);
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
                message: 'Password updated in auth service',
                data: {
                    username: username
                }
            });
        } catch (error) {
            request.log.error('[UPDATE PASSWORD ERROR]', error);
            return reply.code(400).send({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new InternalController();    