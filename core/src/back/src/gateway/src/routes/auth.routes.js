const authSchema  = require('../schemas/auth.schema');
const JWTAuthentication = require('../security/middleware/jwt/jwt.auth');
const SanitizeService = require('../security/middleware/sanitize/sanitize.service');

module.exports = async function (fastify, opts) {
    // Auth routes

    fastify.post('/register', {
        schema: authSchema.register,
        preHandler: [SanitizeService.sanitize],
        handler: async (request, reply) => {
            const { data, status } = await fastify.serviceClient.post(
                `${process.env.AUTH_SERVICE_URL}/register`,
                request.body
            );
            return reply.code(status).send(data);
        }
    });

    fastify.post('/login', {
        schema: authSchema.login,
        preHandler: [SanitizeService.sanitize],
        handler: async (request, reply) => {
            const { data, status } = await fastify.serviceClient.post(
                `${process.env.AUTH_SERVICE_URL}/login`,
                request.body
            );
            return reply.code(status).send(data); 
        }
    });

    // 2FA routes

    fastify.post('/2fa/setup', {
        schema: authSchema.setup2FA,
        preHandler: [JWTAuthentication.verifyJWTToken, SanitizeService.sanitize],   
        handler: async (request, reply) => {
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
        }
    });

    fastify.post('/2fa/verify-setup', {
        schema: authSchema.verify_setup2FA,
        preHandler: [JWTAuthentication.verifyJWTToken, SanitizeService.sanitize], 
        handler: async (request, reply) => {
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
        }
    });

    fastify.post('/2fa/verify-login', {
        schema: authSchema.verify_login2FA,
        preHandler: [SanitizeService.sanitize],
        handler: async (request, reply) => {
            const { data, status } = await fastify.serviceClient.post(
                `${process.env.AUTH_SERVICE_URL}/2fa/verify-login`,
                request.body
            );
            return reply.code(status).send(data);
        }
    });

    fastify.post('/2fa/disable', {
        schema: authSchema.disable2FA,
        preHandler: [JWTAuthentication.verifyJWTToken, SanitizeService.sanitize],
        handler: async (request, reply) => {
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
        }
    });
};
