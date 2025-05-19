const { sanitize } = require('validator');

const sanitizeInput = async (request, reply) => {
    const sanitizeObject = (obj) => {
        for (let key in obj) {
            if (typeof obj[key] === 'string') {
                obj[key] = sanitize(obj[key]).trim();
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitizeObject(obj[key]);
            }
        }
    };

    if (request.body) sanitizeObject(request.body);
    if (request.query) sanitizeObject(request.query);
    if (request.params) sanitizeObject(request.params);
};

module.exports = {
    sanitizeInput
}; 