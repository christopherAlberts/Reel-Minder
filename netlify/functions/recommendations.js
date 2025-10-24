// Netlify function for TMDB recommendations
const fetch = require('node-fetch');

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

    const { type, id } = event.queryStringParameters || {};

    if (!type || !id) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing type or id parameter' }),
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
            `https://api.themoviedb.org/3/${type}/${id}/recommendations?api_key=${TMDB_API_KEY}&language=en-US&page=1`
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
        console.error('Recommendations error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Recommendations fetch failed' }),
        };
    }
};
