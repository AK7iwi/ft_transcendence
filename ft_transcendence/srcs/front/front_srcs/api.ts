const API_BASE_URL = '/api';

export interface User {
    id: number;
    username: string;
    email: string;
    created_at: string;
}

export const api = {
    // User endpoints
    getUsers: async (): Promise<User[]> => {
        const response = await fetch(`${API_BASE_URL}/users`);
        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        return data.users;
    },

    // Game endpoints
    createGame: async (player1Id: number, player2Id: number) => {
        const response = await fetch(`${API_BASE_URL}/games`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ player1Id, player2Id }),
        });
        if (!response.ok) {
            throw new Error('Failed to create game');
        }
        return response.json();
    },

    // Tournament endpoints
    createTournament: async (name: string) => {
        const response = await fetch(`${API_BASE_URL}/tournaments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name }),
        });
        if (!response.ok) {
            throw new Error('Failed to create tournament');
        }
        return response.json();
    },
}; 