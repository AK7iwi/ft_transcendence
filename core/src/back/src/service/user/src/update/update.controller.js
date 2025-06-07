const UpdateService = require('./update.service');

class UpdateController {
    async updateUsername(request, reply) {
        try {
          const { newUsername } = request.body;
            const currentUsername = request.user.username;

            await UpdateService.updateUsername(currentUsername, newUsername, request.server.serviceClient);
            
            return reply.code(200).send({
              success: true,
              message: 'User updated successfully',
              data: {
                username: newUsername
              }
            });
          } catch (error) {
            request.log.error('[UPDATE ERROR]', error);
            return reply.code(400).send({
              success: false,
              message: error.message
            });
          }
    }

    async updatePassword(request, reply) {
        try {
            const username = request.user.username;
            const { newPassword } = request.body;
            await UpdateService.updatePassword(username, newPassword, request.server.serviceClient);
            
            return reply.code(200).send({
              success: true,
              message: 'Password updated successfully',
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

module.exports = new UpdateController();