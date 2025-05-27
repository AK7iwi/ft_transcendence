const xss = require('xss');
const { sanitize } = require('validator');

class SanitizeService {
    static xssProtection(request, reply) {
        const processObject = (obj) => {
            for (let key in obj) {
                if (typeof obj[key] === 'string') {
                    obj[key] = xss(sanitize(obj[key]).trim());
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
            return reply.code(400).send({ 
                error: 'Invalid input detected',
                message: 'The request contains potentially harmful content'
            });
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
            return reply.code(400).send({ 
                error: 'Invalid input detected',
                message: 'The request contains potentially harmful content'
            });
        }
    }

    static securityMiddleware(request, reply) {
        SanitizeService.xssProtection(request, reply);
        SanitizeService.sqlInjectionProtection(request, reply);
    }
}

module.exports = SanitizeService;
