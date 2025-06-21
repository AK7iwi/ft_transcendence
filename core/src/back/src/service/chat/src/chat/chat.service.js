const DbChat = require('../database/db.chat');

class ChatService {
    static async sendMessage(senderId, receiverId, content) {
        try {
            return await DbChat.createMessage(senderId, receiverId, content);
        } catch (error) {
            throw new Error('Failed to send message');
        }
    }

    static async getMessages(senderId, receiverId) {
        try {
            return await DbChat.getMessages(senderId, receiverId);
        } catch (error) {
            throw new Error('Failed to retrieve messages');
        }
    }
}

module.exports = ChatService;
