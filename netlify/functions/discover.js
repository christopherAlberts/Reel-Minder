// Netlify function for TMDB discover
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

    const { type, genre, sort, page, media_type } = event.queryStringParameters || {};

    try {
        const TMDB_API_KEY = process.env.TMDB_API_KEY;
        
        console.log('Discover function called with:', { type, genre, sort, page, media_type });
        console.log('API key configured:', !!TMDB_API_KEY);
        
        if (!TMDB_API_KEY) {
            console.error('TMDB_API_KEY not found in environment variables');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'API key not configured' }),
            };
        }

        let url;
        const baseUrl = 'https://api.themoviedb.org/3';
        const params = new URLSearchParams({
            api_key: TMDB_API_KEY,
            language: 'en-US',
            page: page || '1'
        });

        // Handle different discover endpoints
        if (type) {
            // Specific type (movie or tv)
            url = `${baseUrl}/discover/${type}`;
            if (genre) params.append('with_genres', genre);
            if (sort) params.append('sort_by', sort);
        } else if (media_type) {
            // Handle media_type parameter
            if (media_type === 'movie') {
                url = `${baseUrl}/discover/movie`;
            } else if (media_type === 'tv') {
                url = `${baseUrl}/discover/tv`;
            } else {
                // For 'all', we'll fetch both and combine
                const movieResponse = await fetch(`${baseUrl}/discover/movie?${params.toString()}`);
                const tvResponse = await fetch(`${baseUrl}/discover/tv?${params.toString()}`);
                
                if (!movieResponse.ok || !tvResponse.ok) {
                    throw new Error(`TMDB API error: ${movieResponse.status || tvResponse.status}`);
                }
                
                const movieData = await movieResponse.json();
                const tvData = await tvResponse.json();
                
                const combinedResults = [...movieData.results.slice(0, 10), ...tvData.results.slice(0, 10)];
                
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        ...movieData,
                        results: combinedResults
                    }),
                };
            }
        } else {
            // Default to movie discover
            url = `${baseUrl}/discover/movie`;
        }

        const response = await fetch(`${url}?${params.toString()}`);

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
        console.error('Discover error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Discover failed' }),
        };
    }
};
