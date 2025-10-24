// Test function to debug news API issues
const NEWS_API_KEY = process.env.NEWS_API_KEY || 'YOUR_NEWS_API_KEY_HERE';
const APITUBE_API_KEY = process.env.APITUBE_API_KEY || 'YOUR_APITUBE_API_KEY_HERE';

exports.handler = async (event, context) => {
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

    try {
        // Test environment variables
        const envCheck = {
            NEWS_API_KEY: NEWS_API_KEY !== 'YOUR_NEWS_API_KEY_HERE' ? 'SET' : 'NOT_SET',
            APITUBE_API_KEY: APITUBE_API_KEY !== 'YOUR_APITUBE_API_KEY_HERE' ? 'SET' : 'NOT_SET',
            allEnvVars: Object.keys(process.env).filter(key => key.includes('API')).length
        };

        // Test NewsAPI directly
        let newsApiTest = null;
        if (NEWS_API_KEY !== 'YOUR_NEWS_API_KEY_HERE') {
            try {
                const response = await fetch(`https://newsapi.org/v2/everything?q=movie&sortBy=publishedAt&language=en&pageSize=5&apiKey=${NEWS_API_KEY}`);
                const data = await response.json();
                newsApiTest = {
                    status: response.status,
                    ok: response.ok,
                    hasArticles: data.articles ? data.articles.length : 0,
                    error: data.message || null
                };
            } catch (error) {
                newsApiTest = {
                    error: error.message
                };
            }
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: 'News API Debug Test',
                environment: envCheck,
                newsApiTest,
                timestamp: new Date().toISOString()
            }),
        };

    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Test failed',
                message: error.message,
                stack: error.stack
            }),
        };
    }
};
