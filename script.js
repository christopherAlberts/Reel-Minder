// TMDB API Configuration
const TMDB_API_KEY = window.CONFIG?.TMDB_API_KEY || 'your_tmdb_api_key_here';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

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
    } else {
        // Create default library
        libraries = [{
            id: generateId(),
            name: 'My Watchlist',
            description: 'Movies and TV series I want to watch',
            movies: [],
            createdAt: new Date().toISOString()
        }];
        saveData();
    }
}

function saveData() {
    const data = {
        libraries: libraries,
        lastUpdated: new Date().toISOString()
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
        btn.addEventListener('click', (e) => {
            // Skip dark mode button
            if (btn.id === 'dark-mode-toggle') return;
            
            const view = e.target.closest('.nav-btn').dataset.view;
            switchView(view);
        });
    });

    // Library Management
    const createBtn = document.getElementById('create-library-btn');
    if (createBtn) {
        createBtn.addEventListener('click', function(e) {
            console.log('Create library button clicked');
            openLibraryModal();
        });
    } else {
        console.error('Create library button not found');
    }

    // Library Sorting
    document.getElementById('library-sort').addEventListener('change', function(e) {
        sortLibraries(e.target.value);
    });
    document.getElementById('close-library-modal').addEventListener('click', closeLibraryModal);
    document.getElementById('cancel-library').addEventListener('click', closeLibraryModal);
    document.getElementById('library-form').addEventListener('submit', handleLibrarySubmit);

    // Library Detail View
    document.getElementById('back-to-libraries').addEventListener('click', () => switchView('libraries'));
    document.getElementById('add-movie-to-library-btn').addEventListener('click', openSearchFromLibrary);
    document.getElementById('edit-library-btn').addEventListener('click', editCurrentLibrary);
    document.getElementById('delete-library-btn').addEventListener('click', deleteCurrentLibrary);
    document.getElementById('share-library-btn').addEventListener('click', shareCurrentLibrary);
    
    // Movie Sorting in Library
    document.getElementById('movie-sort').addEventListener('change', function(e) {
        sortMoviesInLibrary(e.target.value);
    });

    // Dark Mode Toggle
    document.getElementById('dark-mode-toggle').addEventListener('click', toggleDarkMode);

    // Search
    document.getElementById('search-btn').addEventListener('click', performSearch);
    document.getElementById('search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Modal Search
    document.getElementById('modal-search-btn').addEventListener('click', performModalSearch);
    document.getElementById('modal-search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performModalSearch();
        }
    });
    document.getElementById('close-search-modal').addEventListener('click', closeSearchModal);

    // Movie Modal
    document.getElementById('close-movie-modal').addEventListener('click', closeMovieModal);

    // Add to Library Modal
    document.getElementById('close-add-to-library-modal').addEventListener('click', closeAddToLibraryModal);

    // Share Modal
    document.getElementById('close-share-modal').addEventListener('click', closeShareModal);

    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// View Management
function switchView(viewName) {
    console.log('Switching to view:', viewName);
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const navBtn = document.querySelector(`[data-view="${viewName}"]`);
    if (navBtn) {
        navBtn.classList.add('active');
    }

    // Update views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    const targetView = document.getElementById(`${viewName}-view`);
    if (targetView) {
        targetView.classList.add('active');
        console.log('View activated:', viewName);
    } else {
        console.error('View not found:', viewName);
    }

    currentView = viewName;

    // Load appropriate content
    if (viewName === 'libraries') {
        renderLibraries();
    } else if (viewName === 'search') {
        // Clear search results
        document.getElementById('search-results').innerHTML = '';
    }
}

function showLibraryDetail(libraryId) {
    console.log('showLibraryDetail called with ID:', libraryId);
    currentLibrary = libraries.find(lib => lib.id === libraryId);
    console.log('Found library:', currentLibrary);
    if (!currentLibrary) {
        console.error('Library not found with ID:', libraryId);
        return;
    }

    document.getElementById('library-title').textContent = currentLibrary.name;
    renderLibraryMovies();
    switchView('library-detail');
    console.log('Library detail view should now be active');
}

