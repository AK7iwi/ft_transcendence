const userSchema = require('../schema/user.schema');
const DbModel = require('../database/db.model');

module.exports = async function (fastify, opts) {
    // Route for auth service to create user profile
    fastify.post('/internal/profile', {
        schema: userSchema.createProfile,
        handler: async (request, reply) => {
            try {
                const { userId, username } = request.body;
                await DbModel.createProfile(userId, username);
                return reply.code(200).send({
                    success: true,
                    message: 'User profile created'
                });
            } catch (error) {
                return reply.code(400).send({
                    success: false,
                    message: error.message
                });
            }
        }
    });
};