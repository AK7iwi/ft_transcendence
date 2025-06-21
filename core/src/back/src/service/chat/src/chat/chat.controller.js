const ChatService = require('./chat.service');

class ChatController {
    async sendMessage(request, reply) {
        try {
            const { receiverId, content } = request.body;
            const senderId = request.user.id;

            if (!receiverId || !content) {
                return reply.code(400).send({ error: 'receiverId and content are required' });
            }

            await ChatService.sendMessage(senderId, receiverId, content);

            return reply.send({ success: true });
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal server error' });
        }
    }

    async getMessages(request, reply) {
        try {
            const senderId = request.user.id;
            const receiverId = Number(request.params.userId);

            const messages = await ChatService.getMessages(senderId, receiverId);

            return reply.send(messages);
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal server error' });
        }
    }
}

module.exports = new ChatController();
