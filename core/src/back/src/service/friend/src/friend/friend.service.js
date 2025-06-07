const DbFriend = require('../database/db.friend');

class FriendService {
    static async addFriend(userId, username) {
        // Check if user exists
        const friend = DbFriend.findUserByUsername(username);
        if (!friend) {
            throw new Error('User not found');
        }

        // Check if trying to add self
        if (friend.id === userId) {
            throw new Error('Cannot add yourself as a friend');
        }

        // Check if friendship already exists
        const exists = DbFriend.findFriendship(userId, friend.id);
        if (exists) {
            throw new Error('Friend already added');
        }

        // Add friend
        DbFriend.createFriendship(userId, friend.id);

        return { success: true, message: 'Friend added successfully' };
    }

}

module.exports = FriendService;