// Library Management
function sortLibraries(sortBy) {
    let sortedLibraries = [...libraries];
    
    switch(sortBy) {
        case 'name':
            sortedLibraries.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'recent':
            sortedLibraries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'movies':
            sortedLibraries.sort((a, b) => b.movies.length - a.movies.length);
            break;
    }
    
    renderLibraries(sortedLibraries);
}

function renderLibraries(librariesToRender = libraries) {
    const grid = document.getElementById('libraries-grid');
    
    if (librariesToRender.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <h3>No Libraries Yet</h3>
                <p>Create your first library to start organizing your movies and TV series!</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = librariesToRender.map(library => {
        const moviePreviews = library.movies.slice(0, 4); // Show up to 4 movie previews
        const remainingCount = Math.max(0, library.movies.length - 4);
        
        return `
            <div class="library-card" onclick="showLibraryDetail('${library.id}')">
                <div class="library-card-header">
                    <div>
                        <div class="library-name">${library.name}</div>
                        <div class="library-count">${library.movies.length} items</div>
                    </div>
                    <div class="library-actions-card">
                        <button class="btn btn-secondary" onclick="event.stopPropagation(); editLibrary('${library.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger" onclick="event.stopPropagation(); deleteLibrary('${library.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                ${library.movies.length > 0 ? `
                    <div class="library-preview">
                        <div class="movie-previews">
                            ${moviePreviews.map(movie => `
                                <div class="movie-preview">
                                    <img src="${movie.poster_path ? TMDB_IMAGE_BASE_URL + movie.poster_path : 'https://via.placeholder.com/100x150?text=No+Image'}" 
                                         alt="${movie.title}" 
                                         onerror="this.src='https://via.placeholder.com/100x150?text=No+Image'">
                                    <div class="movie-preview-overlay">
                                        <div class="movie-rating">
                                            <i class="fas fa-star"></i>
                                            ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                            ${remainingCount > 0 ? `
                                <div class="more-movies">
                                    <div class="more-count">+${remainingCount}</div>
                                    <div class="more-text">more</div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                ` : `
                    <div class="library-empty">
                        <i class="fas fa-film"></i>
                        <p>No movies yet</p>
                    </div>
                `}
                
                <div class="library-description">${library.description || 'No description'}</div>
            </div>
        `;
    }).join('');
}

function openLibraryModal(libraryId = null) {
    const modal = document.getElementById('library-modal');
    const form = document.getElementById('library-form');
    const title = document.getElementById('library-modal-title');
    
    if (libraryId) {
        const library = libraries.find(lib => lib.id === libraryId);
        title.textContent = 'Edit Library';
        document.getElementById('library-name').value = library.name;
        document.getElementById('library-description').value = library.description || '';
        form.dataset.libraryId = libraryId;
    } else {
        title.textContent = 'Create Library';
        form.reset();
        delete form.dataset.libraryId;
    }
    
    modal.classList.add('active');
}

function closeLibraryModal() {
    document.getElementById('library-modal').classList.remove('active');
}

function handleLibrarySubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('library-name').value.trim();
    const description = document.getElementById('library-description').value.trim();
    const libraryId = e.target.dataset.libraryId;
    
    if (!name) {
        alert('Please enter a library name');
        return;
    }
    
    if (libraryId) {
        // Edit existing library
        const library = libraries.find(lib => lib.id === libraryId);
        library.name = name;
        library.description = description;
    } else {
        // Create new library
        const newLibrary = {
            id: generateId(),
            name: name,
            description: description,
            movies: [],
            createdAt: new Date().toISOString()
        };
        libraries.push(newLibrary);
    }
    
    saveData();
    renderLibraries();
    closeLibraryModal();
}

function editLibrary(libraryId) {
    openLibraryModal(libraryId);
}

function deleteLibrary(libraryId) {
    if (confirm('Are you sure you want to delete this library? This action cannot be undone.')) {
        libraries = libraries.filter(lib => lib.id !== libraryId);
        saveData();
        renderLibraries();
    }
}

function editCurrentLibrary() {
    if (currentLibrary) {
        openLibraryModal(currentLibrary.id);
    }
}

function deleteCurrentLibrary() {
    if (currentLibrary && confirm('Are you sure you want to delete this library? This action cannot be undone.')) {
        libraries = libraries.filter(lib => lib.id !== currentLibrary.id);
        saveData();
        switchView('libraries');
    }
}

// Search Functionality
async function performSearch() {
    const query = document.getElementById('search-input').value.trim();
    const mediaType = document.getElementById('media-type').value;
    
    if (!query) {
        alert('Please enter a search term');
        return;
    }
    
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        let results = [];
        
        if (mediaType === 'all' || mediaType === 'movie') {
            const movieResults = await searchMovies(query);
            results = results.concat(movieResults.map(movie => ({ ...movie, media_type: 'movie' })));
        }
        
        if (mediaType === 'all' || mediaType === 'tv') {
            const tvResults = await searchTVShows(query);
            results = results.concat(tvResults.map(tv => ({ ...tv, media_type: 'tv' })));
        }
        
        searchResults = results;
        renderSearchResults(results);
    } catch (error) {
        console.error('Search error:', error);
        resultsContainer.innerHTML = '<div class="empty-state"><h3>Search Error</h3><p>Failed to search for movies and TV shows. Please try again.</p></div>';
    }
}

async function searchMovies(query) {
    const response = await fetch(`${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`);
    const data = await response.json();
    return data.results || [];
}

async function searchTVShows(query) {
    const response = await fetch(`${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`);
    const data = await response.json();
    return data.results || [];
}

function renderSearchResults(results) {
    const container = document.getElementById('search-results');
    
    if (results.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>No Results Found</h3><p>Try a different search term.</p></div>';
        return;
    }
    
    container.innerHTML = results.map(item => {
        const releaseYear = item.release_date ? new Date(item.release_date).getFullYear() : item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A';
        const overview = item.overview ? (item.overview.length > 100 ? item.overview.substring(0, 100) + '...' : item.overview) : 'No overview available';
        
        return `
            <div class="movie-card" onclick="showMovieDetails(${item.id}, '${item.media_type}')">
                <img src="${item.poster_path ? TMDB_IMAGE_BASE_URL + item.poster_path : 'https://via.placeholder.com/300x450?text=No+Image'}" 
                     alt="${item.title || item.name}" 
                     class="movie-poster"
                     onerror="this.src='https://via.placeholder.com/300x450?text=No+Image'">
                <div class="movie-info">
                    <div class="movie-title">${item.title || item.name}</div>
                    <div class="movie-year">${releaseYear}</div>
                    <div class="movie-rating">
                        <i class="fas fa-star"></i>
                        ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}
                    </div>
                    <div class="movie-meta">
                        <div class="movie-type">
                            <i class="fas ${item.media_type === 'movie' ? 'fa-film' : 'fa-tv'}"></i>
                            ${item.media_type === 'movie' ? 'Movie' : 'TV Series'}
                        </div>
                    </div>
                    <div class="movie-overview">
                        <p>${overview}</p>
                    </div>
                    <div class="movie-actions">
                        <button class="btn btn-primary" onclick="event.stopPropagation(); addToLibrary(${item.id}, '${item.media_type}')">
                            <i class="fas fa-plus"></i>
                            Add to Library
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Movie Management
function addToLibrary(movieId, mediaType) {
    const movie = searchResults.find(item => item.id === movieId && item.media_type === mediaType);
    if (!movie) return;
    
    const modal = document.getElementById('add-to-library-modal');
    const container = document.getElementById('add-to-library-list');
    
    container.innerHTML = libraries.map(library => `
        <div class="library-item" onclick="selectLibraryForMovie('${library.id}', ${movieId}, '${mediaType}')">
            <div class="library-item-info">
                <h4>${library.name}</h4>
                <p>${library.movies.length} items</p>
            </div>
        </div>
    `).join('');
    
    modal.classList.add('active');
}

function selectLibraryForMovie(libraryId, movieId, mediaType) {
    const movie = searchResults.find(item => item.id === movieId && item.media_type === mediaType);
    if (!movie) return;
    
    const library = libraries.find(lib => lib.id === libraryId);
    if (!library) return;
    
    // Check if movie already exists in library
    const existingMovie = library.movies.find(m => m.id === movieId && m.media_type === mediaType);
    if (existingMovie) {
        alert('This movie is already in the selected library');
        closeAddToLibraryModal();
        return;
    }
    
    // Add movie to library
    const movieData = {
        id: movie.id,
        title: movie.title || movie.name,
        overview: movie.overview,
        poster_path: movie.poster_path,
        vote_average: movie.vote_average,
        release_date: movie.release_date || movie.first_air_date,
        media_type: mediaType,
        addedAt: new Date().toISOString(),
        watched: false
    };
    
    library.movies.push(movieData);
    saveData();
    
    // Update UI if we're viewing this library
    if (currentLibrary && currentLibrary.id === libraryId) {
        renderLibraryMovies();
    }
    
    closeAddToLibraryModal();
    alert('Movie added to library successfully!');
}

function closeAddToLibraryModal() {
    document.getElementById('add-to-library-modal').classList.remove('active');
}

// Search Modal Functions
function openSearchFromLibrary() {
    console.log('Opening search modal from library');
    const modal = document.getElementById('search-modal');
    const input = document.getElementById('modal-search-input');
    
    // Clear previous search
    input.value = '';
    document.getElementById('modal-search-results').innerHTML = '';
    
    modal.classList.add('active');
    input.focus();
}

function closeSearchModal() {
    document.getElementById('search-modal').classList.remove('active');
}

async function performModalSearch() {
    const query = document.getElementById('modal-search-input').value.trim();
    const mediaType = document.getElementById('modal-media-type').value;
    
    if (!query) {
        alert('Please enter a search term');
        return;
    }
    
    const resultsContainer = document.getElementById('modal-search-results');
    resultsContainer.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        let results = [];
        
        if (mediaType === 'all' || mediaType === 'movie') {
            const movieResults = await searchMovies(query);
            results = results.concat(movieResults.map(movie => ({ ...movie, media_type: 'movie' })));
        }
        
        if (mediaType === 'all' || mediaType === 'tv') {
            const tvResults = await searchTVShows(query);
            results = results.concat(tvResults.map(tv => ({ ...tv, media_type: 'tv' })));
        }
        
        renderModalSearchResults(results);
    } catch (error) {
        console.error('Modal search error:', error);
        resultsContainer.innerHTML = '<div class="empty-state"><h3>Search Error</h3><p>Failed to search for movies and TV shows. Please try again.</p></div>';
    }
}

function renderModalSearchResults(results) {
    const container = document.getElementById('modal-search-results');
    
    if (results.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>No Results Found</h3><p>Try a different search term.</p></div>';
        return;
    }
    
    container.innerHTML = results.map(item => `
        <div class="movie-card" onclick="showMovieDetails(${item.id}, '${item.media_type}')">
            <img src="${item.poster_path ? TMDB_IMAGE_BASE_URL + item.poster_path : 'https://via.placeholder.com/300x450?text=No+Image'}" 
                 alt="${item.title || item.name}" 
                 class="movie-poster"
                 onerror="this.src='https://via.placeholder.com/300x450?text=No+Image'">
            <div class="movie-info">
                <div class="movie-title">${item.title || item.name}</div>
                <div class="movie-year">${item.release_date ? new Date(item.release_date).getFullYear() : item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A'}</div>
                <div class="movie-rating">
                    <i class="fas fa-star"></i>
                    ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}
                </div>
                <div class="movie-actions">
                    <button class="btn btn-primary" onclick="event.stopPropagation(); addToCurrentLibrary(${item.id}, '${item.media_type}')">
                        <i class="fas fa-plus"></i>
                        Add to Library
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function addToCurrentLibrary(movieId, mediaType) {
    if (!currentLibrary) {
        alert('No library selected');
        return;
    }
    
    // Get the movie data from the modal search results
    const movieCard = document.querySelector(`#modal-search-results .movie-card[onclick*="${movieId}"]`);
    if (!movieCard) {
        alert('Movie data not found');
        return;
    }
    
    const img = movieCard.querySelector('img');
    const title = movieCard.querySelector('.movie-title').textContent;
    const year = movieCard.querySelector('.movie-year').textContent;
    const rating = movieCard.querySelector('.movie-rating').textContent.trim();
    
    // Check if movie already exists in library
    const existingMovie = currentLibrary.movies.find(m => m.id === movieId && m.media_type === mediaType);
    if (existingMovie) {
        alert('This movie is already in the library');
        return;
    }
    
    // Add movie to library
    const movieData = {
        id: movieId,
        title: title,
        overview: 'Overview not available in search results',
        poster_path: img.src.includes('placeholder') ? null : img.src.replace(TMDB_IMAGE_BASE_URL, ''),
        vote_average: parseFloat(rating.replace('★', '').trim()) || 0,
        release_date: year === 'N/A' ? null : year,
        media_type: mediaType,
        addedAt: new Date().toISOString(),
        watched: false
    };
    
    currentLibrary.movies.push(movieData);
    saveData();
    
    // Update UI
    renderLibraryMovies();
    
    alert('Movie added to library successfully!');
}

function sortMoviesInLibrary(sortBy) {
    if (!currentLibrary) return;
    
    let sortedMovies = [...currentLibrary.movies];
    
    switch(sortBy) {
        case 'name':
            sortedMovies.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'recent':
            sortedMovies.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
            break;
        case 'rating':
            sortedMovies.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
            break;
    }
    
    renderLibraryMovies(sortedMovies);
}

function renderLibraryMovies(moviesToRender = null) {
    if (!currentLibrary) return;
    
    const movies = moviesToRender || currentLibrary.movies;
    const container = document.getElementById('library-movies');
    
    if (movies.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-film"></i>
                <h3>No Movies Yet</h3>
                <p>Search for movies and TV series to add to this library!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = movies.map(movie => {
        const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
        const addedDate = movie.addedAt ? new Date(movie.addedAt).toLocaleDateString() : 'N/A';
        
        return `
            <div class="movie-card ${movie.watched ? 'watched' : ''}" onclick="showMovieDetails(${movie.id}, '${movie.media_type}')">
                <img src="${movie.poster_path ? TMDB_IMAGE_BASE_URL + movie.poster_path : 'https://via.placeholder.com/300x450?text=No+Image'}" 
                     alt="${movie.title}" 
                     class="movie-poster"
                     onerror="this.src='https://via.placeholder.com/300x450?text=No+Image'">
                <div class="movie-info">
                    <div class="movie-title">${movie.title}</div>
                    <div class="movie-year">${releaseYear}</div>
                    <div class="movie-rating">
                        <i class="fas fa-star"></i>
                        ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}
                    </div>
                    <div class="movie-meta">
                        <div class="movie-type">
                            <i class="fas ${movie.media_type === 'movie' ? 'fa-film' : 'fa-tv'}"></i>
                            ${movie.media_type === 'movie' ? 'Movie' : 'TV Series'}
                        </div>
                        <div class="movie-added">
                            <i class="fas fa-plus-circle"></i>
                            Added ${addedDate}
                        </div>
                    </div>
                    <div class="movie-actions">
                        <button class="btn ${movie.watched ? 'btn-success' : 'btn-watched'}" onclick="event.stopPropagation(); toggleWatched(${movie.id}, '${movie.media_type}', ${!movie.watched})">
                            <i class="fas ${movie.watched ? 'fa-check-circle' : 'fa-eye'}"></i>
                            Watched
                        </button>
                        <button class="btn btn-danger" onclick="event.stopPropagation(); removeFromLibrary(${movie.id}, '${movie.media_type}')">
                            <i class="fas fa-trash"></i>
                            Remove
                        </button>
                        <button class="btn btn-watched" onclick="event.stopPropagation(); shareMovie(${movie.id}, '${movie.media_type}')">
                            <i class="fas fa-share"></i>
                            Share
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function removeFromLibrary(movieId, mediaType) {
    if (!currentLibrary) return;
    
    if (confirm('Are you sure you want to remove this movie from the library?')) {
        currentLibrary.movies = currentLibrary.movies.filter(movie => !(movie.id === movieId && movie.media_type === mediaType));
        saveData();
        renderLibraryMovies();
    }
}

// Movie Details
async function showMovieDetails(movieId, mediaType) {
    const modal = document.getElementById('movie-modal');
    const container = document.getElementById('movie-detail-content');
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    modal.classList.add('active');
    
    try {
        let movieData, videos;
        
        if (mediaType === 'movie') {
            movieData = await fetchMovieDetails(movieId);
            videos = await fetchMovieVideos(movieId);
        } else {
            movieData = await fetchTVDetails(movieId);
            videos = await fetchTVVideos(movieId);
        }
        
        const trailer = videos.results.find(video => video.type === 'Trailer' && video.site === 'YouTube');
        
        const releaseDate = movieData.release_date || movieData.first_air_date;
        const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
        const runtime = movieData.runtime || (movieData.episode_run_time && movieData.episode_run_time[0]);
        const genres = movieData.genres ? movieData.genres.map(g => g.name).join(', ') : 'N/A';
        const productionCompanies = movieData.production_companies ? movieData.production_companies.slice(0, 3).map(c => c.name).join(', ') : 'N/A';
        const spokenLanguages = movieData.spoken_languages ? movieData.spoken_languages.slice(0, 3).map(l => l.name).join(', ') : 'N/A';
        const status = movieData.status || 'N/A';
        const budget = movieData.budget ? `$${movieData.budget.toLocaleString()}` : 'N/A';
        const revenue = movieData.revenue ? `$${movieData.revenue.toLocaleString()}` : 'N/A';
        
        // Check if this movie is in any library and if it's watched
        let watchedStatus = '';
        let isInLibrary = false;
        let libraryMovie = null;
        if (currentLibrary) {
            libraryMovie = currentLibrary.movies.find(m => m.id === movieId && m.media_type === mediaType);
            if (libraryMovie) {
                isInLibrary = true;
                watchedStatus = libraryMovie.watched ? '<div class="watched-status"><i class="fas fa-check-circle"></i> Watched</div>' : '<div class="watched-status"><i class="fas fa-clock"></i> Not Watched</div>';
            }
        }
        
        const shareButtonHtml = `<button class="btn btn-secondary share-btn" onclick="shareMovieFromDetails(${movieId}, '${mediaType}')"><i class="fas fa-share"></i> Share</button>`;
        const trailerButtonHtml = trailer ? `<button class="btn btn-primary watch-trailer-btn" onclick="openTrailer('${trailer.key}')"><i class="fas fa-play"></i> Watch Trailer</button>` : '';
        const watchedToggleHtml = isInLibrary ? `<button class="btn ${libraryMovie.watched ? 'btn-success' : 'btn-watched'}" onclick="toggleWatchedFromDetails(${movieId}, '${mediaType}', ${!libraryMovie.watched})"><i class="fas ${libraryMovie.watched ? 'fa-check-circle' : 'fa-eye'}"></i> Watched</button>` : '';
        
        console.log('Creating movie detail HTML with share button:', shareButtonHtml);
        
        container.innerHTML = `
            <div class="movie-detail">
                <img src="${movieData.poster_path ? TMDB_IMAGE_BASE_URL + movieData.poster_path : 'https://via.placeholder.com/300x450?text=No+Image'}" 
                     alt="${movieData.title || movieData.name}" 
                     class="movie-detail-poster"
                     onerror="this.src='https://via.placeholder.com/300x450?text=No+Image'">
                <div class="movie-detail-info">
                    <h2>${movieData.title || movieData.name}</h2>
                    
                    <div class="movie-detail-meta">
                        <span><i class="fas fa-calendar"></i> ${releaseYear}</span>
                        <span><i class="fas fa-clock"></i> ${runtime ? `${runtime} min` : 'N/A'}</span>
                        <span><i class="fas fa-tag"></i> ${genres}</span>
                    </div>
                    
                    <div class="movie-detail-rating">
                        <i class="fas fa-star"></i>
                        ${movieData.vote_average ? movieData.vote_average.toFixed(1) : 'N/A'} / 10
                        <span style="margin-left: 1rem; color: #666;">(${movieData.vote_count || 0} votes)</span>
                    </div>
                    
                    ${isInLibrary ? `
                        <div class="movie-detail-watched">
                            ${watchedStatus}
                        </div>
                    ` : ''}
                    
                    <div class="movie-detail-overview">
                        <h3>Overview</h3>
                        <p>${movieData.overview || 'No overview available.'}</p>
                    </div>
                    
                    <div class="movie-detail-additional-info">
                        <p><strong>Production:</strong> ${productionCompanies}</p>
                        <p><strong>Languages:</strong> ${spokenLanguages}</p>
                        <p><strong>Status:</strong> ${status}</p>
                        ${mediaType === 'movie' ? `
                            <p><strong>Budget:</strong> ${budget}</p>
                            <p><strong>Revenue:</strong> ${revenue}</p>
                        ` : `
                            <p><strong>Episodes:</strong> ${movieData.number_of_episodes || 'N/A'} episodes in ${movieData.number_of_seasons || 'N/A'} seasons</p>
                            <p><strong>First Aired:</strong> ${movieData.first_air_date ? new Date(movieData.first_air_date).toLocaleDateString() : 'N/A'}</p>
                        `}
                    </div>
                    
                    <div class="movie-detail-actions">
                        ${trailerButtonHtml}
                        ${watchedToggleHtml}
                        ${shareButtonHtml}
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error fetching movie details:', error);
        container.innerHTML = '<div class="empty-state"><h3>Error</h3><p>Failed to load movie details. Please try again.</p></div>';
    }
}

async function fetchMovieDetails(movieId) {
    const response = await fetch(`${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}`);
    return await response.json();
}

async function fetchTVDetails(tvId) {
    const response = await fetch(`${TMDB_BASE_URL}/tv/${tvId}?api_key=${TMDB_API_KEY}`);
    return await response.json();
}

async function fetchMovieVideos(movieId) {
    const response = await fetch(`${TMDB_BASE_URL}/movie/${movieId}/videos?api_key=${TMDB_API_KEY}`);
    return await response.json();
}

async function fetchTVVideos(tvId) {
    const response = await fetch(`${TMDB_BASE_URL}/tv/${tvId}/videos?api_key=${TMDB_API_KEY}`);
    return await response.json();
}

function closeMovieModal() {
    document.getElementById('movie-modal').classList.remove('active');
}

function openTrailer(trailerKey) {
    const trailerUrl = `https://www.youtube.com/watch?v=${trailerKey}`;
    window.open(trailerUrl, '_blank');
}

// Sharing Functionality
function shareMovie(movieId, mediaType) {
    const movie = currentLibrary ? currentLibrary.movies.find(m => m.id === movieId && m.media_type === mediaType) : null;
    if (!movie) return;
    
    const shareData = {
        type: 'movie',
        movie: movie,
        library: currentLibrary ? currentLibrary.name : null
    };
    
    showShareModal(shareData);
}

function shareMovieFromDetails(movieId, mediaType) {
    console.log('Sharing movie from details:', movieId, mediaType);
    
    // Create a temporary movie object for sharing from details view
    const movie = {
        id: movieId,
        media_type: mediaType,
        title: document.querySelector('.movie-detail h2').textContent
    };
    
    const shareData = {
        type: 'movie',
        movie: movie,
        library: null
    };
    
    console.log('Share data:', shareData);
    showShareModal(shareData);
}

function shareCurrentLibrary() {
    if (!currentLibrary) return;
    
    const shareData = {
        type: 'library',
        library: currentLibrary
    };
    
    showShareModal(shareData);
}

function showShareModal(shareData) {
    const modal = document.getElementById('share-modal');
    const container = document.getElementById('share-content');
    
    let shareUrl, shareText;
    
    if (shareData.type === 'movie') {
        shareUrl = `${window.location.origin}${window.location.pathname}?share=movie&id=${shareData.movie.id}&type=${shareData.movie.media_type}`;
        shareText = `Check out "${shareData.movie.title}" from my ${shareData.library || 'movie'} collection!`;
    } else {
        shareUrl = `${window.location.origin}${window.location.pathname}?share=library&id=${shareData.library.id}`;
        shareText = `Check out my "${shareData.library.name}" movie collection!`;
    }
    
    container.innerHTML = `
        <h3>Share ${shareData.type === 'movie' ? 'Movie' : 'Library'}</h3>
        <p>Share this ${shareData.type === 'movie' ? 'movie' : 'library'} with others:</p>
        <input type="text" class="share-url" value="${shareUrl}" readonly>
        <div class="share-actions">
            <button class="btn btn-primary" onclick="copyToClipboard('${shareUrl}')">
                <i class="fas fa-copy"></i> Copy Link
            </button>
            <button class="btn btn-secondary" onclick="shareToSocial('${shareUrl}', '${shareText}')">
                <i class="fas fa-share-alt"></i> Share
            </button>
        </div>
    `;
    
    modal.classList.add('active');
}

function closeShareModal() {
    document.getElementById('share-modal').classList.remove('active');
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Link copied to clipboard!');
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Link copied to clipboard!');
    });
}

function shareToSocial(url, text) {
    if (navigator.share) {
        navigator.share({
            title: 'Reel Minder',
            text: text,
            url: url
        });
    } else {
        // Fallback - open share dialog
        const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        window.open(shareUrl, '_blank');
    }
}

// Handle URL parameters for sharing
function handleShareParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const shareType = urlParams.get('share');
    const id = urlParams.get('id');
    const type = urlParams.get('type');
    
    if (shareType === 'movie' && id && type) {
        // Show movie details
        showMovieDetails(parseInt(id), type);
    } else if (shareType === 'library' && id) {
        // Show library
        showLibraryDetail(id);
    }
}

// Dark Mode Functions
function toggleDarkMode() {
    const body = document.body;
    const toggle = document.getElementById('dark-mode-toggle');
    const icon = toggle.querySelector('i');
    
    body.classList.toggle('dark-mode');
    
    if (body.classList.contains('dark-mode')) {
        icon.className = 'fas fa-sun';
        toggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
        localStorage.setItem('darkMode', 'true');
    } else {
        icon.className = 'fas fa-moon';
        toggle.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
        localStorage.setItem('darkMode', 'false');
    }
}

function initializeDarkMode() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    const toggle = document.getElementById('dark-mode-toggle');
    
    if (darkMode) {
        document.body.classList.add('dark-mode');
        toggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
    }
}

// Watched Toggle Function
function toggleWatched(movieId, mediaType, isWatched) {
    if (!currentLibrary) return;
    
    const movie = currentLibrary.movies.find(m => m.id === movieId && m.media_type === mediaType);
    if (movie) {
        movie.watched = isWatched;
        saveData();
        
        // Update the UI immediately
        renderLibraryMovies();
    }
}

// Watched Toggle Function from Details Page
function toggleWatchedFromDetails(movieId, mediaType, isWatched) {
    if (!currentLibrary) return;
    
    const movie = currentLibrary.movies.find(m => m.id === movieId && m.media_type === mediaType);
    if (movie) {
        movie.watched = isWatched;
        saveData();
        
        // Update the UI immediately
        renderLibraryMovies();
        
        // Refresh the details page to show updated status
        showMovieDetails(movieId, mediaType);
    }
}

// Initialize share handling
document.addEventListener('DOMContentLoaded', function() {
    handleShareParams();
    initializeDarkMode();
});

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

// Note: You'll need to get a TMDB API key from https://www.themoviedb.org/settings/api
// Replace 'your_tmdb_api_key_here' with your actual API key
