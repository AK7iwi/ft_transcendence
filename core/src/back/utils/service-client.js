const fetch = require('node-fetch');

class ServiceClient {
    constructor(fastify) {
        this.fastify = fastify;
    }


    //test return instead of try and catch 
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
                const serviceUrlObj = new URL(serviceUrl);

                throw {
                    success: false,
                    statusCode: response.status,
                    message: data.message,
                    errorCode: data.errorCode,
                    timestamp: data.timestamp,
                    details: data.details,
                    path: serviceUrlObj.pathname,
                };
            }

            return { data, status: response.status };
        } catch (error) {
            if (error.success === false) {
                throw error;
            }
            
            const serviceUrlObj = new URL(serviceUrl);
            
            throw {
                success: false,
                statusCode: 500,
                message: error.message,
                errorCode: 'NETWORK_ERROR',
                timestamp: new Date().toISOString(),
                details: { url: serviceUrl },
                path: serviceUrlObj.pathname
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


    //can be deleted 
    async patch(serviceUrl, data, options = {}) {
        return this.request(serviceUrl, {
            method: 'PATCH',
            body: JSON.stringify(data),
            ...options
        });
    }
}

module.exports = ServiceClient; 