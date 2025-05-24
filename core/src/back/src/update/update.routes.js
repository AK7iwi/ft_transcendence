const UpdateService = require('./update.service');
const updateSchema = require('./update.schema');
const Security = require('../security/middleware/sanityze');
const JWT = require('../security/middleware/jwt');


async function updateRoutes(fastify, options) {
  
  fastify.put('/update', {
    schema: updateSchema.update,
    preHandler: [Security.securityMiddleware, JWT.authenticate],
    handler: async (request, reply) => {
      try {
        const { username, newUsername } = request.body;
        const updatedUser = await UpdateService.updateUser(username, newUsername);
        
        return reply.code(200).send({
          success: true,
          message: 'User updated successfully',
          data: {
            user: updatedUser
          }
        });
      } catch (error) {
        fastify.log.error('[UPDATE ERROR]', error);
        return reply.code(400).send({
          success: false,
          message: error.message
        });
      }
    }
  });

  fastify.put('/password', {
    schema: updateSchema.updatePassword,
    preHandler: [Security.securityMiddleware, JWT.authenticate],
    handler: async (request, reply) => {
      try {
        const { username, newPassword } = request.body;
        const updatedUser = await UpdateService.updatePassword(username, newPassword);
        
        return reply.code(200).send({
          success: true,
          message: 'Password updated successfully',
          data: {
            id: updatedUser.id,
            username: updatedUser.username
          }
        });
      } catch (error) {
        fastify.log.error('[UPDATE PASSWORD ERROR]', error);
        return reply.code(400).send({
          success: false,
          message: error.message
        });
      }
    }
  });
}

module.exports = updateRoutes;