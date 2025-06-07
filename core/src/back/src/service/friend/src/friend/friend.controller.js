const FriendService = require('./friend.service');

class FriendController {
    async addFriend(request, reply) {
        try {
            const { username } = request.body;
            const userId = request.user.id;

            await FriendService.addFriend(userId, username);

            return reply.code(200).send({ 
                success: true, 
                message: 'Friend added successfully',
                data: {
                    user: {
                        username: username
                    }
                }
            });
        } catch (error) {
            request.log.error(error);
            return reply.code(400).send({
                success: false,
                message: error.message
            });
        }
    }

    async getFriends(request, reply) {
        try {
            const userId = request.user.id;
            const friends = await FriendService.getFriends(userId);
            
            return reply.code(200).send({
                success: true,
                message: 'Friends retrieved successfully',
                data: friends
            });
        } catch (error) {
            request.log.error('[GET FRIENDS ERROR]', error);
            return reply.code(500).send({
                success: false,
                message: error.message || 'Failed to fetch friends'
            });
        }
    }
}

module.exports = new FriendController();
