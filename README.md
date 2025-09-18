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

1. Open `script.js` in a text editor
2. Find the line: `const TMDB_API_KEY = 'your_tmdb_api_key_here';`
3. Replace `'your_tmdb_api_key_here'` with your actual TMDB API key
4. Save the file

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

Feel free to contribute to this project by:
- Reporting bugs
- Suggesting new features
- Submitting pull requests
- Improving documentation

---

Enjoy organizing your movie and TV series collection with Reel Minder! 🎬✨


