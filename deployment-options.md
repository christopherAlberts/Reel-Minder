# Deployment Options for Reel Minder

## Free Hosting Services with Backend Support

### 1. Vercel (Recommended)
- **Free tier**: Generous limits
- **Serverless functions**: Perfect for API proxy
- **Easy deployment**: Connect GitHub repo
- **Custom domain**: Free SSL

**Setup:**
1. Create `api/search.js` in your repo
2. Deploy to Vercel
3. Update frontend to use Vercel API endpoints

### 2. Netlify Functions
- **Free tier**: 100GB bandwidth/month
- **Serverless functions**: Built-in support
- **GitHub integration**: Auto-deploy
- **Form handling**: Built-in

### 3. Railway
- **Free tier**: $5 credit/month
- **Full Node.js support**: Express apps
- **Database support**: PostgreSQL
- **Easy deployment**: GitHub integration

### 4. Render
- **Free tier**: 750 hours/month
- **Full backend support**: Any language
- **Auto-deploy**: From GitHub
- **Custom domains**: Free SSL

## Example Vercel API Function

Create `api/search.js`:
```javascript
export default async function handler(req, res) {
    const { type, query } = req.query;
    const TMDB_API_KEY = process.env.TMDB_API_KEY;
    
    const response = await fetch(
        `https://api.themoviedb.org/3/search/${type}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
    );
    
    const data = await response.json();
    res.json(data);
}
```

## Environment Variables
Set `TMDB_API_KEY` in your hosting service's environment variables section.
