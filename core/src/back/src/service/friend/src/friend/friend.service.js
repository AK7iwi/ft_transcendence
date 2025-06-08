const DbFriend = require('../database/db.friend');

class FriendService {
    static async addFriend(userId, username) {
        try {
            // Check if user exists
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

        } catch (error) {
            throw new Error(`Failed to add friend: ${error.message}`);
        }
    }

    static async getFriends(userId) {
        try {
            const friends = await DbFriend.getFriends(userId);
            return friends;
        } catch (error) {
            throw new Error(`Failed to fetch friends: ${error.message}`);
        }
    }

    static async getBlockedUsers(userId) {
        try {
            const rows = await DbFriend.getBlockedIds(userId);
            return rows.map(r => r.blocked_id);
        } catch (error) {
            throw new Error(`Failed to fetch blocked users: ${error.message}`);
        }
    }
}

module.exports = FriendService;
