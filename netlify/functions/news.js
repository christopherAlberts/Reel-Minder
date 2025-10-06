// Netlify function for news API
const NEWS_API_KEY = process.env.NEWS_API_KEY || 'YOUR_NEWS_API_KEY_HERE';
const APITUBE_API_KEY = process.env.APITUBE_API_KEY || 'YOUR_APITUBE_API_KEY_HERE';
const NEXIS_API_KEY = process.env.NEXIS_API_KEY || 'YOUR_NEXIS_API_KEY_HERE';
const ZYLA_API_KEY = process.env.ZYLA_API_KEY || 'YOUR_ZYLA_API_KEY_HERE';

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
        const { query, category, page = '1' } = event.queryStringParameters || {};

        // Build search query based on category or provided query
        let searchQuery = query || '';
        if (!searchQuery && category) {
            switch(category) {
                case 'movies':
                    searchQuery = '("movie" OR "film" OR "cinema" OR "box office" OR "Hollywood" OR "blockbuster" OR "premiere" OR "trailer" OR "sequel" OR "franchise") AND NOT ("news" OR "politics" OR "sports" OR "business" OR "technology" OR "science")';
                    break;
                case 'tv':
                    searchQuery = '("TV show" OR "television series" OR "streaming" OR "Netflix" OR "HBO" OR "Disney+" OR "Amazon Prime" OR "episode" OR "season" OR "premiere") AND NOT ("news" OR "politics" OR "sports" OR "business" OR "technology" OR "science")';
                    break;
                case 'celebrities':
                    searchQuery = '("actor" OR "actress" OR "director" OR "producer" OR "celebrity" OR "Hollywood star" OR "movie star" OR "film star" OR "entertainment industry") AND NOT ("news" OR "politics" OR "sports" OR "business" OR "technology" OR "science")';
                    break;
                default:
                    searchQuery = '("movie" OR "film" OR "TV show" OR "television" OR "celebrity" OR "actor" OR "actress" OR "Hollywood" OR "entertainment" OR "cinema" OR "streaming") AND NOT ("news" OR "politics" OR "sports" OR "business" OR "technology" OR "science")';
            }
        }

        if (!searchQuery) {
            searchQuery = '("movie" OR "film" OR "TV show" OR "television" OR "celebrity" OR "actor" OR "actress" OR "Hollywood" OR "entertainment" OR "cinema" OR "streaming") AND NOT ("news" OR "politics" OR "sports" OR "business" OR "technology" OR "science")';
        }

        // Try multiple APIs with fallback
        const allArticles = [];
        const errors = [];

        // Try NewsAPI first
        if (NEWS_API_KEY && NEWS_API_KEY !== 'YOUR_NEWS_API_KEY_HERE') {
            try {
                const newsApiUrl = `${NEWS_API_BASE_URL}/everything?q=${encodeURIComponent(searchQuery)}&sortBy=publishedAt&language=en&pageSize=20&page=${page}&apiKey=${NEWS_API_KEY}`;
                const response = await fetch(newsApiUrl);
                const data = await response.json();

                if (response.ok && data.status === 'ok') {
                    allArticles.push(...(data.articles || []));
                } else {
                    errors.push('NewsAPI: ' + (data.message || 'Failed'));
                }
            } catch (error) {
                errors.push('NewsAPI: ' + error.message);
            }
        }

        // Try APITube
        if (APITUBE_API_KEY && APITUBE_API_KEY !== 'YOUR_APITUBE_API_KEY_HERE') {
            try {
                const apiUrl = `https://api.apitube.io/v1/news/movies?api_key=${APITUBE_API_KEY}&q=${encodeURIComponent(searchQuery)}&limit=20`;
                const response = await fetch(apiUrl);
                const data = await response.json();

                if (response.ok) {
                    const articles = (data.articles || data.results || []).map(article => ({
                        title: article.title,
                        description: article.description || article.summary,
                        url: article.url || article.link,
                        urlToImage: article.image || article.thumbnail,
                        publishedAt: article.publishedAt || article.pubDate,
                        source: { name: article.source || 'APITube' }
                    }));
                    allArticles.push(...articles);
                } else {
                    errors.push('APITube: ' + (data.error || 'Failed'));
                }
            } catch (error) {
                errors.push('APITube: ' + error.message);
            }
        }

        // Try Zyla API
        if (ZYLA_API_KEY && ZYLA_API_KEY !== 'YOUR_ZYLA_API_KEY_HERE') {
            try {
                const apiUrl = `https://zylalabs.com/api/entertainment-news?api_key=${ZYLA_API_KEY}&query=${encodeURIComponent(searchQuery)}&limit=20`;
                const response = await fetch(apiUrl);
                const data = await response.json();

                if (response.ok) {
                    const articles = (data.articles || data.results || []).map(article => ({
                        title: article.title,
                        description: article.description || article.summary,
                        url: article.url || article.link,
                        urlToImage: article.image || article.thumbnail,
                        publishedAt: article.publishedAt || article.pubDate,
                        source: { name: article.source || 'Zyla' }
                    }));
                    allArticles.push(...articles);
                } else {
                    errors.push('Zyla: ' + (data.error || 'Failed'));
                }
            } catch (error) {
                errors.push('Zyla: ' + error.message);
            }
        }

        // Try Nexis API
        if (NEXIS_API_KEY && NEXIS_API_KEY !== 'YOUR_NEXIS_API_KEY_HERE') {
            try {
                const apiUrl = `https://api.nexis.com/v1/news/movies?api_key=${NEXIS_API_KEY}&query=${encodeURIComponent(searchQuery)}&limit=20`;
                const response = await fetch(apiUrl);
                const data = await response.json();

                if (response.ok) {
                    const articles = (data.articles || data.results || []).map(article => ({
                        title: article.title,
                        description: article.description || article.summary,
                        url: article.url || article.link,
                        urlToImage: article.image || article.thumbnail,
                        publishedAt: article.publishedAt || article.pubDate,
                        source: { name: article.source || 'Nexis' }
                    }));
                    allArticles.push(...articles);
                } else {
                    errors.push('Nexis: ' + (data.error || 'Failed'));
                }
            } catch (error) {
                errors.push('Nexis: ' + error.message);
            }
        }

        // If no articles from any API, return error
        if (allArticles.length === 0) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    error: 'No news articles found',
                    message: errors.length > 0 ? errors.join('; ') : 'All APIs failed or not configured'
                }),
            };
        }

        // Remove duplicates and sort by date
        const uniqueArticles = removeDuplicateArticles(allArticles);
        const sortedArticles = uniqueArticles.sort((a, b) => 
            new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0)
        );

        // Return the combined news data
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                status: 'ok',
                totalResults: sortedArticles.length,
                articles: sortedArticles
            }),
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
}

// Helper function to remove duplicate articles
function removeDuplicateArticles(articles) {
    const seen = new Set();
    return articles.filter(article => {
        const key = article.title?.toLowerCase() || '';
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
};
