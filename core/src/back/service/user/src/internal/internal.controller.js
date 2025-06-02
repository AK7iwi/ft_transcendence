const InternalService = require('./internal.service');

class InternalController {
    async createUser(request, reply) {
        try {
            const { userId, username, hashedPassword } = request.body;
            await InternalService.createUser(userId, username, hashedPassword);

            return reply.code(200).send({
                success: true,
                message: 'User created successfully'
            });
        } catch (error) {
            request.log.error('[CREATE USER ERROR]', error);
            return reply.code(400).send({
                success: false,
                message: error.message
            });
        }
    }

    async secret2FA(request, reply) {
        try {
            const { userId, secret } = request.body;
            await InternalService.secret2FA(userId, secret);
        } catch (error) {
            request.log.error('[SECRET 2FA ERROR]', error);
            return reply.code(400).send({
                success: false,
                message: error.message
            });
        }
    }   

    async enable2FA(request, reply) {
        try {
            const { userId } = request.body;
            await InternalService.enable2FA(userId);
        } catch (error) {
            request.log.error('[ENABLE 2FA ERROR]', error);
            return reply.code(400).send({
                success: false,
                message: error.message
            });
        }
    }

    async disable2FA(request, reply) {
        try {
            const { userId } = request.body;
            await InternalService.disable2FA(userId);
        } catch (error) {
            request.log.error('[DISABLE 2FA ERROR]', error);
            return reply.code(400).send({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new InternalController();