// Simple test function to verify Netlify functions are working
exports.handler = async (event, context) => {
    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: 'Hello from Netlify Functions!',
            timestamp: new Date().toISOString(),
            event: {
                httpMethod: event.httpMethod,
                path: event.path,
                queryStringParameters: event.queryStringParameters
            }
        }),
    };
};
