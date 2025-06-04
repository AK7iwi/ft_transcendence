const UpdateService = require('./update.service');

class UpdateController {
    async updateUsername(request, reply) {
        try {
            const { currentUsername, newUsername } = request.body;
            const updatedUser = await UpdateService.updateUsername(currentUsername, newUsername, request.server.serviceClient);
            
            return reply.code(200).send({
              success: true,
              message: 'User updated successfully',
              data: {
                username: updatedUser.username
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
            const { username, newPassword } = request.body;
            const updatedUser = await UpdateService.updatePassword(username, newPassword, request.server.serviceClient);
            
            return reply.code(200).send({
              success: true,
              message: 'Password updated successfully',
              data: {
                username: updatedUser.username
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