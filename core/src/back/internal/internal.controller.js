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

    async updateUsername(request, reply) {
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

    async updatePassword(request, reply) {
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

    async update2FASecret(request, reply) {
        try {
            const { userId, secret } = request.body;
            await InternalService.update2FASecret(userId, secret);
            
            return reply.code(200).send({
                success: true,
                message: '2FA secret stored successfully'
            });
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

            return reply.code(200).send({
                success: true,
                message: '2FA enabled successfully'
            });
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

            return reply.code(200).send({
                success: true,
                message: '2FA disabled successfully'
            });
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