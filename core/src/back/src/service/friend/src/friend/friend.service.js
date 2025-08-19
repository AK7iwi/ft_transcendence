const DbFriend = require('../database/db.friend');

class FriendService {
    static async addFriend(userId, username) {
        const friend = await DbFriend.findUserByUsername(username);
        if (!friend) {
            throw new Error('User not found');
        }

        // Check if trying to add self
        if (friend.user_id === userId) {
            throw new Error('Cannot add yourself as a friend');
        }

            // Check if friendship already exists
        const exists = await DbFriend.findFriendship(userId, friend.user_id);
        if (exists) {
            throw new Error('Friend already added');
        }

        // Add friend
        await DbFriend.createFriendship(userId, friend.user_id);
            
        return {
            username: username
        };
    }

    static async getFriends(userId) {
        const friends = await DbFriend.getFriends(userId);

        return friends;
    }

    static async getBlockedUsers(userId) {
        const rows = await DbFriend.getBlockedIds(userId);

        return rows.map(r => r.blocked_id);
    }

    static async blockUser(userId, blockedId) {
        await DbFriend.blockUser(userId, blockedId);
        return { message: 'User blocked successfully' };
    }

    static async unblockUser(userId, unblockId) {
        const result = await DbFriend.unblockUser(userId, unblockId);
        if (result.changes === 0) {
            throw new Error('No blocking relationship found');
        }

        return { message: 'User unblocked successfully' };
    }

    static async removeFriend(userId, friendId) {
        const result = await DbFriend.removeFriend(userId, friendId);
        if (result.changes === 0) {
            throw new Error('Friend not found');
        }
        
        return { message: 'Friend removed successfully' };
    }
}

module.exports = FriendService;
