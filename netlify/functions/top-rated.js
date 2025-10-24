// Netlify function for TMDB top-rated
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

    const { media_type } = event.queryStringParameters || {};

    try {
        const TMDB_API_KEY = process.env.TMDB_API_KEY;
        
        if (!TMDB_API_KEY) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'API key not configured' }),
            };
        }

        let url;
        if (media_type === 'all') {
            // Fetch both movie and TV top-rated
            const movieResponse = await fetch(`https://api.themoviedb.org/3/movie/top_rated?api_key=${TMDB_API_KEY}&language=en-US&page=1`);
            const tvResponse = await fetch(`https://api.themoviedb.org/3/tv/top_rated?api_key=${TMDB_API_KEY}&language=en-US&page=1`);
            
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
        } else if (media_type === 'movie') {
            url = `https://api.themoviedb.org/3/movie/top_rated?api_key=${TMDB_API_KEY}&language=en-US&page=1`;
        } else if (media_type === 'tv') {
            url = `https://api.themoviedb.org/3/tv/top_rated?api_key=${TMDB_API_KEY}&language=en-US&page=1`;
        } else {
            // Default to movie top-rated
            url = `https://api.themoviedb.org/3/movie/top_rated?api_key=${TMDB_API_KEY}&language=en-US&page=1`;
        }

        const response = await fetch(url);

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
        console.error('Top-rated error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Top-rated fetch failed' }),
        };
    }
};
