const xss = require('xss');

class SanitizeService {
    static xssProtection(request, reply) {
        const processObject = (obj) => {
            for (let key in obj) {
                if (typeof obj[key] === 'string') {
                    // Enhanced XSS protection with stricter options
                    obj[key] = xss(obj[key].trim(), {
                        whiteList: {}, // No HTML tags allowed
                        stripIgnoreTag: true, // Strip all HTML tags
                        stripIgnoreTagBody: ['script'], // Strip script tags and their content
                        css: false, // Disable CSS parsing
                        allowCommentTag: false, // Disable HTML comments
                        allowList: {
                            // Only allow specific attributes for specific tags
                            a: ['href'],
                            img: ['src', 'alt'],
                            // No other tags or attributes allowed
                        }
                    });

                    // Additional sanitization for usernames
                    if (key === 'username') {
                        // Remove any HTML tags
                        obj[key] = obj[key].replace(/<[^>]*>/g, '');
                        // Remove event handlers
                        obj[key] = obj[key].replace(/on\w+\s*=|\b(javascript|data|vbscript):/gi, '');
                        // Remove any potential script injection
                        obj[key] = obj[key].replace(/[<>'"]/g, '');
                        // Only allow alphanumeric characters and underscores
                        obj[key] = obj[key].replace(/[^a-zA-Z0-9_]/g, '');
                    }

                    // Additional sanitization for all string inputs
                    obj[key] = obj[key]
                        .replace(/javascript:|data:|vbscript:|on\w+\s*=/gi, '') // Remove JavaScript URLs and event handlers
                        .replace(/<[^>]*>/g, '') // Remove HTML tags
                        .replace(/[<>'"]/g, ''); // Remove potentially dangerous characters
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    processObject(obj[key]);
                }
            }
        };
        
        try {
            if (request.body) processObject(request.body);
            if (request.query) processObject(request.query);
            if (request.params) processObject(request.params);
        } catch (error) {
            console.error('[XSS PROTECTION]', error.message);
            throw error;
        }
    }

    static sqlInjectionProtection(request, reply) {
        const sqlInjectionPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|EXEC|DECLARE)\b.*\b(FROM|INTO|WHERE|VALUES|TABLE|DATABASE)\b)|(--)|(;)|(\/\*.*\*\/)/i;
        
        const checkForSQLInjection = (obj) => {
            for (let key in obj) {
                if (typeof obj[key] === 'string' && sqlInjectionPattern.test(obj[key])) {
                    throw new Error(`Potential SQL injection detected in ${key}`);
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    checkForSQLInjection(obj[key]);
                }
            }
        };

        try {
            if (request.body) checkForSQLInjection(request.body);
            if (request.query) checkForSQLInjection(request.query);
            if (request.params) checkForSQLInjection(request.params);
        } catch (error) {
            console.error('[SQL INJECTION PROTECTION]', error.message);
            throw error;
        }
    }

    static async sanitize(request, reply) {
        try {
            SanitizeService.xssProtection(request, reply);
            SanitizeService.sqlInjectionProtection(request, reply);
        } catch (error) {
            console.error('[SECURITY] Error in middleware:', error);
            return reply.code(400).send({ 
                success: false,
                message: error.message.includes('SQL') ? 
                    'The request contains potentially harmful content SQL' :
                    'The request contains potentially harmful content xss'
            });
        }
    }
}

module.exports = SanitizeService;
