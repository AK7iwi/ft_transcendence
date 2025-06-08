const InternalService = require('./internal.service');

class InternalController {
    async createUser(request, reply) {
        try {
            const { userId, username } = request.body;
            await InternalService.createUser(userId, username);
            
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
                message: 'Username updated in auth service'
            });
        } catch (error) {
            request.log.error('[UPDATE USERNAME ERROR]', error);
            return reply.code(400).send({
                success: false,
                message: error.message
            });
        }
    }
    
}

module.exports = new InternalController();