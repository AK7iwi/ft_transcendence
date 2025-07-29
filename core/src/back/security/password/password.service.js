const bcrypt = require('bcrypt');

class PasswordService {
    
    static async hashPassword(password) {
        const saltRounds = 10;
        return await bcrypt.hash(password, saltRounds);
    }

    static async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }
}

module.exports = PasswordService;