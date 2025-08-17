const DbChat = require('../database/db.chat');

class ChatService {
    static async sendMessage(senderId, receiverId, content) {
        await DbChat.createMessage(senderId, receiverId, content);
    }

    static async getMessages(senderId, receiverId) {
        const messages = await DbChat.getMessages(senderId, receiverId);

        return messages;
    }

    static async getUserById(userId) {
        const user = await DbChat.getUserById(userId);
        
        return user.username;
    }
}

module.exports = ChatService;
