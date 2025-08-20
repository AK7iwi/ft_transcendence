const DbFriend = require('../database/db.friend');
const { NotFoundError, ConflictError } = require('../utils/error/errors');

class FriendService {
    static async checkIfFriendExists(userId, username) {
        const friend = await DbFriend.getUserByUsername(username);
        if (!friend) {
            throw new NotFoundError('Friend not found', { 
                field: 'username',
                value: friend.username 
            });
        }
        else if (friend.user_id === userId) {
            throw new ConflictError('Cannot add yourself as a friend', { 
                field: 'username',
                value: friend.username 
            });
        }

        return friend;
    }

    static async checkIfFriendshipExists(userId, friend) {
        const exists = await DbFriend.findFriendship(userId, friend.user_id);
        if (exists) {
            throw new ConflictError('Friend already added', { 
                field: 'username',
                value: friend.username
            });
        }
    }

    static async addFriend(userId, friendId) {
        await DbFriend.createFriendship(userId, friendId);
    }

    static async removeFriend(userId, friendId) {
        await DbFriend.removeFriend(userId, friendId);
    }

    static async getFriends(userId) {
        const friends = await DbFriend.getFriends(userId);

        return friends;
    }

    static async blockUser(userId, blockedId) {
        await DbFriend.blockUser(userId, blockedId);
    }

    static async unblockUser(userId, unblockId) {
        await DbFriend.unblockUser(userId, unblockId);   
    }

    static async getBlockedUsers(userId) {
        const blockedUsers = await DbFriend.getBlockedUsers(userId);

        return blockedUsers;
    }

    static async getUserById(userId) {
        const user = await DbFriend.getUserById(userId);

        return user.username;
    }
}

module.exports = FriendService;
