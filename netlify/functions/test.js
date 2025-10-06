// Simple test function to verify Netlify functions are working
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

    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
            message: 'Netlify functions are working!',
            timestamp: new Date().toISOString(),
            method: event.httpMethod,
            path: event.path
        }),
    };
};
