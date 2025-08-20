const FriendService = require('./friend.service');

class FriendController {
    async addFriend(request, reply) {
        const { friendUsername } = request.body;
        const userId = request.user.id;
        const username = request.user.username;

        const friend = await FriendService.checkIfFriendExists(userId, friendUsername);
        await FriendService.checkIfFriendshipExists(userId, friend);
        await FriendService.addFriend(userId, friend.user_id);

        return reply.code(200).send({ 
            success: true, 
            message: 'Friend added successfully',
            data: {
                user: {
                    username: username
                },
                friend: {
                    username: friend.username
                }
            }
        });
    }

    async removeFriend(request, reply) {
        const { friendId } = request.body;
        const userId = request.user.id;
        const username = request.user.username;

        const removedUsername = await FriendService.getUserById(friendId);
        await FriendService.removeFriend(userId, friendId);
            
        return reply.code(200).send({
            success: true,
            message: 'Friend removed successfully',
            data: {
                user: {
                    username: username
                },
                removedFriend: {
                    username: removedUsername
                }
            }
        });
    }

    async getFriends(request, reply) {
        const userId = request.user.id;
        const username = request.user.username;

        const friends = await FriendService.getFriends(userId);
            
        return reply.code(200).send({
            success: true,
            message: 'Friends retrieved successfully',
            data: {
                user: {
                    username: username
                },
                friends: friends
            }
        });
    }

    async blockUser(request, reply) {
        const { blockedId } = request.body;
        const userId = request.user.id;
        const username = request.user.username;

        const blockedUsername = await FriendService.getUserById(blockedId);
        await FriendService.blockUser(userId, blockedId);
            
        return reply.code(200).send({
            success: true,
            message: 'User blocked successfully',
            data: {
                user: {
                    username: username
                },
                blockedFriend: {
                    username: blockedUsername
                }
            }
        });
    }

    async unblockUser(request, reply) {
        const { unblockId } = request.body;
        const userId = request.user.id;
        const username = request.user.username;

        const unblockedUsername = await FriendService.getUserById(unblockId);
        await FriendService.unblockUser(userId, unblockId);
            
        return reply.code(200).send({
            success: true,
            message: 'User unblocked successfully',
            data: {
                user: {
                    username: username
                },
                unblockedFriend: {
                    username: unblockedUsername
                }
            }
        });
    }

    async getBlockedUsers(request, reply) {
        const userId = request.user.id;
        const username = request.user.username;

        const blockedFriends = await FriendService.getBlockedUsers(userId);
            
        return reply.code(200).send({
            success: true,
            message: 'Blocked users retrieved successfully',
            data: {
                user: {
                    username: username
                },
                blockedFriends: blockedFriends
            }
        });
    }
}

module.exports = new FriendController();
