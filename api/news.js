// News API endpoint for Reel Minder
// This handles news requests and proxies them to NewsAPI to avoid CORS issues

const NEWS_API_KEY = process.env.NEWS_API_KEY || 'YOUR_NEWS_API_KEY_HERE';
const NEWS_API_BASE_URL = 'https://newsapi.org/v2';

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { query, category } = req.query;

        if (!NEWS_API_KEY || NEWS_API_KEY === 'YOUR_NEWS_API_KEY_HERE') {
            return res.status(500).json({ 
                error: 'NewsAPI key not configured. Please set NEWS_API_KEY environment variable.' 
            });
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
        res.status(200).json(data);

    } catch (error) {
        console.error('News API error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch news',
            message: error.message 
        });
    }
}
