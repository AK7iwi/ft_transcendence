const fetch = require('node-fetch');

class ServiceClient {
    constructor(fastify) {
        this.fastify = fastify;
    }

    static getErrorCode(statusCode) {
        const errorCodeMap = {
            400: 'VALIDATION_ERROR',
            401: 'AUTHENTICATION_ERROR', 
            403: 'AUTHORIZATION_ERROR',
            404: 'NOT_FOUND_ERROR',
            409: 'CONFLICT_ERROR',
            422: 'VALIDATION_ERROR',
            500: 'INTERNAL_ERROR'
        };
        return errorCodeMap[statusCode] || 'INTERNAL_ERROR';
    }

    async request(serviceUrl, options) {
        try {
            const response = await fetch(serviceUrl, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            
            const data = await response.json();

            if (!response.ok) {
                throw {
                    success: false,
                    message: data.message || response.statusText,
                    errorCode: data.errorCode || this.getErrorCode(response.status),
                    timestamp: data.timestamp || new Date().toISOString(), 
                    details: data.details || data.errors,
                    path: serviceUrl
                };
            }

            return { data, status: response.status };
        } catch (error) {
            if (error.success === false) {
                throw error;
            }
            throw {
                success: false,
                message: error.message,
                errorCode: 'NETWORK_ERROR',
                timestamp: new Date().toISOString(),
                details: { url: serviceUrl },
                path: serviceUrl
            };
        }
    }

    async get(serviceUrl, options = {}) {
        return this.request(serviceUrl, {
            method: 'GET',
            ...options
        });
    }

    async post(serviceUrl, data, options = {}) {
        return this.request(serviceUrl, {
            method: 'POST',
            body: JSON.stringify(data),
            ...options
        });
    }

    async put(serviceUrl, data, options = {}) {
        return this.request(serviceUrl, {
            method: 'PUT',
            body: JSON.stringify(data),
            ...options
        });
    }

    async delete(serviceUrl, data, options = {}) {
        return this.request(serviceUrl, {
            method: 'DELETE',
            body: JSON.stringify(data),
            ...options
        });
    }

    async patch(serviceUrl, data, options = {}) {
        return this.request(serviceUrl, {
            method: 'PATCH',
            body: JSON.stringify(data),
            ...options
        });
    }
}

module.exports = ServiceClient; 