const authenticate = require('../middleware/authenticate');
const { db } = require('../db');

async function chatRoutes(fastify, options) {
  fastify.post('/chat/message', {
    preHandler: authenticate,
    handler: async (request, reply) => {
      const { receiverId, content } = request.body;
      const senderId = request.user.id;

      if (!receiverId || !content) {
        return reply.code(400).send({ error: 'receiverId and content are required' });
      }

      db.prepare('INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)')
        .run(senderId, receiverId, content);

      return reply.send({ success: true });
    }
  });
}

module.exports = chatRoutes;
