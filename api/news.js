// News API endpoint for Reel Minder
// This handles news requests and proxies them to multiple news APIs to avoid CORS issues

const NEWS_API_KEY = process.env.NEWS_API_KEY || 'YOUR_NEWS_API_KEY_HERE';
const APITUBE_API_KEY = process.env.APITUBE_API_KEY || 'YOUR_APITUBE_API_KEY_HERE';
const NEXIS_API_KEY = process.env.NEXIS_API_KEY || 'YOUR_NEXIS_API_KEY_HERE';
const ZYLA_API_KEY = process.env.ZYLA_API_KEY || 'YOUR_ZYLA_API_KEY_HERE';

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
        const { query, category, page = '1' } = req.query;

        // Build search query based on category or provided query
        let searchQuery = query || '';
        if (!searchQuery && category) {
            switch(category) {
                case 'movies':
                    searchQuery = '("movie" OR "film" OR "cinema" OR "box office" OR "Hollywood" OR "blockbuster" OR "premiere" OR "trailer" OR "sequel" OR "franchise" OR "oscar" OR "golden globe" OR "film festival" OR "red carpet" OR "casting" OR "script" OR "screenplay") AND ("entertainment" OR "hollywood" OR "film industry" OR "movie industry") AND NOT ("politics" OR "sports" OR "business" OR "technology" OR "science" OR "finance" OR "education" OR "health" OR "travel" OR "fashion" OR "gaming" OR "real estate" OR "automotive")';
                    break;
                case 'tv':
                    searchQuery = '("TV show" OR "television series" OR "streaming" OR "Netflix" OR "HBO" OR "Disney+" OR "Amazon Prime" OR "episode" OR "season" OR "premiere" OR "emmy" OR "television" OR "series" OR "episode") AND ("entertainment" OR "television industry" OR "streaming" OR "tv industry") AND NOT ("politics" OR "sports" OR "business" OR "technology" OR "science" OR "finance" OR "education" OR "health" OR "travel" OR "fashion" OR "gaming" OR "real estate" OR "automotive")';
                    break;
                case 'celebrities':
                    searchQuery = '("actor" OR "actress" OR "director" OR "producer" OR "celebrity" OR "Hollywood star" OR "movie star" OR "film star" OR "entertainment industry" OR "red carpet" OR "awards" OR "oscar" OR "emmy") AND ("entertainment" OR "hollywood" OR "film industry" OR "movie industry" OR "television industry") AND NOT ("politics" OR "sports" OR "business" OR "technology" OR "science" OR "finance" OR "education" OR "health" OR "travel" OR "fashion" OR "gaming" OR "real estate" OR "automotive")';
                    break;
                default:
                    searchQuery = '("movie" OR "film" OR "TV show" OR "television" OR "celebrity" OR "actor" OR "actress" OR "Hollywood" OR "entertainment" OR "cinema" OR "streaming" OR "oscar" OR "emmy" OR "golden globe" OR "film festival" OR "red carpet") AND ("entertainment industry" OR "hollywood" OR "film industry" OR "movie industry" OR "television industry") AND NOT ("politics" OR "sports" OR "business" OR "technology" OR "science" OR "finance" OR "education" OR "health" OR "travel" OR "fashion" OR "gaming" OR "real estate" OR "automotive")';
            }
        }

        if (!searchQuery) {
            searchQuery = '("movie" OR "film" OR "TV show" OR "television" OR "celebrity" OR "actor" OR "actress" OR "Hollywood" OR "entertainment" OR "cinema" OR "streaming" OR "oscar" OR "emmy" OR "golden globe" OR "film festival" OR "red carpet") AND ("entertainment industry" OR "hollywood" OR "film industry" OR "movie industry" OR "television industry") AND NOT ("politics" OR "sports" OR "business" OR "technology" OR "science" OR "finance" OR "education" OR "health" OR "travel" OR "fashion" OR "gaming" OR "real estate" OR "automotive")';
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
            return res.status(500).json({ 
                error: 'No news articles found',
                message: errors.length > 0 ? errors.join('; ') : 'All APIs failed or not configured'
            });
        }

        // Remove duplicates and sort by date
        const uniqueArticles = removeDuplicateArticles(allArticles);
        const sortedArticles = uniqueArticles.sort((a, b) => 
            new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0)
        );

        // Return the combined news data
        res.status(200).json({
            status: 'ok',
            totalResults: sortedArticles.length,
            articles: sortedArticles
        });

    } catch (error) {
        console.error('News API error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch news',
            message: error.message 
        });
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
}
