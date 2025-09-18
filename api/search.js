// Vercel API function for TMDB search
// This keeps your API key secure on the server

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { type, query } = req.query;

    if (!type || !query) {
        return res.status(400).json({ error: 'Missing type or query parameter' });
    }

    if (!['movie', 'tv'].includes(type)) {
        return res.status(400).json({ error: 'Type must be movie or tv' });
    }

    try {
        const TMDB_API_KEY = process.env.TMDB_API_KEY;
        
        if (!TMDB_API_KEY) {
            return res.status(500).json({ error: 'API key not configured' });
        }

        const response = await fetch(
            `https://api.themoviedb.org/3/search/${type}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
        );

        if (!response.ok) {
            throw new Error(`TMDB API error: ${response.status}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
}
