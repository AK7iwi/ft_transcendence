const UpdateService = require('../services/update.service');

class UpdateController {
    static async updateUsername(request, reply) {
        try {
            const { currentUsername, newUsername } = request.body;
            const updatedUser = await UpdateService.updateUsername(currentUsername, newUsername);
            
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

    static async updatePassword(request, reply) {
        try {
            const { username, newPassword } = request.body;
            const updatedUser = await UpdateService.updatePassword(username, newPassword);
            
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