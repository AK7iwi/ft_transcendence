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
        if (friend.id === userId) {
            throw new Error('Cannot add yourself as a friend');
        }

        // Check if friendship already exists
        const exists = await DbFriend.findFriendship(userId, friend.id);
        if (exists) {
            throw new Error('Friend already added');
        }

            // Add friend
            await DbFriend.createFriendship(userId, friend.id);

            return {
                username: username
            };

        } catch (error) {
            throw new Error(`Failed to add friend: ${error.message}`);
        }
    }

}

module.exports = FriendService;
