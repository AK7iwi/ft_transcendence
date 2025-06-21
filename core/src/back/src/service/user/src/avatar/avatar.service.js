const path = require('path');
const fs = require('fs');
const pump = require('util').promisify(require('stream').pipeline);
const DbUser = require('../database/db.user');

class AvatarService {
    static async uploadAvatar(file, userId) {
        try {
            if (!file || !file.filename) {
                throw new Error('No file uploaded');
            }

            // Validate file type
            const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
            const ext = path.extname(file.filename).toLowerCase();
            
            if (!allowedExtensions.includes(ext)) {
                throw new Error('Invalid file type. Only JPG, PNG, and GIF files are allowed.');
            }

            // Validate file size (max 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.file.bytesRead > maxSize) {
                throw new Error('File size too large. Maximum size is 5MB.');
            }

            const fileName = `avatar_${userId}${ext}`;
            const avatarsDir = path.join(__dirname, '..', 'public', 'avatars');
            
            // Create avatars directory if it doesn't exist
            if (!fs.existsSync(avatarsDir)) {
                fs.mkdirSync(avatarsDir, { recursive: true });
            }

            const filePath = path.join(avatarsDir, fileName);

            // Save file to disk
            await pump(file.file, fs.createWriteStream(filePath));

            const relativePath = `/avatars/${fileName}`;

            // Update database
            await DbUser.updateAvatar(userId, relativePath);

            return {
                success: true,
                avatarUrl: relativePath
            };

        } catch (error) {
            throw error;
        }
    }
}

module.exports = AvatarService;
