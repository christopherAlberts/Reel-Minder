// Netlify function for news API
const NEWS_API_KEY = process.env.NEWS_API_KEY || 'YOUR_NEWS_API_KEY_HERE';
const NEWS_API_BASE_URL = 'https://newsapi.org/v2';

exports.handler = async (event, context) => {
    // Set CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: '',
        };
    }

    // Only allow GET requests
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    try {
        const { query, category } = event.queryStringParameters || {};

        if (!NEWS_API_KEY || NEWS_API_KEY === 'YOUR_NEWS_API_KEY_HERE') {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    error: 'NewsAPI key not configured. Please set NEWS_API_KEY environment variable.' 
                }),
            };
        }

        // Build search query based on category or provided query
        let searchQuery = query || '';
        if (!searchQuery && category) {
            switch(category) {
                case 'movies':
                    searchQuery = 'movies OR film OR cinema OR movie';
                    break;
                case 'tv':
                    searchQuery = 'TV OR television OR series OR show OR streaming';
                    break;
                case 'celebrities':
                    searchQuery = 'celebrity OR actor OR actress OR director OR producer';
                    break;
                default:
                    searchQuery = 'entertainment OR movies OR TV OR film OR cinema OR celebrity';
            }
        }

        if (!searchQuery) {
            searchQuery = 'entertainment OR movies OR TV OR film OR cinema OR celebrity';
        }

        // Fetch news from NewsAPI
        const newsApiUrl = `${NEWS_API_BASE_URL}/everything?q=${encodeURIComponent(searchQuery)}&sortBy=publishedAt&language=en&pageSize=20&apiKey=${NEWS_API_KEY}`;
        
        const response = await fetch(newsApiUrl);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch news');
        }

        // Return the news data
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data),
        };

    } catch (error) {
        console.error('News API error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to fetch news',
                message: error.message 
            }),
        };
    }
};
