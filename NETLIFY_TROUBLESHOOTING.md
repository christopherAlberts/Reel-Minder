# Netlify Troubleshooting Guide

## Common Issues and Solutions

### 1. Environment Variable Not Working
**Problem**: Added TMDB_API_KEY but still getting "API key not configured" error

**Solutions**:
- ✅ **Check variable name**: Must be exactly `TMDB_API_KEY` (case-sensitive)
- ✅ **Redeploy**: After adding env var, trigger a new deployment
- ✅ **Check scope**: Make sure it's set for "Production" environment
- ✅ **Verify value**: Copy your API key again to ensure no extra spaces

### 2. Functions Not Found (404 Error)
**Problem**: Getting 404 errors when calling `/api/search`

**Solutions**:
- ✅ **Check file structure**: Functions must be in `netlify/functions/` folder
- ✅ **Verify file names**: `search.js`, `details.js`, `videos.js`
- ✅ **Redeploy**: Push changes to trigger new deployment
- ✅ **Check Netlify logs**: Go to Functions tab in Netlify dashboard

### 3. CORS Errors
**Problem**: Browser blocking requests due to CORS policy

**Solutions**:
- ✅ **Check headers**: Functions include CORS headers
- ✅ **Test with curl**: `curl -X GET "https://your-site.netlify.app/api/search?type=movie&query=test"`
- ✅ **Check browser console**: Look for specific error messages

### 4. Function Timeout
**Problem**: Functions taking too long to respond

**Solutions**:
- ✅ **Check TMDB API**: Test your API key directly
- ✅ **Optimize queries**: Use specific search parameters
- ✅ **Check Netlify limits**: Free tier has timeout limits

## Testing Your Setup

### Step 1: Test Environment Variable
```bash
# In Netlify dashboard, go to Functions tab
# Look for your function logs
# Should see: "API key configured: true"
```

### Step 2: Test Function Directly
```bash
# Replace YOUR-SITE with your Netlify URL
curl "https://YOUR-SITE.netlify.app/api/search?type=movie&query=batman"
```

### Step 3: Test in Browser
1. Open browser developer tools (F12)
2. Go to Network tab
3. Try searching for a movie
4. Look for `/api/search` request
5. Check response status and data

## Debug Steps

### 1. Check Netlify Dashboard
- Go to your site dashboard
- Click "Functions" tab
- Look for any error logs
- Check deployment status

### 2. Check Environment Variables
- Go to Site Settings → Environment Variables
- Verify `TMDB_API_KEY` is listed
- Make sure it's set for "Production"

### 3. Test API Key Directly
```bash
# Test your TMDB API key directly
curl "https://api.themoviedb.org/3/search/movie?api_key=YOUR_API_KEY&query=test"
```

### 4. Check Function Logs
- In Netlify dashboard, go to Functions
- Click on a function name
- Check the logs for errors
- Look for "API key not configured" messages

## Quick Fixes

### If Still Not Working:
1. **Delete and recreate** the environment variable
2. **Redeploy** your site (trigger new deployment)
3. **Check function names** match exactly
4. **Verify API key** works with TMDB directly
5. **Check Netlify status** (sometimes they have outages)

### Emergency Fallback:
If Netlify functions still don't work, you can:
1. **Use GitHub Pages** with user API keys
2. **Switch to Vercel** (already configured)
3. **Use direct TMDB API** calls (less secure)

## Getting Help

If you're still having issues:
1. **Check Netlify community** forums
2. **Look at function logs** in Netlify dashboard
3. **Test with a simple function** first
4. **Verify your TMDB API key** is valid
