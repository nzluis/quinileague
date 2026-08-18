const API_URL = import.meta.env.VITE_API_URL || 'https://your-api.execute-api.region.amazonaws.com/prod';

async function request(endpoint, options = {}) {
    const fetchOptions = { ...options };
    
    if (fetchOptions.body && typeof fetchOptions.body === 'object') {
        fetchOptions.body = JSON.stringify(fetchOptions.body);
    }
    
    delete fetchOptions.headers;
    
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

    async getNextMatchday() {
        return request('/matches/next');
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

    async getResults() {
        return request('/results');
    },

    async getStandings() {
        return request('/standings');
    },
};
