const internalSchema = require('./internal.schema');
const InternalController = require('./internal.controller');

module.exports = async function (fastify, opts) {
    // Route for auth service to create user profile
    fastify.post('/createUser', { 
        schema: internalSchema.createUser,
        handler: InternalController.createUser
    });

    // Route for auth service to update username
    fastify.put('/updateUsername', {
        schema: internalSchema.updateUsername,
        handler: InternalController.updateUsername
    });
};