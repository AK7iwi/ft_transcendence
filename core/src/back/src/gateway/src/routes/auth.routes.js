const authSchema  = require('../schemas/auth.schema');
const SanitizeService = require('../security/middleware/sanitize/sanitize.service');
const JWTAuthentication = require('../security/middleware/jwt/jwt.auth');

module.exports = async function (fastify, opts) {
    // Auth routes

    fastify.post('/register', {
        schema: authSchema.register,
        preHandler: [SanitizeService.sanitize],
        handler: async (request, reply) => {
            try {
                const { data, status } = await fastify.serviceClient.post(
                    `${process.env.AUTH_SERVICE_URL}/register`,
                    request.body
                );
                return reply.code(status).send(data);
            } catch (error) {
                request.log.error(error);
                return reply.code(error.status).send({
                    success: false,
                    message: error.message || 'Registration failed'
                });
            }
        }
    });


    fastify.post('/login', {
        schema: authSchema.login,
        preHandler: [SanitizeService.sanitize],
        handler: async (request, reply) => {
            try {
                const { data, status } = await fastify.serviceClient.post(
                    `${process.env.AUTH_SERVICE_URL}/login`,
                    request.body
                );
                return reply.code(status).send(data); 
            } catch (error) {
                request.log.error(error);
                return reply.code(error.status).send({
                    success: false,
                    message: error.message || 'Login failed'
                });
            }
        }
    });


    // 2FA routes

    fastify.post('/2fa/setup', {
        schema: authSchema.setup2FA,
        preHandler: [JWTAuthentication.verifyJWTToken, SanitizeService.sanitize],   
        handler: async (request, reply) => {
            try {
                const { data, status } = await fastify.serviceClient.post(
                    `${process.env.AUTH_SERVICE_URL}/2fa/setup`,
                    request.body,
                    {
                        headers: {
                            'Authorization': request.headers.authorization
                        }
                    }
                );
                return reply.code(status).send(data);
            } catch (error) {
                request.log.error(error);
                return reply.code(error.status).send({
                    success: false, 
                    message: error.message || '2FA setup failed'
                });
            }
        }
    });

    fastify.post('/2fa/verify-setup', {
        schema: authSchema.verify_setup2FA,
        preHandler: [JWTAuthentication.verifyJWTToken, SanitizeService.sanitize], 
        handler: async (request, reply) => {
            try {
                const { data, status } = await fastify.serviceClient.post(
                    `${process.env.AUTH_SERVICE_URL}/2fa/verify-setup`,
                    request.body,
                    {
                        headers: {
                            'Authorization': request.headers.authorization
                        }
                    }
                );
                return reply.code(status).send(data);
            } catch (error) {
                request.log.error(error);
                return reply.code(error.status).send({
                    success: false,
                    message: error.message || '2FA verification failed'
                }); 
            }
        }
    });

    fastify.post('/2fa/verify-login', {
        schema: authSchema.verify_login2FA,
        preHandler: [SanitizeService.sanitize],
        handler: async (request, reply) => {
            try {
                const { data, status } = await fastify.serviceClient.post(
                    `${process.env.AUTH_SERVICE_URL}/2fa/verify-login`,
                    request.body
                );
                return reply.code(status).send(data);
            } catch (error) {
                request.log.error(error);
                return reply.code(error.status).send({
                    success: false,
                    message: error.message || '2FA verification failed'
                });
            }
        }
    });

    fastify.post('/2fa/disable', {
        schema: authSchema.disable2FA,
        preHandler: [JWTAuthentication.verifyJWTToken, SanitizeService.sanitize],
        handler: async (request, reply) => {
            try {
                const { data, status } = await fastify.serviceClient.post(
                    `${process.env.AUTH_SERVICE_URL}/2fa/disable`,
                    request.body,
                    {
                        headers: {
                            'Authorization': request.headers.authorization
                        }
                    }
                );
                return reply.code(status).send(data);
            } catch (error) {
                request.log.error(error);
                return reply.code(error.status).send({
                    success: false,
                    message: error.message || '2FA disable failed'
                });
            }
        }
    });
};
