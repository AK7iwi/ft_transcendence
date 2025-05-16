const xss = require('xss');

// XSS Protection middleware
const xssProtection = async (request, reply) => {
    if (request.body) {
        // Sanitize all string values in the request body
        const sanitizeObject = (obj) => {
            for (let key in obj) {
                if (typeof obj[key] === 'string') {
                    obj[key] = xss(obj[key]);
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    sanitizeObject(obj[key]);
                }
            }
        };
        sanitizeObject(request.body);
    }
};

// SQL Injection Protection middleware
const sqlInjectionProtection = async (request, reply) => {
    const sqlInjectionPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|EXEC|DECLARE)\b.*\b(FROM|INTO|WHERE|VALUES|TABLE|DATABASE)\b)|(--)|(;)|(\/\*.*\*\/)/i;
    
    const checkForSQLInjection = (obj) => {
        for (let key in obj) {
            if (typeof obj[key] === 'string' && sqlInjectionPattern.test(obj[key])) {
                throw new Error('Potential SQL injection detected');
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                checkForSQLInjection(obj[key]);
            }
        }
    };

    if (request.body) {
        checkForSQLInjection(request.body);
    }
    if (request.query) {
        checkForSQLInjection(request.query);
    }
    if (request.params) {
        checkForSQLInjection(request.params);
    }
};

module.exports = {
    xssProtection,
    sqlInjectionProtection
}; 