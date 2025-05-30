const internalSchema = require('../schema/internal.schema');
const InternalController = require('../controllers/internal.controller');

module.exports = async function (fastify, opts) {
    // Route for auth service to create user profile
    fastify.post('/internal/user', {
        schema: internalSchema.createUser,
        handler: InternalController.createUser
    });
};