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
            
            return reply.code(200).send({
                success: true,
                message: 'Blocked users retrieved successfully',
                data: blockedIds
            });
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

    async unblockUser(request, reply) {
        try {
            const userId = request.user.id;
            const { unblockId } = request.body;

            if (!unblockId) {
                return reply.code(400).send({
                    success: false,
                    message: 'unblockId required'
                });
            }

            await FriendService.unblockUser(userId, unblockId);
            
            return reply.code(200).send({
                success: true,
                message: 'User unblocked successfully'
            });
        } catch (error) {
            request.log.error('[UNBLOCK USER ERROR]', error);
            if (error.message === 'No blocking relationship found') {
                return reply.code(404).send({
                    success: false,
                    message: error.message
                });
            }
            return reply.code(500).send({
                success: false,
                message: error.message || 'Failed to unblock user'
            });
        }
    }

    async removeFriend(request, reply) {
        try {
            const userId = request.user.id;
            const { friendId } = request.body;

            if (!friendId) {
                return reply.code(400).send({
                    success: false,
                    message: 'friendId is required'
                });
            }

            const result = await FriendService.removeFriend(userId, friendId);
            
            return reply.code(200).send({
                success: true,
                message: 'Friend removed successfully'
            });
        } catch (error) {
            request.log.error('[REMOVE FRIEND ERROR]', error);
            return reply.code(500).send({
                success: false,
                message: error.message || 'Failed to remove friend'
            });
        }
    }
}

module.exports = new FriendController();
