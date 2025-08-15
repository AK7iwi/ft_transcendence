const ChatService = require('./chat.service');

class ChatController {
    async sendMessage(request, reply) {
        const { receiverId, content } = request.body;
        const senderId = request.user.id;
        const senderUsername = request.user.username;

        await ChatService.sendMessage(senderId, receiverId, content);

        //201??
        return reply.code(200).send({
            success: true,
            message: 'Message sent successfully',
            data: {
                user: {
                    username: senderUsername,
                    message: content
                }
            }
        });
    }

    async getMessages(request, reply) {
        const senderId = request.user.id;
        const receiverId = parseInt(request.params.userId, 10);

        const messages = await ChatService.getMessages(senderId, receiverId);

        return reply.code(200).send({
            success: true,
            message: 'Messages retrieved successfully',
            data: messages
        });
    }
}

module.exports = new ChatController();
