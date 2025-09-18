// Netlify function for TMDB search
exports.handler = async (event, context) => {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: '',
        };
    }

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    const { type, query } = event.queryStringParameters || {};

    if (!type || !query) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing type or query parameter' }),
        };
    }

    if (!['movie', 'tv'].includes(type)) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Type must be movie or tv' }),
        };
    }

    try {
        const TMDB_API_KEY = process.env.TMDB_API_KEY;
        
        if (!TMDB_API_KEY) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'API key not configured' }),
            };
        }

        const response = await fetch(
            `https://api.themoviedb.org/3/search/${type}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
        );

        if (!response.ok) {
            throw new Error(`TMDB API error: ${response.status}`);
        }

        const data = await response.json();
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data),
        };
    } catch (error) {
        console.error('Search error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Search failed' }),
        };
    }
};
