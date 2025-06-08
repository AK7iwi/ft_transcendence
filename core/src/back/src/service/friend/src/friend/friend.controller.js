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

    async getBlockedUsers(request, reply) {
        try {
            const userId = request.user.id;
            const blockedIds = await FriendService.getBlockedUsers(userId);
            
            return reply.code(200).send(blockedIds);
        } catch (error) {
            request.log.error('[GET BLOCKED USERS ERROR]', error);
            return reply.code(500).send({
                success: false,
                message: error.message || 'Failed to fetch blocked users'
            });
        }
    }

    async blockUser(request, reply) {
        try {
            const userId = request.user.id;
            const { blockedId } = request.body;

            if (!blockedId) {
                return reply.code(400).send({
                    success: false,
                    message: 'blockedId required'
                });
            }

            await FriendService.blockUser(userId, blockedId);
            
            return reply.code(201).send({
                success: true,
                message: 'User blocked successfully'
            });
        } catch (error) {
            request.log.error('[BLOCK USER ERROR]', error);
            return reply.code(500).send({
                success: false,
                message: error.message || 'Failed to block user'
            });
        }
    }
}

module.exports = new FriendController();
