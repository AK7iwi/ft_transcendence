const { Type } = require('@sinclair/typebox')

async function authRoutes(fastify, opts) {
    // Register schema
    const registerSchema = {
        body: Type.Object({
            username: Type.String({ minLength: 3, maxLength: 20 }),
            email: Type.String({ format: 'email' }),
            password: Type.String({ minLength: 6 })
        })
    }

    const loginSchema = {
        body: Type.Object({
            email: Type.String({ format: 'email' }),
            password: Type.String()
        })
    }

    // Register endpoint
    fastify.post('/register', {
        schema: registerSchema
    }, async (request, reply) => {
        const { username, email, password } = request.body

        try {
            // Check if user already exists
            const existingUser = fastify.db.prepare(
                'SELECT * FROM users WHERE email = ? OR username = ?'
            ).get(email, username)

            if (existingUser) {
                return reply.code(400).send({
                    error: 'User already exists'
                })
            }

            // Hash password
            const hashedPassword = await fastify.hashPassword(password)

            // Insert new user
            const result = fastify.db.prepare(
                'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
            ).run(username, email, hashedPassword)

            // Generate JWT
            const token = fastify.jwt.sign({ 
                id: result.lastInsertRowid,
                username,
                email
            })

            return { token }
        } catch (error) {
            fastify.log.error(error)
            return reply.code(500).send({
                error: 'Internal server error'
            })
        }
    })

    // Login endpoint
    fastify.post('/login', {
        schema: loginSchema
    }, async (request, reply) => {
        const { email, password } = request.body

        try {
            // Find user
            const user = fastify.db.prepare(
                'SELECT * FROM users WHERE email = ?'
            ).get(email)

            if (!user) {
                return reply.code(401).send({
                    error: 'Invalid credentials'
                })
            }

            // Verify password
            const validPassword = await fastify.comparePassword(
                password,
                user.password_hash
            )

            if (!validPassword) {
                return reply.code(401).send({
                    error: 'Invalid credentials'
                })
            }

            // Generate JWT
            const token = fastify.jwt.sign({
                id: user.id,
                username: user.username,
                email: user.email
            })

            return { token }
        } catch (error) {
            fastify.log.error(error)
            return reply.code(500).send({
                error: 'Internal server error'
            })
        }
    })

    // Protected route example
    fastify.get('/me', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        return request.user
    })
}

module.exports = authRoutes 