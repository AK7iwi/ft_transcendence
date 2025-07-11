const { AppError } = require('./errors');

class ErrorHandler {
    static handle(error, request, reply) {
        console.log('=== ERROR HANDLER CALLED ===');
        console.log('Error:', error);
        console.log('Error type:', typeof error);
        console.log('Error constructor:', error.constructor.name);
        console.log('Error message:', error.message);
        console.log('Error code:', error.code);
        console.log('Error instanceof AppError:', error instanceof AppError);
        console.log('==========================');

        // Log the error
        request.log.error({
            error: error.message,
            stack: error.stack,
            url: request.url,
            method: request.method,
            user: request.user?.id || 'anonymous'
        });

        //Doesnt enter here 
        // If it's our custom error, use its properties
        if (error instanceof AppError) {
            console.log('Handling AppError');
            return reply.code(error.statusCode).send({
                success: false,
                message: error.message,
                errorCode: error.errorCode,
                timestamp: error.timestamp,
                details: error.details,
                path: request.url
            });
        }

        // Handle database errors
        if (error.code && error.code.startsWith('SQLITE_')) {
            console.log('Handling SQLite error:', error.code);
            return ErrorHandler.handleDatabaseError(error, request, reply);
        }

        // Handle validation errors
        if (error.validation) {
            console.log('Handling validation error');
            return ErrorHandler.handleValidationError(error, request, reply);
        }

        // Default error response
        console.log('Handling default error');
        return reply.code(500).send({
            success: false,
            message: 'Internal server error',
            errorCode: 'INTERNAL_ERROR',
            timestamp: new Date().toISOString(),
            path: request.url
        });
    }

    static handleDatabaseError(error, request, reply) {
        const errorMap = {
            'SQLITE_CONSTRAINT_UNIQUE': {
                statusCode: 409,
                errorCode: 'DUPLICATE_ENTRY',
                message: 'Resource already exists'
            },
            'SQLITE_CONSTRAINT_FOREIGNKEY': {
                statusCode: 400,
                errorCode: 'FOREIGN_KEY_VIOLATION',
                message: 'Referenced resource does not exist'
            },
            'SQLITE_CONSTRAINT_NOTNULL': {
                statusCode: 400,
                errorCode: 'NULL_CONSTRAINT_VIOLATION',
                message: 'Required field is missing'
            }
        };

        const errorInfo = errorMap[error.code] || {
            statusCode: 500,
            errorCode: 'DATABASE_ERROR',
            message: 'Database operation failed'
        };

        return reply.code(errorInfo.statusCode).send({
            success: false,
            message: errorInfo.message,
            errorCode: errorInfo.errorCode,
            timestamp: new Date().toISOString(),
            details: { databaseCode: error.code },
            path: request.url
        });
    }

    static handleValidationError(error, request, reply) {
        const formattedError = ErrorHandler.formatValidationError(error.validation);
        return reply.code(400).send(formattedError);
    }

    //doesnt show the details of the error
    static formatValidationError(validationErrors) {
        const errors = validationErrors.map(error => {
            const field = ErrorHandler.formatFieldName(error.instancePath, error.params);
            const constraint = ErrorHandler.getConstraintType(error);
            
            return {
                field: field,
                constraint: constraint,
                message: ErrorHandler.getUserFriendlyMessage(error, field),
                value: error.data,
                code: ErrorHandler.getErrorCode(error)
            };
        });

        return {
            success: false,
            message: 'Validation failed',
            errorCode: 'VALIDATION_ERROR',
            timestamp: new Date().toISOString(),
            details: {
                errors: errors,
                totalErrors: errors.length
            }
        };
    }

    static formatFieldName(instancePath, params) {
        let fieldName = instancePath.replace(/^\//, '') || params.missingProperty;
        fieldName = fieldName.replace(/[-_]([a-z])/g, (match, letter) => letter.toUpperCase());
        fieldName = fieldName.replace(/([A-Z])/g, ' $1').toLowerCase();
        fieldName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
        return fieldName;
    }

    static getConstraintType(error) {
        const constraintMap = {
            'required': 'required',
            'type': 'type',
            'minLength': 'minLength',
            'maxLength': 'maxLength',
            'pattern': 'pattern',
            'enum': 'enum',
            'minimum': 'minimum',
            'maximum': 'maximum',
            'minItems': 'minItems',
            'maxItems': 'maxItems',
            'uniqueItems': 'uniqueItems',
            'format': 'format',
            'email': 'email',
            'uri': 'uri',
            'date': 'date',
            'date-time': 'dateTime',
            'custom': 'custom'
        };
        
        return constraintMap[error.keyword] || 'unknown';
    }

    static getErrorCode(error) {
        const codeMap = {
            'required': 'FIELD_REQUIRED',
            'type': 'INVALID_TYPE',
            'minLength': 'TOO_SHORT',
            'maxLength': 'TOO_LONG',
            'pattern': 'INVALID_FORMAT',
            'enum': 'INVALID_VALUE',
            'minimum': 'VALUE_TOO_SMALL',
            'maximum': 'VALUE_TOO_LARGE',
            'minItems': 'TOO_FEW_ITEMS',
            'maxItems': 'TOO_MANY_ITEMS',
            'uniqueItems': 'DUPLICATE_ITEMS',
            'format': 'INVALID_FORMAT',
            'email': 'INVALID_EMAIL',
            'uri': 'INVALID_URI',
            'date': 'INVALID_DATE',
            'date-time': 'INVALID_DATETIME'
        };
        
        return codeMap[error.keyword] || 'VALIDATION_ERROR';
    }

    static getUserFriendlyMessage(error, fieldName) {
        const field = fieldName || ErrorHandler.formatFieldName(error.instancePath, error.params);
        
        switch (error.keyword) {
            case 'required':
                return `${field} is required`;
            case 'type':
                const expectedType = error.params.type;
                const receivedType = typeof error.data;
                return `${field} must be a ${expectedType} (received ${receivedType})`;
            case 'minLength':
                return `${field} must be at least ${error.params.limit} characters long`;
            case 'maxLength':
                return `${field} must be no more than ${error.params.limit} characters long`;
            case 'pattern':
                return `${field} format is invalid`;
            case 'enum':
                const allowedValues = error.params.allowedValues || [];
                return `${field} must be one of: ${allowedValues.join(', ')}`;
            case 'minimum':
                return `${field} must be at least ${error.params.limit}`;
            case 'maximum':
                return `${field} must be no more than ${error.params.limit}`;
            case 'minItems':
                return `${field} must have at least ${error.params.limit} items`;
            case 'maxItems':
                return `${field} must have no more than ${error.params.limit} items`;
            case 'uniqueItems':
                return `${field} must not contain duplicate items`;
            case 'format':
                return `${field} format is invalid`;
            case 'email':
                return `${field} must be a valid email address`;
            case 'uri':
                return `${field} must be a valid URI`;
            case 'date':
                return `${field} must be a valid date`;
            case 'date-time':
                return `${field} must be a valid date and time`;
            default:
                return `${field} is invalid`;
        }
    }
}

module.exports = ErrorHandler; 