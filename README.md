# Reel Minder - Movie & TV Series Tracker

A modern web application for organizing and tracking movies and TV series you want to watch. Create custom libraries, search for content using The Movie Database (TMDB) API, and share your collections with others.

## Features

- 🎬 **Custom Libraries**: Create, edit, and manage multiple libraries for different categories
- 🔍 **Smart Search**: Search for movies and TV series using TMDB API with detailed information
- 📱 **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- 🎥 **Movie Details**: View comprehensive information including posters, ratings, and overviews
- 🎞️ **Trailer Support**: Watch trailers directly from YouTube
- 📤 **Sharing**: Share individual movies or entire libraries with others
- 💾 **Local Storage**: All data is saved locally in your browser
- 🎨 **Modern UI**: Beautiful, intuitive interface with smooth animations

## Setup Instructions

### 1. Get TMDB API Key

1. Visit [The Movie Database (TMDB)](https://www.themoviedb.org/)
2. Create a free account
3. Go to [API Settings](https://www.themoviedb.org/settings/api)
4. Request an API key (it's free and usually approved instantly)
5. Copy your API key

### 2. Configure the Application

1. Copy `config.example.js` to `config.js`
2. Open `config.js` in a text editor
3. Replace `'your_tmdb_api_key_here'` with your actual TMDB API key
4. Save the file

**Security Note**: The `config.js` file is included in `.gitignore` to prevent your API key from being committed to version control. This keeps your API key secure when sharing your code publicly.

### 3. Run the Application

1. Open `index.html` in your web browser
2. Start creating libraries and adding movies!

## How to Use

### Creating Libraries
1. Click "Create Library" on the main page
2. Enter a name and optional description
3. Click "Save Library"

### Adding Movies/TV Series
1. Switch to the "Search" tab
2. Enter a movie or TV series name
3. Select the type (Movies, TV Series, or All)
4. Click search or press Enter
5. Click "Add to Library" on any result
6. Select which library to add it to

### Managing Your Collection
1. Click on any library to view its contents
2. Click on movies to view detailed information
3. Watch trailers, share movies, or remove items
4. Edit or delete libraries as needed

### Sharing
- **Share Movies**: Click the share button on any movie
- **Share Libraries**: Click "Share" in the library view
- **Share Links**: Copy links to share with others

## Technical Details

- **Frontend**: Pure HTML, CSS, and JavaScript (no frameworks required)
- **API**: The Movie Database (TMDB) API for movie/TV data
- **Storage**: Browser localStorage for data persistence
- **Images**: TMDB image service for posters and backdrops
- **Trailers**: YouTube integration for trailer playback

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers

## Data Storage

All your data is stored locally in your browser's localStorage. This means:
- ✅ Your data stays private
- ✅ No internet required after initial setup
- ⚠️ Data is tied to your browser/device
- ⚠️ Clearing browser data will remove your collections

## Troubleshooting

### Search Not Working
- Verify your TMDB API key is correctly set in `script.js`
- Check your internet connection
- Ensure the API key has proper permissions

### Images Not Loading
- This is usually due to TMDB's image service being temporarily unavailable
- The app will show placeholder images as fallback

### Sharing Not Working
- Make sure you're using HTTPS or localhost
- Some browsers may block sharing features on HTTP

## Future Enhancements

Potential features for future versions:
- User accounts and cloud sync
- Recommendations based on your preferences
- Integration with streaming services
- Export/import functionality
- Advanced filtering and sorting
- Watch status tracking

## License

This project is open source and available under the MIT License.

## Contributing

## Deployment Options

### Option 1: GitHub Pages (Static Only)
**Limitation**: Requires users to add their own API key
1. Push your code to a GitHub repository
2. Go to repository Settings → Pages
3. Select source branch (usually `main`)
4. Your site will be available at `https://yourusername.github.io/repository-name`

### Option 2: Vercel (Recommended - Secure API Key)
**Benefit**: Your API key stays secure, works for all users

#### Vercel Setup Process:
1. **Sign up** at [Vercel](https://vercel.com) with your GitHub account
2. **Click "New Project"** and import your GitHub repository
3. **Configure Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add new variable: `TMDB_API_KEY`
   - Set value to your actual TMDB API key
   - Make sure it's available for Production, Preview, and Development
4. **Deploy**: Vercel will automatically deploy your project
5. **Your site is live** at `https://your-project-name.vercel.app`

#### After Deployment:
- ✅ **API key is secure** on Vercel's servers
- ✅ **Website works for all users** without setup
- ✅ **Automatic deployments** on code changes
- ✅ **Custom domain** available (optional)

#### Code Changes Made:
- ✅ **Updated `script.js`** to use Vercel API endpoints (`/api/search`, `/api/details`, `/api/videos`)
- ✅ **Removed client-side API key** requirements
- ✅ **Added error handling** for API calls
- ✅ **Ready for production** deployment

### Option 3: Other Hosting Services
- **Netlify**: Use Netlify Functions for API proxy
- **Railway**: Deploy with full Node.js support
- **Render**: Free tier with backend support

## Security Features

### For Repository Owners:
- ✅ **API key stays secure** on server (Vercel/Railway/etc.)
- ✅ **No client-side exposure** of sensitive data
- ✅ **Works for all users** without configuration

### For Repository Users:
- ✅ **No setup required** - just visit the website
- ✅ **Full functionality** out of the box
- ✅ **Secure by default**

Feel free to contribute to this project by:
- Reporting bugs
- Suggesting new features
- Submitting pull requests
- Improving documentation

---

Enjoy organizing your movie and TV series collection with Reel Minder! 🎬✨


