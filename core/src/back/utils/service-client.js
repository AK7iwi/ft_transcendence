const fetch = require('node-fetch');

class ServiceClient {
    constructor(fastify) {
        this.fastify = fastify;
    }

    async request(serviceUrl, options) {
        const response = await fetch(serviceUrl, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        const data = await response.json();

        console.log('SERVICE CLIENT RESPONSE (data):', data);

        return { data, status: response.status };
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