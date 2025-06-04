const authSchema  = require('../schemas/auth.schema');
const SanitizeService = require('../../security/middleware/sanitize.service');
const JWTAuthentication = require('../../security/middleware/jwt/jwt.auth');

module.exports = async function (fastify, opts) {
    // Register route
    fastify.post('/register', {
        schema: authSchema.register,
        preHandler: SanitizeService.sanitize,
        handler: async (request, reply) => {
            try {
                const response = await fastify.serviceClient.post(
                    `${process.env.AUTH_SERVICE_URL}/auth/register`,
                    request.body
                );
                return reply.code(200).send(response);
            } catch (error) {
                request.log.error(error);
                const statusCode = error.status || 400;
                const errorMessage = error.message || 'Registration failed';
                return reply.code(statusCode).send({
                    success: false,
                    message: errorMessage
                });
            }
        }
    });

    // Login route
    fastify.post('/login', {
        schema: authSchema.login,
        preHandler: SanitizeService.sanitize,
        handler: async (request, reply) => {
            try {
                const response = await fastify.serviceClient.post(
                    `${process.env.AUTH_SERVICE_URL}/auth/login`,
                    request.body
                );
                return reply.code(200).send(response);
            } catch (error) {
                request.log.error(error);
                const statusCode = error.status || 401;
                const errorMessage = error.message || 'Login failed';
                return reply.code(statusCode).send({
                    success: false,
                    message: errorMessage
                });
            }
        }
    });

    // 2FA routes
    fastify.post('/2fa/setup', {
        schema: authSchema.setup2FA,
        preHandler: [SanitizeService.sanitize, JWTAuthentication.verifyJWTToken],   
        handler: async (request, reply) => {
            try {
                const response = await fastify.serviceClient.post(
                    `${process.env.AUTH_SERVICE_URL}/auth/2fa/setup`,
                    request.body
                );
                return reply.code(200).send(response);
            } catch (error) {
                request.log.error(error);
                const statusCode = error.status || 400;
                const errorMessage = error.message || '2FA setup failed';
                return reply.code(statusCode).send({
                    success: false, 
                    message: errorMessage
                });
            }
        }
    });

    fastify.post('/2fa/verify-setup', {
        schema: authSchema.verify_setup2FA,
        preHandler: [SanitizeService.sanitize, JWTAuthentication.verifyJWTToken], 
        handler: async (request, reply) => {
            try {
                const response = await fastify.serviceClient.post(
                    `${process.env.AUTH_SERVICE_URL}/auth/2fa/verify-setup`,
                    request.body
                );
                return reply.code(200).send(response);
            } catch (error) {
                request.log.error(error);
                const statusCode = error.status || 400;
                const errorMessage = error.message || '2FA verification failed';
                return reply.code(statusCode).send({
                    success: false,
                    message: errorMessage
                }); 
            }
        }
    });

    fastify.post('/2fa/verify-login', {
        schema: authSchema.verify_login2FA,
        preHandler: [SanitizeService.sanitize],
        handler: async (request, reply) => {
            try {
                const response = await fastify.serviceClient.post(
                    `${process.env.AUTH_SERVICE_URL}/auth/2fa/verify-login`,
                    request.body    
                );
                return reply.code(200).send(response);
            } catch (error) {
                request.log.error(error);
                const statusCode = error.status || 400;
                const errorMessage = error.message || '2FA verification failed';
                return reply.code(statusCode).send({
                    success: false,
                    message: errorMessage
                });
            }
        }
    });

    fastify.post('/2fa/disable', {
        schema: authSchema.disable2FA,
        preHandler: [SanitizeService.sanitize, JWTAuthentication.verifyJWTToken],
        handler: async (request, reply) => {
            try {
                const response = await fastify.serviceClient.post(
                    `${process.env.AUTH_SERVICE_URL}/auth/2fa/disable`,
                    request.body
                );
                return reply.code(200).send(response);
            } catch (error) {
                request.log.error(error);
                const statusCode = error.status || 400;
                const errorMessage = error.message || '2FA disable failed';
                return reply.code(statusCode).send({
                    success: false,
                    message: errorMessage
                });
            }
        }
    });
    
    
};
