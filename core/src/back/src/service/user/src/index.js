const fastify = require('fastify');
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const pump = require('util').promisify(require('stream').pipeline);
const ServiceClient = require('./utils/service-client');
const initializeDatabase = require('./database/schema');
const userRoutes = require('./user/user.routes');
const updateRoutes = require('./update/update.routes');
const internalRoutes = require('./internal/internal.routes');
const JWTAuthentication = require('../security/middleware/jwt/jwt.auth');
const DbUser = require('./database/db.user');

// Create Fastify instance
const app = fastify({ logger: true });

// Register multipart for file uploads
app.register(require('@fastify/multipart'));

// Create and register service client
const serviceClient = new ServiceClient(app);
app.decorate('serviceClient', serviceClient);

// Initialize database
initializeDatabase();

// Register routes
app.register(userRoutes, { prefix: '/user' });
app.register(updateRoutes, { prefix: '/user' });
app.register(internalRoutes, { prefix: '/user/internal' });

// Avatar upload route
app.post('/user/upload-avatar', {
    preHandler: [JWTAuthentication.verifyJWTToken],
    handler: async (request, reply) => {
        try {
            const file = await request.file();
            const userId = request.user.id;

            if (!file || !file.filename) {
                request.log.warn('[AVATAR] No file provided');
                return reply.code(400).send({ 
                    success: false, 
                    message: 'No file uploaded' 
                });
            }

            // Validate file type
            const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
            const ext = path.extname(file.filename).toLowerCase();
            
            if (!allowedExtensions.includes(ext)) {
                return reply.code(400).send({ 
                    success: false, 
                    message: 'Invalid file type. Only JPG, PNG, and GIF files are allowed.' 
                });
            }

            // Validate file size (max 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.file.bytesRead > maxSize) {
                return reply.code(400).send({ 
                    success: false, 
                    message: 'File size too large. Maximum size is 5MB.' 
                });
            }

            const fileName = `avatar_${userId}${ext}`;
            const avatarsDir = path.join(__dirname, 'public', 'avatars');
            
            // Create avatars directory if it doesn't exist
            if (!fs.existsSync(avatarsDir)) {
                fs.mkdirSync(avatarsDir, { recursive: true });
            }

            const filePath = path.join(avatarsDir, fileName);

            // Save file to disk
            await pump(file.file, fs.createWriteStream(filePath));

            const relativePath = `/avatars/${fileName}`;

            // Update database
            await DbUser.updateAvatar(userId, relativePath);

            return reply.send({
                success: true,
                avatarUrl: relativePath
            });

        } catch (err) {
            request.log.error('[AVATAR] Upload error:', err);
            return reply.code(500).send({ 
                success: false, 
                message: err.message || 'Server error during avatar upload' 
            });
        }
    }
});

// Test endpoint
app.get('/', async (request, reply) => {
    reply.code(200).send({ success: true, message: 'Server is running' });
});

// Health check endpoint
app.get('/health', async (request, reply) => {
    reply.code(200).send({ success: true, message: 'Server is healthy' });
});

// Start server
const start = async () => {
    try {
        await app.listen({ 
            port: process.env.USER_PORT,
            host: process.env.HOST
        });
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();