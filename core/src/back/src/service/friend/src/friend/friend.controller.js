const FriendService = require('./friend.service');

class FriendController {
    static async addFriend(request, reply) {
        try {
            const { username } = request.body;
            const userId = request.user.id;

            const result = await FriendService.addFriend(userId, username);
            return reply.code(201).send(result);
        } catch (error) {
            request.log.error(error);
            
            // Handle specific error cases
            if (error.message === 'User not found') {
                return reply.code(404).send({ success: false, message: 'User not found' });
            }
            if (error.message === 'Cannot add yourself as a friend') {
                return reply.code(400).send({ success: false, message: 'Cannot add yourself as a friend' });
            }
            if (error.message === 'Friend already added') {
                return reply.code(400).send({ success: false, message: 'Friend already added' });
            }

            return reply.code(500).send({ success: false, message: 'Internal server error' });
        }
    }
}

module.exports = FriendController;
