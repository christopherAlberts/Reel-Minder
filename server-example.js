// Example Node.js proxy server
// This would run on your own server, not GitHub Pages

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Your API key stays secure on the server
const TMDB_API_KEY = process.env.TMDB_API_KEY; // From environment variables
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

app.use(cors());
app.use(express.json());

// Proxy endpoint for movie search
app.get('/api/search/movie', async (req, res) => {
    try {
        const { query } = req.query;
        const response = await fetch(`${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Search failed' });
    }
});

// Proxy endpoint for TV search
app.get('/api/search/tv', async (req, res) => {
    try {
        const { query } = req.query;
        const response = await fetch(`${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Search failed' });
    }
});

app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
});
