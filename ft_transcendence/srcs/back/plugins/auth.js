const fp = require('fastify-plugin')
const jwt = require('@fastify/jwt')
const bcrypt = require('bcrypt')

async function authPlugin(fastify, opts) {
    // Register JWT
    await fastify.register(jwt, {
        secret: process.env.JWT_SECRET || 'your-secret-key' // In production, always use env variable
    })

    // Add authentication decorators
    fastify.decorate('authenticate', async function(request, reply) {
        try {
            await request.jwtVerify()
        } catch (err) {
            reply.send(err)
        }
    })

    // Add bcrypt utility functions
    fastify.decorate('hashPassword', async function(password) {
        return await bcrypt.hash(password, 12)
    })

    fastify.decorate('comparePassword', async function(password, hash) {
        return await bcrypt.compare(password, hash)
    })
}

module.exports = fp(authPlugin) 