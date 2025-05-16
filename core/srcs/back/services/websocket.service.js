const WebSocket = require('ws');
const fs = require('fs');

class WebSocketService {
    constructor(server) {
        this.wss = new WebSocket.Server({
            server,
            // SSL configuration
            ssl: {
                key: fs.readFileSync(process.env.SSL_KEY_PATH),
                cert: fs.readFileSync(process.env.SSL_CERT_PATH)
            }
        });

        this.clients = new Map();
        this.setupWebSocket();
    }

    setupWebSocket() {
        this.wss.on('connection', (ws, req) => {
            // Generate unique client ID
            const clientId = this.generateClientId();
            this.clients.set(clientId, ws);

            // Handle client messages
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleMessage(clientId, data);
                } catch (error) {
                    console.error('Error processing message:', error);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Invalid message format'
                    }));
                }
            });

            // Handle client disconnection
            ws.on('close', () => {
                this.clients.delete(clientId);
                this.broadcastUserDisconnected(clientId);
            });

            // Send welcome message
            ws.send(JSON.stringify({
                type: 'connection',
                clientId,
                message: 'Connected to secure WebSocket server'
            }));
        });
    }

    generateClientId() {
        return Math.random().toString(36).substring(2, 15);
    }

    handleMessage(clientId, data) {
        switch (data.type) {
            case 'game':
                this.handleGameMessage(clientId, data);
                break;
            case 'chat':
                this.handleChatMessage(clientId, data);
                break;
            case 'tournament':
                this.handleTournamentMessage(clientId, data);
                break;
            default:
                console.warn('Unknown message type:', data.type);
        }
    }

    handleGameMessage(clientId, data) {
        // Broadcast game state to all clients
        this.broadcast({
            type: 'game',
            clientId,
            data: data.payload
        });
    }

    handleChatMessage(clientId, data) {
        // Broadcast chat message to all clients
        this.broadcast({
            type: 'chat',
            clientId,
            data: data.payload
        });
    }

    handleTournamentMessage(clientId, data) {
        // Handle tournament-related messages
        this.broadcast({
            type: 'tournament',
            clientId,
            data: data.payload
        });
    }

    broadcast(message) {
        const messageStr = JSON.stringify(message);
        this.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(messageStr);
            }
        });
    }

    broadcastUserDisconnected(clientId) {
        this.broadcast({
            type: 'disconnection',
            clientId,
            message: 'User disconnected'
        });
    }

    sendToClient(clientId, message) {
        const client = this.clients.get(clientId);
        if (client && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    }
}

module.exports = WebSocketService; 