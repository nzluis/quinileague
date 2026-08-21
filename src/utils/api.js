const API_URL = import.meta.env.VITE_API_URL || 'https://quinileague-api.dazzling-snagglefoot.workers.dev';

async function request(endpoint, options = {}) {
    const fetchOptions = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    };
    
    if (fetchOptions.body && typeof fetchOptions.body === 'object') {
        fetchOptions.body = JSON.stringify(fetchOptions.body);
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, fetchOptions);

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || 'Request failed');
    }

    return response.json();
}

export default {
    async getMatches(matchday) {
        return request(`/matches?matchday=${matchday}`);
    },

    async getNextMatchday(matchday) {
        return request(`/matches/next${matchday ? `?matchday=${matchday}` : ''}`);
    },

    async getBets(matchday) {
        return request(`/bets?matchday=${matchday}`);
    },

    async submitBet(data) {
        return request('/bets', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async submitResults(matchday, results) {
        return request('/results', {
            method: 'POST',
            body: JSON.stringify({ matchday, results }),
        });
    },

    async getResults(matchday) {
        return request(`/results${matchday !== undefined ? `?matchday=${matchday}` : ''}`);
    },

    async getStandings() {
        return request('/standings');
    },
};
