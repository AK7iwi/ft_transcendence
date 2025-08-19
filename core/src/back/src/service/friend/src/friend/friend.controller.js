const FriendService = require('./friend.service');

class FriendController {
    async addFriend(request, reply) {
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
    }

    async getFriends(request, reply) {
        const userId = request.user.id;
        const friends = await FriendService.getFriends(userId);
            
        return reply.code(200).send({
            success: true,
            message: 'Friends retrieved successfully',
            data: friends
        });
    }

    async getBlockedUsers(request, reply) {
        const userId = request.user.id;
        const blockedIds = await FriendService.getBlockedUsers(userId);
            
        return reply.code(200).send({
            success: true,
            message: 'Blocked users retrieved successfully',
            data: blockedIds
        });
    }

    async blockUser(request, reply) {
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
    }

    async unblockUser(request, reply) {
        const userId = request.user.id;
        const { unblockId } = request.body;

        await FriendService.unblockUser(userId, unblockId);
            
        return reply.code(200).send({
            success: true,
            message: 'User unblocked successfully'
        });
    }

    async removeFriend(request, reply) {
        const userId = request.user.id;
        const { friendId } = request.body;

        await FriendService.removeFriend(userId, friendId);
            
        return reply.code(200).send({
            success: true,
            message: 'Friend removed successfully'
        });
    }
}

module.exports = new FriendController();
