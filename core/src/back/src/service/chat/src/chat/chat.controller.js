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

            return reply.code(200).send({
                success: true,
                message: 'Message sent successfully',
                data: {
                    success: true
                }
            });
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal server error' });
        }
    }

    async getMessages(request, reply) {
        try {
            const senderId = request.user.id;
            const receiverId = parseInt(request.params.userId, 10);

            const messages = await ChatService.getMessages(senderId, receiverId);

            return reply.code(200).send({
                success: true,
                message: 'Messages retrieved successfully',
                data: messages
            });
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal server error' });
        }
    }
}

module.exports = new ChatController();
