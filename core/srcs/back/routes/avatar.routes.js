const path = require('path');
const fs = require('fs');
const util = require('util');
const pump = util.promisify(require('stream').pipeline);
const authenticate = require('../middleware/authenticate');
const db = require('../db');

async function avatarRoutes(fastify, options) {
  fastify.post('/upload-avatar', {
    preHandler: authenticate,
    handler: async (request, reply) => {
      const file = await request.file();
      const userId = request.user.id;

      if (!file || !file.filename) {
        return reply.code(400).send({ error: 'No file uploaded' });
      }

      const ext = path.extname(file.filename);
      const fileName = `avatar_${userId}${ext}`;
      const filePath = path.join(__dirname, '..', '..', 'public', 'avatars', fileName);

      await pump(file.file, fs.createWriteStream(filePath));

      const relativePath = `/avatars/${fileName}`;
      db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(relativePath, userId);

      return reply.send({ success: true, avatarUrl: relativePath });
    }
  });
}

module.exports = avatarRoutes;
