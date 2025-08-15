const DbChat = require('../database/db.chat');

class ChatService {
    static async sendMessage(senderId, receiverId, content) {
        await DbChat.createMessage(senderId, receiverId, content);
    }

    static async getMessages(senderId, receiverId) {
        const messages = await DbChat.getMessages(senderId, receiverId);

        return messages;
    }
}

module.exports = ChatService;
