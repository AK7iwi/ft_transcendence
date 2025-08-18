const ChatService = require('./chat.service');

class ChatController {
    async sendMessage(request, reply) {
        const { receiverId, content } = request.body;
        const senderId = request.user.id;
        const senderUsername = request.user.username;

        const receiverUsername = await ChatService.getUserById(receiverId);
        await ChatService.sendMessage(senderId, receiverId, content);

        return reply.code(201).send({
            success: true,
            message: 'Message sent successfully',
            data: {
                users: {
                    sender: senderUsername,
                    receiver: receiverUsername
                },
                message: {
                    content: content
                }
            }
        });
    }

    async getMessages(request, reply) {
        const user1Id = request.user.id;
        const user1Username = request.user.username;
        const user2Id = parseInt(request.params.userId, 10);

        const user2Username = await ChatService.getUserById(user2Id);
        const messages = await ChatService.getMessages(user1Id, user2Id);
        
        return reply.code(200).send({
            success: true,
            message: 'Messages retrieved successfully',
            data: {
                users: {
                    user1: user1Username,
                    user2: user2Username
                },
                messages:  messages
            }
        });
    }
}

module.exports = new ChatController();
