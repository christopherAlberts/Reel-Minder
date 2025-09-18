// Script version that uses proxy API (for Vercel deployment)
// This version doesn't need API keys in the client

// Application State
let currentView = 'libraries';
let currentLibrary = null;
let libraries = [];
let searchResults = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    setupEventListeners();
    renderLibraries();
    displayRandomTagline();
});

// Data Management
function loadData() {
    const savedData = localStorage.getItem('reelMinderData');
    if (savedData) {
        const data = JSON.parse(savedData);
        libraries = data.libraries || [];
    }
}

function saveData() {
    const data = {
        libraries: libraries
    };
    localStorage.setItem('reelMinderData', JSON.stringify(data));
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Event Listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.id === 'dark-mode-toggle') return; // Skip dark mode button
            const view = this.dataset.view;
            if (view) {
                switchView(view);
            }
        });
    });

    // Library management
    document.getElementById('create-library-btn').addEventListener('click', openLibraryModal);
    document.getElementById('close-library-modal').addEventListener('click', closeLibraryModal);
    document.getElementById('library-form').addEventListener('submit', handleLibrarySubmit);
    document.getElementById('cancel-library-btn').addEventListener('click', closeLibraryModal);

    // Search
    document.getElementById('search-btn').addEventListener('click', performSearch);
    document.getElementById('search-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Movie modal
    document.getElementById('close-movie-modal').addEventListener('click', closeMovieModal);

    // Add to library modal
    document.getElementById('close-add-to-library-modal').addEventListener('click', closeAddToLibraryModal);
    document.getElementById('confirm-add-to-library-btn').addEventListener('click', addToLibrary);
    document.getElementById('cancel-add-to-library-btn').addEventListener('click', closeAddToLibraryModal);

    // Share modal
    document.getElementById('close-share-modal').addEventListener('click', function() {
        document.getElementById('share-modal').style.display = 'none';
    });

    // Dark mode toggle
    document.getElementById('dark-mode-toggle').addEventListener('click', toggleDarkMode);

    // Library sort
    document.getElementById('library-sort').addEventListener('change', function() {
        sortLibraries(this.value);
    });

    // Add movie to library button
    document.getElementById('add-movie-to-library-btn').addEventListener('click', openSearchFromLibrary);

    // Modal search
    document.getElementById('modal-search-btn').addEventListener('click', performModalSearch);
    document.getElementById('modal-search-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performModalSearch();
        }
    });
    document.getElementById('close-search-modal').addEventListener('click', closeSearchModal);

    // Movie sort in library detail
    document.getElementById('movie-sort').addEventListener('change', function() {
        sortMoviesInLibrary(this.value);
    });

    // Back to libraries
    document.getElementById('back-to-libraries-btn').addEventListener('click', function() {
        switchView('libraries');
    });

    // Edit and share library
    document.getElementById('edit-library-btn').addEventListener('click', editCurrentLibrary);
    document.getElementById('share-library-btn').addEventListener('click', shareCurrentLibrary);
}

// View Management
function switchView(viewName) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });

    // Show selected view
    document.getElementById(`${viewName}-view`).classList.add('active');

    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

    currentView = viewName;
}

function showLibraryDetail(libraryId) {
    const library = libraries.find(lib => lib.id === libraryId);
    if (!library) return;

    currentLibrary = library;
    document.getElementById('library-detail-title').textContent = library.name;
    document.getElementById('library-detail-count').textContent = `${library.movies.length} movies`;

    renderLibraryMovies();
    switchView('library-detail');
}

// Search Functions (using proxy API)
async function performSearch() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) return;

    const searchType = document.querySelector('input[name="search-type"]:checked').value;
    
    try {
        const response = await fetch(`/api/search?type=${searchType}&query=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.results) {
            searchResults = data.results;
            renderSearchResults();
        } else {
            console.error('Search failed:', data);
        }
    } catch (error) {
        console.error('Search error:', error);
    }
}

async function performModalSearch() {
    const query = document.getElementById('modal-search-input').value.trim();
    if (!query) return;

    const searchType = document.querySelector('input[name="modal-search-type"]:checked').value;
    
    try {
        const response = await fetch(`/api/search?type=${searchType}&query=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.results) {
            renderModalSearchResults(data.results);
        } else {
            console.error('Modal search failed:', data);
        }
    } catch (error) {
        console.error('Modal search error:', error);
    }
}

// Rest of the functions remain the same...
// (I'll include the key functions that need to be updated for proxy API)

async function fetchMovieDetails(movieId) {
    try {
        const response = await fetch(`/api/details?type=movie&id=${movieId}`);
        return await response.json();
    } catch (error) {
        console.error('Movie details error:', error);
        return null;
    }
}

async function fetchTVDetails(tvId) {
    try {
        const response = await fetch(`/api/details?type=tv&id=${tvId}`);
        return await response.json();
    } catch (error) {
        console.error('TV details error:', error);
        return null;
    }
}

async function fetchMovieVideos(movieId) {
    try {
        const response = await fetch(`/api/videos?type=movie&id=${movieId}`);
        return await response.json();
    } catch (error) {
        console.error('Movie videos error:', error);
        return null;
    }
}

async function fetchTVVideos(tvId) {
    try {
        const response = await fetch(`/api/videos?type=tv&id=${tvId}`);
        return await response.json();
    } catch (error) {
        console.error('TV videos error:', error);
        return null;
    }
}

// Display Random Tagline
function displayRandomTagline() {
    const taglines = [
        "Never forget a movie recommendation again!",
        "Keep track of the movies your friends swear by!",
        "Never say 'Yeah, I'll watch it' and forget again.",
        "Turn friendly peer pressure into your watchlist.",
        "Save yourself from asking, 'Wait… what was that movie again?'",
        "Finally, an app that remembers so you don't have to.",
        "For when your brain is full, but your watchlist isn't."
    ];
    
    const randomIndex = Math.floor(Math.random() * taglines.length);
    const taglineElement = document.getElementById('tagline');
    if (taglineElement) {
        taglineElement.textContent = taglines[randomIndex];
    }
}

// Note: This is a simplified version showing the proxy API approach
// You would need to copy the rest of the functions from script.js
// and update the API calls to use the proxy endpoints
