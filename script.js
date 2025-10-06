// TMDB API Configuration
// Auto-detect deployment platform and use appropriate API endpoints
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Check if we're on Vercel, Netlify, or GitHub Pages
const isVercel = window.location.hostname.includes('vercel.app');
const isNetlify = window.location.hostname.includes('netlify.app');
const hasServerlessFunctions = isVercel || isNetlify;

const API_BASE = hasServerlessFunctions ? '' : 'https://api.themoviedb.org/3';
const API_KEY = hasServerlessFunctions ? '' : (window.CONFIG?.TMDB_API_KEY || 'your_tmdb_api_key_here');

// Application State
let currentView = 'libraries';
let currentLibrary = null;
let libraries = [];
let searchResults = [];

// Streaming Services Data with reliable SVG logos
const STREAMING_SERVICES = {
    'netflix': {
        name: 'Netflix',
        logo: 'data:image/svg+xml;base64,' + btoa(`
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="60" height="60" rx="8" fill="#E50914"/>
                <path d="M25.5 15L40 30L25.5 45V15Z" fill="white"/>
            </svg>
        `),
        searchUrl: 'https://www.netflix.com/search?q='
    },
    'amazon_prime': {
        name: 'Prime Video',
        logo: 'data:image/svg+xml;base64,' + btoa(`
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="60" height="60" rx="8" fill="#00A8FF"/>
                <path d="M15 25L30 20L45 25L45 35L30 40L15 35V25Z" fill="white"/>
            </svg>
        `),
        searchUrl: 'https://www.amazon.com/s?k='
    },
    'hulu': {
        name: 'Hulu',
        logo: 'data:image/svg+xml;base64,' + btoa(`
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="60" height="60" rx="8" fill="#1ED974"/>
                <rect x="20" y="20" width="20" height="20" fill="white"/>
            </svg>
        `),
        searchUrl: 'https://www.hulu.com/search?q='
    },
    'hbo_max': {
        name: 'Max',
        logo: 'data:image/svg+xml;base64,' + btoa(`
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="60" height="60" rx="8" fill="#843490"/>
                <rect x="15" y="20" width="30" height="20" fill="white"/>
            </svg>
        `),
        searchUrl: 'https://play.max.com/search?q='
    },
    'disney_plus': {
        name: 'Disney+',
        logo: 'data:image/svg+xml;base64,' + btoa(`
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="60" height="60" rx="8" fill="#113CCA"/>
                <path d="M30 15L40 25L30 35L20 25L30 15Z" fill="white"/>
            </svg>
        `),
        searchUrl: 'https://www.disneyplus.com/search?q='
    },
    'apple_tv': {
        name: 'Apple TV+',
        logo: 'data:image/svg+xml;base64,' + btoa(`
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="60" height="60" rx="8" fill="#000000"/>
                <rect x="20" y="20" width="20" height="20" fill="white"/>
            </svg>
        `),
        searchUrl: 'https://tv.apple.com/search?q='
    },
    'paramount_plus': {
        name: 'Paramount+',
        logo: 'data:image/svg+xml;base64,' + btoa(`
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="60" height="60" rx="8" fill="#0078DB"/>
                <path d="M30 15L45 25L30 35L15 25L30 15Z" fill="white"/>
            </svg>
        `),
        searchUrl: 'https://www.paramountplus.com/search?q='
    },
    'peacock': {
        name: 'Peacock',
        logo: 'data:image/svg+xml;base64,' + btoa(`
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="60" height="60" rx="8" fill="#FF6000"/>
                <rect x="20" y="20" width="20" height="20" fill="white"/>
            </svg>
        `),
        searchUrl: 'https://www.peacocktv.com/search?q='
    }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    setupEventListeners();
    initializeLayout();
    renderLibraries();
    displayRandomTagline();
    initializeAds();
});

// Initialize Google AdSense ads
function initializeAds() {
    try {
        // Initialize all ad units
        (adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
        console.log('AdSense not configured yet:', error);
    }
}

// Data Management
let movieDataStore = {}; // Global store for movie data

function loadData() {
    const savedData = localStorage.getItem('reelMinderData');
    if (savedData) {
        const data = JSON.parse(savedData);
        libraries = data.libraries || [];
        
        // Ensure all library names start with capital letters
        libraries.forEach(library => {
            if (library.name) {
                library.name = capitalizeFirstLetter(library.name);
            }
        });
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

function capitalizeFirstLetter(str) {
    if (!str || typeof str !== 'string') return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function switchLayout(layout) {
    // Update active button
    document.querySelectorAll('.layout-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-layout="${layout}"]`).classList.add('active');
    
    // Apply layout to current library movies container
    const container = document.getElementById('library-movies');
    if (container) {
        // Remove all layout classes
        container.classList.remove('grid-view', 'poster-view', 'list-view');
        
        // Add new layout class
        container.classList.add(`${layout}-view`);
        
        // Save layout preference
        localStorage.setItem('preferredLayout', layout);
    }
}

function applyLayout(container, layout) {
    if (container) {
        // Remove all layout classes
        container.classList.remove('grid-view', 'poster-view', 'list-view');
        
        // Add new layout class
        container.classList.add(`${layout}-view`);
    }
}

function initializeLayout() {
    // Load saved layout preference or default to grid
    const savedLayout = localStorage.getItem('preferredLayout') || 'grid';
    
    // Update active button
    document.querySelectorAll('.layout-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`[data-layout="${savedLayout}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Apply layout to any existing library movies container
    const container = document.getElementById('library-movies');
    if (container) {
        applyLayout(container, savedLayout);
    }
}

// Event Listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Skip settings button
            if (btn.id === 'settings-nav-btn') return;
            
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
    document.getElementById('get-recommendations-btn').addEventListener('click', getRecommendations);
    document.getElementById('edit-library-btn').addEventListener('click', editCurrentLibrary);
    document.getElementById('delete-library-btn').addEventListener('click', deleteCurrentLibrary);

    // Discovery buttons
    document.getElementById('trending-btn').addEventListener('click', () => loadDiscoveryContent('trending'));
    document.getElementById('top-rated-btn').addEventListener('click', () => loadDiscoveryContent('top-rated'));
    document.getElementById('upcoming-btn').addEventListener('click', () => loadDiscoveryContent('upcoming'));
    document.getElementById('random-btn').addEventListener('click', () => loadDiscoveryContent('random'));
    
    // Trailers button (now in discovery quick buttons)
    document.getElementById('trailers-btn').addEventListener('click', () => loadTrailers());
    
    // Retry trailers button
    document.getElementById('retry-trailers-btn').addEventListener('click', () => loadTrailers());
    
    // Load More button (delegated event listener)
    document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'load-more-btn') {
            const resultsContainer = document.getElementById('discovery-results');
            const currentType = resultsContainer.dataset.lastType;
            if (currentType) {
                loadDiscoveryContent(currentType, true);
            }
        }
    });

    // Search functionality (now handles all search types and filters)
    const findSearchBtn = document.getElementById('find-search-btn');
    const findSearchInput = document.getElementById('find-search-input');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    const toggleAdvancedFilters = document.getElementById('toggle-advanced-filters');
    
    if (findSearchBtn && findSearchInput) {
        findSearchBtn.addEventListener('click', performAdvancedSearch);
        
        findSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performAdvancedSearch();
            }
        });
    }
    
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearAllFilters);
    }
    
    if (toggleAdvancedFilters) {
        toggleAdvancedFilters.addEventListener('click', toggleAdvancedFiltersSection);
    }
    
    // Content type dropdown in advanced filters
    const contentTypeSelect = document.getElementById('content-type-select');
    if (contentTypeSelect) {
        contentTypeSelect.addEventListener('change', (e) => {
            // Update the main filter buttons to match
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            const activeButton = document.querySelector(`[data-type="${e.target.value}"]`);
            if (activeButton) {
                activeButton.classList.add('active');
            }
            
            // Reload genres for the new media type
            if (genreData.loaded) {
                populateGenreDropdown();
            }
            
            // Reload current content with new filter
            const lastLoadedType = document.getElementById('discovery-results').dataset.lastType;
            if (lastLoadedType) {
                loadDiscoveryContent(lastLoadedType);
            }
        });
    }

    // Content type filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active class from all buttons
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            e.target.classList.add('active');
            
            // Update the advanced filter dropdown to match
            const currentType = e.target.dataset.type;
            const contentTypeSelect = document.getElementById('content-type-select');
            if (contentTypeSelect) {
                contentTypeSelect.value = currentType;
            }
            
            // Reload genres for the new media type
            if (genreData.loaded) {
                populateGenreDropdown();
            }
            // Reload current content with new filter
            const lastLoadedType = document.getElementById('discovery-results').dataset.lastType;
            if (lastLoadedType) {
                loadDiscoveryContent(lastLoadedType);
            }
        });
    });
    
    // Load genres and languages when the page loads
    loadGenres();
    loadLanguages();
    document.getElementById('share-library-btn').addEventListener('click', shareCurrentLibrary);
    
    // Movie Sorting in Library
    document.getElementById('movie-sort').addEventListener('change', function(e) {
        sortMoviesInLibrary(e.target.value);
    });

    // Settings Navigation Button
    document.getElementById('settings-nav-btn').addEventListener('click', () => {
        // Toggle the header settings dropdown
        toggleHeaderSettingsDropdown();
    });
    
    // Dark Mode Toggle (now in settings dropdown)
    document.getElementById('header-dark-mode-toggle').addEventListener('click', toggleDarkMode);
    
    
    // Header Settings Dropdown
    document.getElementById('header-buy-coffee-btn').addEventListener('click', openBuyMeCoffee);
    document.getElementById('header-export-data-btn').addEventListener('click', exportData);
    document.getElementById('header-import-data-btn').addEventListener('click', importData);
    document.getElementById('header-show-data-info-btn').addEventListener('click', showDataStorageModal);

    // Load More Recommendations
    document.getElementById('load-more-recommendations-btn').addEventListener('click', loadMoreRecommendations);

    // Layout Switcher
    document.querySelectorAll('.layout-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const layout = this.dataset.layout;
            switchLayout(layout);
        });
    });
    
    document.getElementById('import-file-input').addEventListener('change', handleFileImport);
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        // Header settings dropdown
        const headerDropdown = document.getElementById('header-settings-dropdown-menu');
        const headerSettingsBtn = document.getElementById('settings-nav-btn');
        if (headerDropdown && !headerSettingsBtn.contains(event.target) && !headerDropdown.contains(event.target)) {
            headerDropdown.classList.remove('show');
        }
    });

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
    document.getElementById('close-episodes-modal').addEventListener('click', closeEpisodesModal);

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

// News functionality
let newsEventListenersSetup = false;
let currentNewsCategory = 'all';
let currentNewsPage = 1;
let allNewsArticles = [];
let isLoadingMoreNews = false;

function setupNewsEventListeners() {
    if (newsEventListenersSetup) return;
    
    // News category buttons
    document.querySelectorAll('.news-category-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active class from all buttons
            document.querySelectorAll('.news-category-btn').forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            e.target.classList.add('active');
            
            const category = e.target.dataset.category;
            loadNewsByCategory(category);
        });
    });

    // News search
    const newsSearchBtn = document.getElementById('news-search-btn');
    const newsSearchInput = document.getElementById('news-search-input');
    
    if (newsSearchBtn && newsSearchInput) {
        newsSearchBtn.addEventListener('click', performNewsSearch);
        
        newsSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performNewsSearch();
            }
        });
    }

    // Retry button
    const retryNewsBtn = document.getElementById('retry-news-btn');
    if (retryNewsBtn) {
        retryNewsBtn.addEventListener('click', () => {
            const activeCategory = document.querySelector('.news-category-btn.active');
            if (activeCategory) {
                loadNewsByCategory(activeCategory.dataset.category);
            }
        });
    }

    // Load more button
    const loadMoreBtn = document.getElementById('news-load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreNews);
    }
    
    newsEventListenersSetup = true;
}

// News API functions
async function loadNewsByCategory(category = 'all') {
    const newsGrid = document.getElementById('news-grid');
    const newsLoading = document.getElementById('news-loading');
    const newsError = document.getElementById('news-error');
    const loadMoreContainer = document.getElementById('news-load-more-container');
    
    // Reset pagination
    currentNewsCategory = category;
    currentNewsPage = 1;
    allNewsArticles = [];
    
    // Show loading state
    newsGrid.innerHTML = '';
    newsLoading.style.display = 'block';
    newsError.style.display = 'none';
    loadMoreContainer.style.display = 'none';
    
    try {
        let query = '';
        switch(category) {
            case 'movies':
                query = 'movie OR film OR cinema OR Hollywood OR blockbuster OR premiere OR trailer OR sequel OR franchise OR oscar OR golden globe OR film festival OR red carpet';
                break;
            case 'tv':
                query = 'TV show OR television series OR streaming OR Netflix OR HBO OR Disney OR Amazon Prime OR episode OR season OR premiere OR emmy OR television OR series';
                break;
            case 'celebrities':
                query = 'actor OR actress OR director OR producer OR celebrity OR Hollywood star OR movie star OR film star OR entertainment industry OR red carpet OR awards OR oscar OR emmy';
                break;
            default:
                query = 'movie OR film OR TV show OR television OR celebrity OR actor OR actress OR Hollywood OR entertainment OR cinema OR streaming OR oscar OR emmy OR golden globe OR film festival OR red carpet';
        }
        
        const articles = await fetchNewsFromMultipleAPIs(query, category, currentNewsPage);
        allNewsArticles = articles;
        displayNewsArticles(articles);
        
        // Show load more button if we have articles
        if (articles.length > 0) {
            loadMoreContainer.style.display = 'flex';
        }
        
    } catch (error) {
        console.error('Error loading news:', error);
        showNewsError(error.message);
    } finally {
        newsLoading.style.display = 'none';
    }
}

async function loadMoreNews() {
    if (isLoadingMoreNews) return;
    
    const loadMoreBtn = document.getElementById('news-load-more-btn');
    const loadMoreContainer = document.getElementById('news-load-more-container');
    
    isLoadingMoreNews = true;
    loadMoreBtn.disabled = true;
    loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    
    try {
        currentNewsPage++;
        
        let query = '';
        switch(currentNewsCategory) {
            case 'movies':
                query = 'movie OR film OR cinema OR Hollywood OR blockbuster OR premiere OR trailer OR sequel OR franchise OR oscar OR golden globe OR film festival OR red carpet';
                break;
            case 'tv':
                query = 'TV show OR television series OR streaming OR Netflix OR HBO OR Disney OR Amazon Prime OR episode OR season OR premiere OR emmy OR television OR series';
                break;
            case 'celebrities':
                query = 'actor OR actress OR director OR producer OR celebrity OR Hollywood star OR movie star OR film star OR entertainment industry OR red carpet OR awards OR oscar OR emmy';
                break;
            default:
                query = 'movie OR film OR TV show OR television OR celebrity OR actor OR actress OR Hollywood OR entertainment OR cinema OR streaming OR oscar OR emmy OR golden globe OR film festival OR red carpet';
        }
        
        const newArticles = await fetchNewsFromMultipleAPIs(query, currentNewsCategory, currentNewsPage);
        
        if (newArticles && newArticles.length > 0) {
            // Add new articles to existing ones
            allNewsArticles = [...allNewsArticles, ...newArticles];
            displayNewsArticles(allNewsArticles);
        } else {
            // No more articles available
            loadMoreContainer.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Error loading more news:', error);
        // Revert page number on error
        currentNewsPage--;
    } finally {
        isLoadingMoreNews = false;
        loadMoreBtn.disabled = false;
        loadMoreBtn.innerHTML = '<i class="fas fa-plus"></i> Load More News';
    }
}

async function performNewsSearch() {
    const searchInput = document.getElementById('news-search-input');
    const query = searchInput.value.trim();
    
    if (!query) {
        // If no search query, load default news
        const activeCategory = document.querySelector('.news-category-btn.active');
        loadNewsByCategory(activeCategory ? activeCategory.dataset.category : 'all');
        return;
    }
    
    const newsGrid = document.getElementById('news-grid');
    const newsLoading = document.getElementById('news-loading');
    const newsError = document.getElementById('news-error');
    
    // Show loading state
    newsGrid.innerHTML = '';
    newsLoading.style.display = 'block';
    newsError.style.display = 'none';
    
    try {
        const articles = await fetchNewsFromMultipleAPIs(query);
        displayNewsArticles(articles);
        
    } catch (error) {
        console.error('Error searching news:', error);
        showNewsError();
    } finally {
        newsLoading.style.display = 'none';
    }
}

// Multi-API news fetching with fallback
async function fetchNewsFromMultipleAPIs(query, category = null, page = 1) {
    const allArticles = [];
    const errors = [];
    
    // Try each API in order of preference
    const apiPromises = [
        fetchFromNewsAPI(query, category, page),
        fetchFromAPITube(query, category, page),
        fetchFromZyla(query, category, page),
        fetchFromNexis(query, category, page)
    ];
    
    // Wait for all APIs to complete (or fail)
    const results = await Promise.allSettled(apiPromises);
    
    // Collect successful results
    results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value && result.value.length > 0) {
            allArticles.push(...result.value);
            console.log(`API ${index + 1} returned ${result.value.length} articles`);
        } else if (result.status === 'rejected') {
            const apiNames = ['NewsAPI', 'APITube', 'Zyla', 'Nexis'];
            console.error(`${apiNames[index]} failed:`, result.reason.message);
            errors.push(`${apiNames[index]}: ${result.reason.message}`);
        }
    });
    
    // If no articles from any API, throw an error
    if (allArticles.length === 0) {
        const errorMessage = errors.length > 0 
            ? `All news APIs failed: ${errors.join(', ')}`
            : 'No news articles found from any source';
        throw new Error(errorMessage);
    }
    
    // Remove duplicates, filter for entertainment content, and sort by date
    const uniqueArticles = removeDuplicateArticles(allArticles);
    const filteredArticles = filterEntertainmentArticles(uniqueArticles);
    return filteredArticles.sort((a, b) => new Date(b.publishedAt || b.pubDate || 0) - new Date(a.publishedAt || a.pubDate || 0));
}

// NewsAPI implementation
async function fetchFromNewsAPI(query, category = null, page = 1) {
    const apiKey = window.CONFIG?.NEWS_API_KEY;
    
    if (!apiKey || apiKey === 'YOUR_NEWS_API_KEY_HERE') {
        throw new Error('NewsAPI key not configured');
    }
    
    // Check if we're on a platform with serverless functions
    const isVercel = window.location.hostname.includes('vercel.app');
    const isNetlify = window.location.hostname.includes('netlify.app');
    const hasServerlessFunctions = isVercel || isNetlify;
    
    if (hasServerlessFunctions) {
        // Use serverless function
        const apiUrl = isVercel ? '/api/news' : '/.netlify/functions/news';
        const params = new URLSearchParams({ query, page: page.toString() });
        if (category) params.append('category', category);
        
        const response = await fetch(`${apiUrl}?${params.toString()}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'NewsAPI failed');
        }
        
        return data.articles || [];
    } else {
        // Use proxy for local development
        const proxyUrl = 'https://api.allorigins.win/get?url=';
        const newsApiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&pageSize=20&page=${page}&apiKey=${apiKey}`;
        
        const response = await fetch(proxyUrl + encodeURIComponent(newsApiUrl));
        const data = await response.json();
        
        if (data.contents) {
            const newsData = JSON.parse(data.contents);
            return newsData.articles || [];
        }
        throw new Error('NewsAPI proxy failed');
    }
}

// APITube Movies News API implementation
async function fetchFromAPITube(query, category = null, page = 1) {
    const apiKey = window.CONFIG?.APITUBE_API_KEY;
    
    if (!apiKey || apiKey === 'YOUR_APITUBE_API_KEY_HERE') {
        throw new Error('APITube API key not configured');
    }
    
    try {
        // APITube Movies News API endpoint - use more specific query for movies
        const movieQuery = query.includes('movie') || query.includes('film') || query.includes('cinema') 
            ? query 
            : `movie ${query}`;
        const apiUrl = `https://api.apitube.io/v1/news/movies?api_key=${apiKey}&q=${encodeURIComponent(movieQuery)}&limit=20&offset=${(page - 1) * 20}`;
        
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'APITube API failed');
        }
        
        // Transform APITube format to our standard format
        return (data.articles || data.results || []).map(article => ({
            title: article.title,
            description: article.description || article.summary,
            url: article.url || article.link,
            urlToImage: article.image || article.thumbnail,
            publishedAt: article.publishedAt || article.pubDate,
            source: { name: article.source || 'APITube' }
        }));
    } catch (error) {
        throw new Error(`APITube API error: ${error.message}`);
    }
}

// Zyla API Hub implementation
async function fetchFromZyla(query, category = null, page = 1) {
    const apiKey = window.CONFIG?.ZYLA_API_KEY;
    
    if (!apiKey || apiKey === 'YOUR_ZYLA_API_KEY_HERE') {
        throw new Error('Zyla API key not configured');
    }
    
    try {
        // Zyla Entertainment News API endpoint
        const apiUrl = `https://zylalabs.com/api/entertainment-news?api_key=${apiKey}&query=${encodeURIComponent(query)}&limit=20`;
        
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Zyla API failed');
        }
        
        // Transform Zyla format to our standard format
        return (data.articles || data.results || []).map(article => ({
            title: article.title,
            description: article.description || article.summary,
            url: article.url || article.link,
            urlToImage: article.image || article.thumbnail,
            publishedAt: article.publishedAt || article.pubDate,
            source: { name: article.source || 'Zyla' }
        }));
    } catch (error) {
        throw new Error(`Zyla API error: ${error.message}`);
    }
}

// Nexis Data+ Movie News API implementation
async function fetchFromNexis(query, category = null, page = 1) {
    const apiKey = window.CONFIG?.NEXIS_API_KEY;
    
    if (!apiKey || apiKey === 'YOUR_NEXIS_API_KEY_HERE') {
        throw new Error('Nexis API key not configured');
    }
    
    try {
        // Nexis Data+ API endpoint (this is a placeholder - actual endpoint may vary)
        const apiUrl = `https://api.nexis.com/v1/news/movies?api_key=${apiKey}&query=${encodeURIComponent(query)}&limit=20`;
        
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Nexis API failed');
        }
        
        // Transform Nexis format to our standard format
        return (data.articles || data.results || []).map(article => ({
            title: article.title,
            description: article.description || article.summary,
            url: article.url || article.link,
            urlToImage: article.image || article.thumbnail,
            publishedAt: article.publishedAt || article.pubDate,
            source: { name: article.source || 'Nexis' }
        }));
    } catch (error) {
        throw new Error(`Nexis API error: ${error.message}`);
    }
}

// Helper function to remove duplicate articles
function removeDuplicateArticles(articles) {
    const seen = new Set();
    return articles.filter(article => {
        const key = article.title?.toLowerCase() || '';
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
}

// Helper function to filter entertainment-related articles
function filterEntertainmentArticles(articles) {
    const strongEntertainmentKeywords = [
        'movie', 'film', 'cinema', 'hollywood', 'actor', 'actress', 'director', 'producer',
        'tv show', 'television series', 'streaming', 'netflix', 'hbo', 'disney', 'amazon prime',
        'celebrity', 'entertainment', 'box office', 'premiere', 'trailer', 'sequel', 'franchise',
        'episode', 'season', 'blockbuster', 'film star', 'movie star', 'entertainment industry',
        'oscar', 'emmy', 'golden globe', 'cannes', 'sundance', 'film festival', 'red carpet',
        'casting', 'script', 'screenplay', 'cinematography', 'editing', 'soundtrack', 'score',
        'theater', 'broadway', 'west end', 'stage', 'performance', 'audience', 'critic',
        'review', 'rating', 'rotten tomatoes', 'imdb', 'metacritic', 'entertainment news'
    ];
    
    const weakEntertainmentKeywords = [
        'star', 'show', 'series', 'television', 'streaming', 'entertainment'
    ];
    
    const strongExcludeKeywords = [
        'politics', 'election', 'government', 'sports', 'football', 'basketball', 'soccer',
        'business', 'economy', 'stock', 'market', 'technology', 'tech', 'science', 'research',
        'health', 'medical', 'covid', 'pandemic', 'war', 'conflict', 'crime', 'police',
        'finance', 'banking', 'investment', 'trading', 'crypto', 'bitcoin', 'cryptocurrency',
        'education', 'school', 'university', 'student', 'academic', 'study', 'research',
        'environment', 'climate', 'weather', 'nature', 'animals', 'wildlife', 'conservation',
        'food', 'restaurant', 'cooking', 'recipe', 'chef', 'dining', 'cuisine',
        'travel', 'tourism', 'vacation', 'hotel', 'flight', 'airline', 'destination',
        'fashion', 'clothing', 'style', 'designer', 'brand', 'retail', 'shopping',
        'real estate', 'property', 'housing', 'mortgage', 'rent', 'apartment', 'home',
        'automotive', 'car', 'vehicle', 'auto', 'driving', 'transportation', 'traffic',
        'gaming', 'video game', 'console', 'playstation', 'xbox', 'nintendo', 'esports'
    ];
    
    return articles.filter(article => {
        const title = (article.title || '').toLowerCase();
        const description = (article.description || '').toLowerCase();
        const content = `${title} ${description}`;
        
        // Check for strong entertainment keywords (must have at least one)
        const hasStrongEntertainmentKeywords = strongEntertainmentKeywords.some(keyword => 
            content.includes(keyword)
        );
        
        // Check for weak entertainment keywords (can supplement but not replace strong ones)
        const hasWeakEntertainmentKeywords = weakEntertainmentKeywords.some(keyword => 
            content.includes(keyword)
        );
        
        // Check if article contains strong excluded keywords
        const hasStrongExcludedKeywords = strongExcludeKeywords.some(keyword => 
            content.includes(keyword)
        );
        
        // More strict filtering: must have strong entertainment keywords OR (weak entertainment keywords AND no strong excluded keywords)
        const isEntertainmentContent = hasStrongEntertainmentKeywords || 
            (hasWeakEntertainmentKeywords && !hasStrongExcludedKeywords);
        
        // Additional check: if it has strong excluded keywords, reject regardless
        if (hasStrongExcludedKeywords) {
            return false;
        }
        
        // Additional context checks
        const hasEntertainmentContext = content.includes('entertainment') || 
            content.includes('hollywood') || 
            content.includes('film') || 
            content.includes('movie') ||
            content.includes('tv') ||
            content.includes('celebrity') ||
            content.includes('actor') ||
            content.includes('actress');
        
        return isEntertainmentContent && hasEntertainmentContext;
    });
}

// Helper function to check if a source is entertainment-related
function isEntertainmentSource(sourceName) {
    const entertainmentSources = [
        'variety', 'hollywood reporter', 'deadline', 'entertainment weekly', 'ew', 'people',
        'us weekly', 'e! online', 'tmz', 'just jared', 'popsugar', 'buzzfeed', 'vulture',
        'av club', 'indiewire', 'screen rant', 'collider', 'movieweb', 'comingsoon',
        'netflix', 'hbo', 'disney', 'amazon prime', 'hulu', 'paramount', 'universal',
        'warner bros', 'sony pictures', 'fox', 'abc', 'cbs', 'nbc', 'fx', 'amc'
    ];
    
    return entertainmentSources.some(source => 
        sourceName.toLowerCase().includes(source)
    );
}

// Trailers functionality
async function loadTrailers() {
    const trailersSection = document.getElementById('trailers-section');
    const discoveryResults = document.getElementById('discovery-results');
    const trailersLoading = document.getElementById('trailers-loading');
    const trailersError = document.getElementById('trailers-error');
    const trailersGrid = document.getElementById('trailers-grid');
    
    // Show trailers section and hide discovery results
    trailersSection.style.display = 'block';
    discoveryResults.style.display = 'none';
    
    // Show loading state
    trailersLoading.style.display = 'block';
    trailersError.style.display = 'none';
    trailersGrid.innerHTML = '';
    
    try {
        // Fetch latest movies and TV shows with videos
        const [movies, tvShows] = await Promise.all([
            fetchLatestMoviesWithVideos(),
            fetchLatestTVShowsWithVideos()
        ]);
        
        // Combine and sort by release date
        const allContent = [...movies, ...tvShows].sort((a, b) => 
            new Date(b.release_date || b.first_air_date || 0) - new Date(a.release_date || a.first_air_date || 0)
        );
        
        displayTrailers(allContent);
        
    } catch (error) {
        console.error('Error loading trailers:', error);
        showTrailersError(error.message);
    } finally {
        trailersLoading.style.display = 'none';
    }
}

async function fetchLatestMoviesWithVideos() {
    const apiKey = window.CONFIG?.TMDB_API_KEY;
    if (!apiKey) {
        throw new Error('TMDB API key not configured');
    }
    
    try {
        // Fetch latest movies
        const response = await fetch(`https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}&language=en-US&page=1`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.status_message || 'Failed to fetch movies');
        }
        
        // Get videos for each movie
        const moviesWithVideos = await Promise.all(
            data.results.slice(0, 10).map(async (movie) => {
                try {
                    const videoResponse = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}/videos?api_key=${apiKey}&language=en-US`);
                    const videoData = await videoResponse.json();
                    
                    if (videoResponse.ok && videoData.results && videoData.results.length > 0) {
                        // Find trailer or teaser
                        const trailer = videoData.results.find(video => 
                            video.type === 'Trailer' || video.type === 'Teaser'
                        ) || videoData.results[0];
                        
                        return {
                            ...movie,
                            video: trailer,
                            content_type: 'movie'
                        };
                    }
                } catch (error) {
                    console.warn(`Failed to fetch videos for movie ${movie.id}:`, error);
                }
                return null;
            })
        );
        
        return moviesWithVideos.filter(movie => movie !== null);
        
    } catch (error) {
        console.error('Error fetching movies with videos:', error);
        return [];
    }
}

async function fetchLatestTVShowsWithVideos() {
    const apiKey = window.CONFIG?.TMDB_API_KEY;
    if (!apiKey) {
        throw new Error('TMDB API key not configured');
    }
    
    try {
        // Fetch latest TV shows
        const response = await fetch(`https://api.themoviedb.org/3/tv/on_the_air?api_key=${apiKey}&language=en-US&page=1`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.status_message || 'Failed to fetch TV shows');
        }
        
        // Get videos for each TV show
        const tvShowsWithVideos = await Promise.all(
            data.results.slice(0, 10).map(async (tvShow) => {
                try {
                    const videoResponse = await fetch(`https://api.themoviedb.org/3/tv/${tvShow.id}/videos?api_key=${apiKey}&language=en-US`);
                    const videoData = await videoResponse.json();
                    
                    if (videoResponse.ok && videoData.results && videoData.results.length > 0) {
                        // Find trailer or teaser
                        const trailer = videoData.results.find(video => 
                            video.type === 'Trailer' || video.type === 'Teaser'
                        ) || videoData.results[0];
                        
                        return {
                            ...tvShow,
                            video: trailer,
                            content_type: 'tv'
                        };
                    }
                } catch (error) {
                    console.warn(`Failed to fetch videos for TV show ${tvShow.id}:`, error);
                }
                return null;
            })
        );
        
        return tvShowsWithVideos.filter(tvShow => tvShow !== null);
        
    } catch (error) {
        console.error('Error fetching TV shows with videos:', error);
        return [];
    }
}

function displayTrailers(content) {
    const trailersGrid = document.getElementById('trailers-grid');
    
    if (!content || content.length === 0) {
        trailersGrid.innerHTML = `
            <div class="trailers-empty">
                <i class="fas fa-video"></i>
                <h3>No Trailers Available</h3>
                <p>No trailers found for the latest content. Please try again later.</p>
            </div>
        `;
        return;
    }
    
    const trailersHTML = content.map(item => {
        const title = item.title || item.name;
        const releaseDate = item.release_date || item.first_air_date;
        const overview = item.overview || 'No description available';
        const posterPath = item.poster_path;
        const video = item.video;
        const contentType = item.content_type;
        
        const posterUrl = posterPath 
            ? `https://image.tmdb.org/t/p/w500${posterPath}`
            : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzUwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDM1MCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzNTAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjFGNUY0Ii8+CjxwYXRoIGQ9Ik0xNzUgMTAwTDE5MCA4NUwyMDUgMTAwTDE5MCAxMTVMMTc1IDEwMFoiIGZpbGw9IiNEOUQ5RDkiLz4KPC9zdmc+';
        
        const formattedDate = releaseDate ? new Date(releaseDate).toLocaleDateString() : 'TBA';
        
        return `
            <div class="trailer-card">
                <div class="trailer-thumbnail">
                    <img src="${posterUrl}" alt="${title}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzUwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDM1MCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzNTAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjFGNUY0Ii8+CjxwYXRoIGQ9Ik0xNzUgMTAwTDE5MCA4NUwyMDUgMTAwTDE5MCAxMTVMMTc1IDEwMFoiIGZpbGw9IiNEOUQ5RDkiLz4KPC9zdmc+'">
                    <div class="trailer-play-button" onclick="playTrailer('${video.key}', '${title}')">
                        <i class="fas fa-play"></i>
                    </div>
                </div>
                <div class="trailer-info">
                    <h4 class="trailer-title">${title}</h4>
                    <div class="trailer-meta">
                        <span class="trailer-type">${contentType === 'movie' ? 'Movie' : 'TV Show'}</span>
                        <span class="trailer-date">${formattedDate}</span>
                    </div>
                    <p class="trailer-description">${overview.length > 120 ? overview.substring(0, 120) + '...' : overview}</p>
                    <div class="trailer-actions">
                        <button class="trailer-watch-btn" onclick="playTrailer('${video.key}', '${title}')">
                            <i class="fas fa-play"></i>
                            Watch Trailer
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    trailersGrid.innerHTML = trailersHTML;
}

function playTrailer(videoKey, title) {
    // Open YouTube trailer in a new tab
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoKey}`;
    window.open(youtubeUrl, '_blank');
}

function showTrailersError(message) {
    const trailersError = document.getElementById('trailers-error');
    const errorText = trailersError.querySelector('p');
    errorText.textContent = message || 'Failed to load trailers. Please try again later.';
    trailersError.style.display = 'block';
}

function displayNewsArticles(articles) {
    const newsGrid = document.getElementById('news-grid');
    
    if (!articles || articles.length === 0) {
        newsGrid.innerHTML = `
            <div class="news-empty">
                <i class="fas fa-newspaper"></i>
                <h3>No news found</h3>
                <p>Try a different search term or category</p>
            </div>
        `;
        return;
    }
    
    newsGrid.innerHTML = articles.map(article => `
        <article class="news-article" onclick="openNewsArticle('${article.url}')">
            <div class="news-article-image">
                <img src="${article.urlToImage || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzUwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDM1MCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzNTAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xNzUgMTAwTDE5MCA4NUwyMDUgMTAwTDE5MCAxMTVMMTc1IDEwMFoiIGZpbGw9IiNEOUQ5RDkiLz4KPC9zdmc+'}" 
                     alt="${article.title || 'News article'}" 
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzUwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDM1MCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzNTAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xNzUgMTAwTDE5MCA4NUwyMDUgMTAwTDE5MCAxMTVMMTc1IDEwMFoiIGZpbGw9IiNEOUQ5RDkiLz4KPC9zdmc+'">
            </div>
            <div class="news-article-content">
                <div class="news-article-source">
                    <i class="fas fa-newspaper"></i>
                    <span>${article.source?.name || 'Unknown Source'}</span>
                    ${article.source?.name && isEntertainmentSource(article.source.name) ? '<span class="source-badge">Entertainment</span>' : ''}
                </div>
                <h3 class="news-article-title">${article.title || 'No title available'}</h3>
                <p class="news-article-description">${article.description || 'No description available'}</p>
                <div class="news-article-meta">
                    <div class="news-article-date">
                        <i class="fas fa-clock"></i>
                        <span>${formatNewsDate(article.publishedAt)}</span>
                    </div>
                    <a href="${article.url}" target="_blank" class="news-article-read-more" onclick="event.stopPropagation()">
                        Read More <i class="fas fa-external-link-alt"></i>
                    </a>
                </div>
            </div>
        </article>
    `).join('');
}

function showNewsError() {
    const newsGrid = document.getElementById('news-grid');
    const newsError = document.getElementById('news-error');
    
    newsGrid.innerHTML = '';
    newsError.style.display = 'block';
}

function formatNewsDate(dateString) {
    if (!dateString) return 'Unknown date';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
        return 'Just now';
    } else if (diffInHours < 24) {
        return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString();
    }
}

function openNewsArticle(url) {
    if (url) {
        window.open(url, '_blank');
    }
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

    // Add/remove body class for search view styling
    if (viewName === 'search') {
        document.body.classList.add('search-view-active');
    } else {
        document.body.classList.remove('search-view-active');
    }

    // Load news when news view is activated
    if (viewName === 'news') {
        // Set up news event listeners if not already done
        setupNewsEventListeners();
        // Load default news (all categories)
        loadNewsByCategory('all');
    }

    // Load appropriate content
    if (viewName === 'libraries') {
        renderLibraries();
    } else if (viewName === 'search') {
        // Clear search results
        document.getElementById('search-results').innerHTML = '';
    } else if (viewName === 'find-something') {
        // Reset to welcome state
        const resultsContainer = document.getElementById('discovery-results');
        resultsContainer.innerHTML = `
            <div class="discovery-welcome">
                <i class="fas fa-search"></i>
                <h3>Ready to Discover?</h3>
                <p>Click one of the buttons above to start finding great content!</p>
            </div>
        `;
        resultsContainer.removeAttribute('data-last-type');
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
        grid.classList.add('empty');
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <h3>No Libraries Yet</h3>
                <p>Create your first library to start organizing your movies and TV series!</p>
            </div>
        `;
        return;
    }

    grid.classList.remove('empty');
    grid.innerHTML = librariesToRender.map(library => {
        const moviePreviews = library.movies.slice(0, 4); // Show up to 4 movie previews
        const remainingCount = Math.max(0, library.movies.length - 4);
        
        return `
            <div class="library-card" onclick="showLibraryDetail('${library.id}')">
                <div class="library-card-header">
                    <div>
                        <div class="library-name">${capitalizeFirstLetter(library.name)}</div>
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
    try {
        let url;
        if (hasServerlessFunctions) {
            url = `/api/search?type=movie&query=${encodeURIComponent(query)}`;
        } else {
            url = `${API_BASE}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error('Movie search error:', error);
        return [];
    }
}

async function searchTVShows(query) {
    try {
        let url;
        if (hasServerlessFunctions) {
            url = `/api/search?type=tv&query=${encodeURIComponent(query)}`;
        } else {
            url = `${API_BASE}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(query)}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error('TV search error:', error);
        return [];
    }
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
    
    // Close the search modal
    closeSearchModal();
    
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
    const recommendationsSection = document.getElementById('recommendations-section');
    
    // Show/hide recommendations section based on whether this library has recommendations
    if (currentLibrary.recommendations && currentLibrary.recommendations.length > 0) {
        recommendationsSection.style.display = 'block';
        displayRecommendations(currentLibrary.recommendations);
    } else {
        recommendationsSection.style.display = 'none';
    }
    
    if (movies.length === 0) {
        container.classList.add('empty');
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-film"></i>
                <h3>No Movies Yet</h3>
                <p>Search for movies and TV series to add to this library!</p>
            </div>
        `;
        return;
    }
    
    container.classList.remove('empty');
    container.innerHTML = movies.map(movie => {
        const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
        const addedDate = movie.addedAt ? new Date(movie.addedAt).toLocaleDateString() : 'N/A';
        
        return `
            <div class="movie-card ${movie.watched ? 'watched' : ''}" onclick="showMovieDetails(${movie.id}, '${movie.media_type}')">
                <div class="movie-poster-container">
                    <img src="${movie.poster_path ? TMDB_IMAGE_BASE_URL + movie.poster_path : 'https://via.placeholder.com/300x450?text=No+Image'}" 
                         alt="${movie.title}" 
                         class="movie-poster"
                         onerror="this.src='https://via.placeholder.com/300x450?text=No+Image'">
                    <div class="movie-media-type">${movie.media_type === 'movie' ? 'Movie' : 'TV Series'}</div>
                </div>
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

// Recommendations Functionality
async function getRecommendations() {
    if (!currentLibrary || currentLibrary.movies.length < 2) {
        alert('You need at least 2 items in your library to get recommendations!');
        return;
    }
    
    const recommendationsBtn = document.getElementById('get-recommendations-btn');
    const originalText = recommendationsBtn.innerHTML;
    recommendationsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting Recommendations...';
    recommendationsBtn.disabled = true;
    
    try {
        const recommendations = await generateHybridRecommendations();
        
        // Store recommendations for this specific library
        currentLibrary.recommendations = recommendations;
        saveData();
        
        displayRecommendations(recommendations);
        
        // Show recommendations section
        const recommendationsSection = document.getElementById('recommendations-section');
        recommendationsSection.style.display = 'block';
        
        // Scroll to recommendations section with smooth animation
        setTimeout(() => {
            recommendationsSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }, 100); // Small delay to ensure the section is visible first
        
    } catch (error) {
        console.error('Error getting recommendations:', error);
        alert('Failed to get recommendations. Please try again.');
    } finally {
        recommendationsBtn.innerHTML = originalText;
        recommendationsBtn.disabled = false;
    }
}

async function generateHybridRecommendations(loadMore = false, skipCount = 0) {
    const libraryMovies = currentLibrary.movies;
    const allRecommendations = new Map(); // Use Map to avoid duplicates and track scores
    
    // Step 1: Genre Analysis
    const genreAnalysis = analyzeGenres(libraryMovies);
    
    // Step 2: Get recommendations for each movie/TV show
    for (const movie of libraryMovies) {
        try {
            const movieRecommendations = await getMovieRecommendations(movie.id, movie.media_type);
            
            // Add recommendations with scoring
            movieRecommendations.forEach(rec => {
                const key = `${rec.id}-${rec.media_type}`;
                const currentScore = allRecommendations.get(key)?.score || 0;
                
                // Base score from TMDB
                let score = rec.vote_average || 0;
                
                // Boost score for matching genres
                const matchingGenres = rec.genre_ids ? 
                    rec.genre_ids.filter(id => genreAnalysis.topGenres.includes(id)).length : 0;
                score += matchingGenres * 0.5;
                
                // Boost score for similar release years
                const movieYear = movie.release_date ? new Date(movie.release_date).getFullYear() : null;
                const recYear = rec.release_date ? new Date(rec.release_date).getFullYear() : 
                              rec.first_air_date ? new Date(rec.first_air_date).getFullYear() : null;
                
                if (movieYear && recYear && Math.abs(movieYear - recYear) <= 5) {
                    score += 0.3;
                }
                
                allRecommendations.set(key, {
                    ...rec,
                    score: Math.max(currentScore, score),
                    source: 'hybrid'
                });
            });
            
        } catch (error) {
            console.error(`Error getting recommendations for ${movie.title}:`, error);
        }
    }
    
    // Step 3: Get genre-based recommendations
    try {
        const genreRecommendations = await getGenreBasedRecommendations(genreAnalysis.topGenres);
        
        genreRecommendations.forEach(rec => {
            const key = `${rec.id}-${rec.media_type}`;
            if (!allRecommendations.has(key)) {
                allRecommendations.set(key, {
                    ...rec,
                    score: (rec.vote_average || 0) + 0.2, // Slight boost for genre-based
                    source: 'genre'
                });
            }
        });
    } catch (error) {
        console.error('Error getting genre recommendations:', error);
    }
    
    // Step 4: Filter out movies already in library and sort by score
    const libraryIds = new Set(libraryMovies.map(m => `${m.id}-${m.media_type}`));
    const filteredRecommendations = Array.from(allRecommendations.values())
        .filter(rec => !libraryIds.has(`${rec.id}-${rec.media_type}`))
        .sort((a, b) => b.score - a.score);
    
    // Skip already loaded recommendations and return next batch
    return filteredRecommendations.slice(skipCount, skipCount + 20);
}

function analyzeGenres(movies) {
    const genreCounts = new Map();
    const allGenres = [];
    
    movies.forEach(movie => {
        if (movie.genre_ids && Array.isArray(movie.genre_ids)) {
            movie.genre_ids.forEach(genreId => {
                genreCounts.set(genreId, (genreCounts.get(genreId) || 0) + 1);
                allGenres.push(genreId);
            });
        }
    });
    
    // Get top genres (appearing in at least 2 movies or top 3 genres)
    const sortedGenres = Array.from(genreCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => id);
    
    const topGenres = sortedGenres.slice(0, Math.max(3, Math.min(5, Math.floor(movies.length / 2))));
    
    return {
        genreCounts,
        topGenres,
        totalGenres: allGenres.length
    };
}

async function getMovieRecommendations(movieId, mediaType) {
    try {
        let url;
        if (hasServerlessFunctions) {
            url = `/api/recommendations?type=${mediaType}&id=${movieId}`;
        } else {
            url = `${API_BASE}/${mediaType}/${movieId}/recommendations?api_key=${API_KEY}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        return (data.results || []).map(item => ({
            ...item,
            media_type: mediaType
        }));
    } catch (error) {
        console.error('Error fetching movie recommendations:', error);
        return [];
    }
}

async function getGenreBasedRecommendations(topGenres) {
    try {
        // Get popular movies/TV shows for top genres
        const recommendations = [];
        
        for (const genreId of topGenres.slice(0, 3)) { // Top 3 genres
            // Get popular movies
            let movieUrl;
            if (hasServerlessFunctions) {
                movieUrl = `/api/discover?type=movie&genre=${genreId}&sort=popularity.desc&page=1`;
            } else {
                movieUrl = `${API_BASE}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}&sort_by=popularity.desc&page=1`;
            }
            
            const movieResponse = await fetch(movieUrl);
            const movieData = await movieResponse.json();
            
            if (movieData.results) {
                recommendations.push(...movieData.results.map(item => ({
                    ...item,
                    media_type: 'movie'
                })));
            }
            
            // Get popular TV shows
            let tvUrl;
            if (hasServerlessFunctions) {
                tvUrl = `/api/discover?type=tv&genre=${genreId}&sort=popularity.desc&page=1`;
            } else {
                tvUrl = `${API_BASE}/discover/tv?api_key=${API_KEY}&with_genres=${genreId}&sort_by=popularity.desc&page=1`;
            }
            
            const tvResponse = await fetch(tvUrl);
            const tvData = await tvResponse.json();
            
            if (tvData.results) {
                recommendations.push(...tvData.results.map(item => ({
                    ...item,
                    media_type: 'tv'
                })));
            }
        }
        
        return recommendations;
    } catch (error) {
        console.error('Error fetching genre recommendations:', error);
        return [];
    }
}

async function loadMoreRecommendations() {
    if (!currentLibrary) return;
    
    const loadMoreBtn = document.getElementById('load-more-recommendations-btn');
    const originalText = loadMoreBtn.innerHTML;
    loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading More...';
    loadMoreBtn.disabled = true;
    
    try {
        const currentRecommendations = currentLibrary.recommendations || [];
        const skipCount = currentRecommendations.length;
        const moreRecommendations = await generateHybridRecommendations(true, skipCount);
        
        // Append new recommendations to existing ones
        const allRecommendations = [...currentRecommendations, ...moreRecommendations];
        
        // Update library recommendations
        currentLibrary.recommendations = allRecommendations;
        saveData();
        
        // Update display
        displayRecommendations(allRecommendations);
        
        // Keep load more button visible for additional loads
        document.getElementById('recommendations-footer').style.display = 'block';
        
    } catch (error) {
        console.error('Error loading more recommendations:', error);
        alert('Failed to load more recommendations. Please try again.');
    } finally {
        loadMoreBtn.innerHTML = originalText;
        loadMoreBtn.disabled = false;
    }
}

function displayRecommendations(recommendations) {
    const container = document.getElementById('recommendations-grid');
    const footer = document.getElementById('recommendations-footer');
    
    if (recommendations.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-lightbulb"></i>
                <h3>No Recommendations Found</h3>
                <p>Try adding more movies to your library for better recommendations!</p>
            </div>
        `;
        footer.style.display = 'none';
        return;
    }
    
    // Show load more button if we have recommendations
    if (recommendations.length > 0) {
        footer.style.display = 'block';
    } else {
        footer.style.display = 'none';
    }
    
    container.innerHTML = recommendations.map(item => {
        const releaseYear = item.release_date ? new Date(item.release_date).getFullYear() : 
                           item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A';
        const overview = item.overview ? (item.overview.length > 100 ? item.overview.substring(0, 100) + '...' : item.overview) : 'No overview available';
        
        return `
            <div class="movie-card recommendation-card" onclick="showMovieDetails(${item.id}, '${item.media_type}')">
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
                        <div class="recommendation-source">
                            <i class="fas fa-lightbulb"></i>
                            ${item.source === 'hybrid' ? 'Recommended' : 'Genre Match'}
                        </div>
                    </div>
                    <div class="movie-overview">
                        <p>${overview}</p>
                    </div>
                    <div class="movie-actions">
                        <button class="btn btn-primary" onclick="event.stopPropagation(); addRecommendationToLibrary(${item.id}, '${item.media_type}')">
                            <i class="fas fa-plus"></i>
                            Add to Library
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function addRecommendationToLibrary(movieId, mediaType) {
    if (!currentLibrary) {
        alert('No library selected');
        return;
    }
    
    // Find the recommendation data
    const recommendationCard = document.querySelector(`.recommendation-card[onclick*="${movieId}"]`);
    if (!recommendationCard) {
        alert('Recommendation data not found');
        return;
    }
    
    const img = recommendationCard.querySelector('img');
    const title = recommendationCard.querySelector('.movie-title').textContent;
    const year = recommendationCard.querySelector('.movie-year').textContent;
    const rating = recommendationCard.querySelector('.movie-rating').textContent.trim();
    
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
        overview: recommendationCard.querySelector('.movie-overview p').textContent,
        poster_path: img.src.includes('placeholder') ? null : img.src.replace(TMDB_IMAGE_BASE_URL, ''),
        vote_average: parseFloat(rating.replace('★', '').trim()) || 0,
        release_date: year === 'N/A' ? null : year,
        media_type: mediaType,
        addedAt: new Date().toISOString(),
        watched: false
    };
    
    currentLibrary.movies.push(movieData);
    
    // Remove the recommendation from the recommendations array
    if (currentLibrary.recommendations) {
        currentLibrary.recommendations = currentLibrary.recommendations.filter(rec => 
            !(rec.id === movieId && rec.media_type === mediaType)
        );
    }
    
    saveData();
    
    // Update UI
    renderLibraryMovies();
    
    // Remove the recommendation card
    recommendationCard.remove();
    
    alert('Movie added to library successfully!');
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
        const episodesButtonHtml = mediaType === 'tv' ? `<button class="btn btn-info episodes-btn" onclick="showEpisodes(${movieId})"><i class="fas fa-list"></i> Episodes</button>` : '';
        
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
                        ${episodesButtonHtml}
                        ${watchedToggleHtml}
                        ${shareButtonHtml}
                    </div>
                </div>
            </div>
        `;
        
        // Load streaming availability after movie details are displayed
        await loadStreamingAvailability(movieData.title || movieData.name, releaseYear);
        
    } catch (error) {
        console.error('Error fetching movie details:', error);
        container.innerHTML = '<div class="empty-state"><h3>Error</h3><p>Failed to load movie details. Please try again.</p></div>';
    }
}

// Streaming Availability Functions
async function loadStreamingAvailability(title, year) {
    const streamingSection = document.getElementById('streaming-availability-section');
    const streamingGrid = document.getElementById('streaming-services-grid');
    const unavailableMessage = document.getElementById('streaming-unavailable');
    
    // Show the streaming section
    streamingSection.style.display = 'block';
    
    // Clear previous results
    streamingGrid.innerHTML = '';
    unavailableMessage.style.display = 'none';
    
    // Show loading state
    streamingGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #666;"><i class="fas fa-spinner fa-spin"></i> Checking streaming availability...</div>';
    
    try {
        // Use conservative streaming availability - only show services we're confident about
        const availableServices = await getConservativeStreamingAvailability(title, year);
        
        if (availableServices.length > 0) {
            streamingGrid.innerHTML = '';
            availableServices.forEach(service => {
                const serviceItem = document.createElement('a');
                serviceItem.className = 'streaming-service-item';
                serviceItem.href = `${service.searchUrl}${encodeURIComponent(title)}`;
                serviceItem.target = '_blank';
                serviceItem.rel = 'noopener noreferrer';
                
                serviceItem.innerHTML = `
                    <img src="${service.logo}" alt="${service.name}" class="streaming-service-logo">
                    <div class="streaming-service-name">${service.name}</div>
                `;
                
                streamingGrid.appendChild(serviceItem);
            });
        } else {
            streamingGrid.innerHTML = '';
            unavailableMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading streaming availability:', error);
        streamingGrid.innerHTML = '';
        unavailableMessage.style.display = 'block';
    }
}

// Real streaming availability function using UTelly API
async function getStreamingAvailability(title, year) {
    try {
        // Use UTelly API (free tier available)
        const response = await fetch(`https://utelly-tv-shows-and-movies-availability-v1.p.rapidapi.com/lookup?term=${encodeURIComponent(title)}&country=us`, {
            method: 'GET',
            headers: {
                'x-rapidapi-key': 'your-rapidapi-key-here', // You'll need to get this from RapidAPI
                'x-rapidapi-host': 'utelly-tv-shows-and-movies-availability-v1.p.rapidapi.com'
            }
        });
        
        if (!response.ok) {
            throw new Error('API request failed');
        }
        
        const data = await response.json();
        const availableServices = [];
        
        if (data.results && data.results.length > 0) {
            // Map UTelly results to our streaming services
            const serviceMapping = {
                'netflix': 'netflix',
                'amazon prime': 'amazon_prime',
                'amazon prime video': 'amazon_prime',
                'hulu': 'hulu',
                'hbo max': 'hbo_max',
                'max': 'hbo_max',
                'disney plus': 'disney_plus',
                'disney+': 'disney_plus',
                'apple tv': 'apple_tv',
                'apple tv plus': 'apple_tv',
                'paramount plus': 'paramount_plus',
                'paramount+': 'paramount_plus',
                'peacock': 'peacock'
            };
            
            data.results.forEach(result => {
                if (result.locations && result.locations.length > 0) {
                    result.locations.forEach(location => {
                        const serviceKey = serviceMapping[location.display_name?.toLowerCase()];
                        if (serviceKey && STREAMING_SERVICES[serviceKey]) {
                            // Avoid duplicates
                            if (!availableServices.find(s => s.name === STREAMING_SERVICES[serviceKey].name)) {
                                availableServices.push(STREAMING_SERVICES[serviceKey]);
                            }
                        }
                    });
                }
            });
        }
        
        return availableServices;
        
    } catch (error) {
        console.error('Error fetching streaming availability:', error);
        // Fallback to a more conservative approach - only show services we're very confident about
        return getConservativeStreamingAvailability(title, year);
    }
}

// Conservative streaming availability - only show services we're confident about
async function getConservativeStreamingAvailability(title, year) {
    // Simulate API delay for consistency
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const availableServices = [];
    const titleLower = title.toLowerCase();
    
    // Only add services we're very confident about based on known patterns
    if (titleLower.includes('marvel') || titleLower.includes('star wars') || titleLower.includes('disney') || titleLower.includes('pixar')) {
        availableServices.push(STREAMING_SERVICES.disney_plus);
    }
    
    if (titleLower.includes('hbo') || titleLower.includes('game of thrones') || titleLower.includes('euphoria') || titleLower.includes('house of the dragon')) {
        availableServices.push(STREAMING_SERVICES.hbo_max);
    }
    
    if (titleLower.includes('stranger things') || titleLower.includes('the crown') || titleLower.includes('witcher')) {
        availableServices.push(STREAMING_SERVICES.netflix);
    }
    
    // For very new content (current year), we're more conservative
    if (year >= 2024) {
        // Only show if we have strong indicators
        if (titleLower.includes('netflix') || titleLower.includes('original')) {
            availableServices.push(STREAMING_SERVICES.netflix);
        }
    }
    
    // For older content, be more conservative
    if (year < 2020) {
        // Amazon Prime often has older content
        availableServices.push(STREAMING_SERVICES.amazon_prime);
    }
    
    return availableServices;
}

async function fetchMovieDetails(movieId) {
    try {
        let url;
        if (hasServerlessFunctions) {
            url = `/api/details?type=movie&id=${movieId}`;
        } else {
            url = `${API_BASE}/movie/${movieId}?api_key=${API_KEY}`;
        }
        
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.error('Movie details error:', error);
        return null;
    }
}

async function fetchTVDetails(tvId) {
    try {
        let url;
        if (hasServerlessFunctions) {
            url = `/api/details?type=tv&id=${tvId}`;
        } else {
            url = `${API_BASE}/tv/${tvId}?api_key=${API_KEY}`;
        }
        
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.error('TV details error:', error);
        return null;
    }
}

async function fetchMovieVideos(movieId) {
    try {
        let url;
        if (hasServerlessFunctions) {
            url = `/api/videos?type=movie&id=${movieId}`;
        } else {
            url = `${API_BASE}/movie/${movieId}/videos?api_key=${API_KEY}`;
        }
        
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.error('Movie videos error:', error);
        return null;
    }
}

async function fetchTVVideos(tvId) {
    try {
        let url;
        if (hasServerlessFunctions) {
            url = `/api/videos?type=tv&id=${tvId}`;
        } else {
            url = `${API_BASE}/tv/${tvId}/videos?api_key=${API_KEY}`;
        }
        
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.error('TV videos error:', error);
        return null;
    }
}

async function fetchTVEpisodes(tvId) {
    try {
        let url;
        if (hasServerlessFunctions) {
            url = `/api/episodes?id=${tvId}`;
        } else {
            url = `${API_BASE}/tv/${tvId}?api_key=${API_KEY}`;
        }
        
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.error('TV episodes error:', error);
        return null;
    }
}

async function showEpisodes(tvId) {
    const modal = document.getElementById('episodes-modal');
    const container = document.getElementById('episodes-content');
    const title = document.getElementById('episodes-modal-title');
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    modal.classList.add('active');
    
    try {
        const tvData = await fetchTVEpisodes(tvId);
        
        if (!tvData) {
            throw new Error('Failed to fetch TV data');
        }
        
        title.textContent = `${tvData.name} - Episodes`;
        
        let episodesHtml = '';
        
        if (tvData.seasons && tvData.seasons.length > 0) {
            // Create season list with expandable episodes
            let seasonList = '';
            for (const season of tvData.seasons) {
                const seasonNumber = season.season_number === 0 ? 'Specials' : `Season ${season.season_number}`;
                const airYear = season.air_date ? new Date(season.air_date).getFullYear() : '';
                
                seasonList += `
                    <div class="season-item">
                        <div class="season-header" onclick="toggleSeasonEpisodes(${tvId}, ${season.season_number}, '${seasonNumber}')">
                            <div class="season-title">
                                <h4>${seasonNumber}</h4>
                                <span class="season-episode-count">${season.episode_count || 0} episodes</span>
                                ${airYear ? `<span class="season-year">${airYear}</span>` : ''}
                            </div>
                            <div class="season-toggle">
                                <i class="fas fa-chevron-down"></i>
                            </div>
                        </div>
                        <div class="season-overview" id="overview-${season.season_number}" style="display: none;">
                            ${season.overview || 'No overview available.'}
                        </div>
                        <div class="season-episodes" id="episodes-${season.season_number}" style="display: none;">
                            <div class="loading-episodes">
                                <div class="spinner-small"></div>
                                <span>Loading episodes...</span>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            episodesHtml = `<div class="seasons-list">${seasonList}</div>`;
            container.innerHTML = episodesHtml;
            
        } else {
            episodesHtml = '<div class="empty-state"><h3>No Episode Information</h3><p>Episode details are not available for this series.</p></div>';
            container.innerHTML = episodesHtml;
        }
        
    } catch (error) {
        console.error('Error fetching episodes:', error);
        container.innerHTML = '<div class="empty-state"><h3>Error</h3><p>Failed to load episode information. Please try again.</p></div>';
    }
}

async function loadSeasonEpisodes(tvId, seasonNumber, seasonName = null) {
    try {
        let url;
        if (hasServerlessFunctions) {
            url = `/api/season-episodes?id=${tvId}&season=${seasonNumber}`;
        } else {
            url = `${API_BASE}/tv/${tvId}/season/${seasonNumber}?api_key=${API_KEY}`;
        }
        
        const response = await fetch(url);
        const seasonData = await response.json();
        
        const episodesContainer = document.getElementById(`episodes-${seasonNumber}`);
        
        if (!seasonData.episodes || seasonData.episodes.length === 0) {
            episodesContainer.innerHTML = '<div class="no-episodes">No episodes available for this season.</div>';
            return;
        }
        
        let episodesHtml = '';
        
        for (const episode of seasonData.episodes) {
            const airDate = episode.air_date ? new Date(episode.air_date).toLocaleDateString() : 'TBA';
            const rating = episode.vote_average ? episode.vote_average.toFixed(1) : 'N/A';
            const overview = episode.overview || 'No overview available.';
            
            episodesHtml += `
                <div class="episode-item clickable-episode" onclick="redirectToExternalEpisodeInfo('${episode.name || 'Untitled Episode'}', ${seasonNumber}, ${episode.episode_number})">
                    <div class="episode-header">
                        <div class="episode-title">
                            <span class="episode-number">${episode.episode_number}.</span>
                            <span class="episode-name">${episode.name || 'Untitled Episode'}</span>
                        </div>
                        <div class="episode-rating">
                            <i class="fas fa-star"></i>
                            ${rating}
                        </div>
                    </div>
                    <div class="episode-meta">
                        <span class="episode-date">
                            <i class="fas fa-calendar"></i>
                            ${airDate}
                        </span>
                        ${episode.runtime ? `<span class="episode-runtime"><i class="fas fa-clock"></i> ${episode.runtime} min</span>` : ''}
                    </div>
                    <div class="episode-overview">
                        ${overview.length > 150 ? overview.substring(0, 150) + '...' : overview}
                    </div>
                    <div class="episode-external-link">
                        <i class="fas fa-external-link-alt"></i>
                        Click to view on IMDB
                    </div>
                </div>
            `;
        }
        
        episodesContainer.innerHTML = episodesHtml;
        
    } catch (error) {
        console.error(`Error loading episodes for season ${seasonNumber}:`, error);
        const episodesContainer = document.getElementById(`episodes-${seasonNumber}`);
        episodesContainer.innerHTML = '<div class="error-episodes">Failed to load episodes for this season.</div>';
    }
}

async function showEpisodeDetails(tvId, seasonNumber, episodeNumber) {
    const modal = document.getElementById('movie-modal');
    const container = document.getElementById('movie-detail-content');
    const title = document.getElementById('movie-modal-title');
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    modal.classList.add('active');
    
    try {
        let url;
        if (hasServerlessFunctions) {
            url = `/api/episode-details?id=${tvId}&season=${seasonNumber}&episode=${episodeNumber}`;
        } else {
            url = `${API_BASE}/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}?api_key=${API_KEY}`;
        }
        
        const response = await fetch(url);
        const episodeData = await response.json();
        
        if (!episodeData) {
            throw new Error('Failed to fetch episode data');
        }
        
        title.textContent = 'Details';
        
        const airDate = episodeData.air_date ? new Date(episodeData.air_date).toLocaleDateString() : 'TBA';
        const rating = episodeData.vote_average ? episodeData.vote_average.toFixed(1) : 'N/A';
        const runtime = episodeData.runtime ? `${episodeData.runtime} min` : 'N/A';
        const overview = episodeData.overview || 'No overview available.';
        
        container.innerHTML = `
            <div class="movie-detail">
                <div class="movie-detail-info">
                    <h2>${episodeData.name || 'Untitled Episode'}</h2>
                    
                    <div class="movie-detail-meta">
                        <span><i class="fas fa-calendar"></i> ${airDate}</span>
                        <span><i class="fas fa-clock"></i> ${runtime}</span>
                        <span><i class="fas fa-star"></i> ${rating} / 10</span>
                    </div>
                    
                    <div class="movie-detail-overview">
                        <h3>Overview</h3>
                        <p>${overview}</p>
                    </div>
                    
                    <div class="movie-detail-additional-info">
                        <p><strong>Season:</strong> ${seasonNumber}</p>
                        <p><strong>Episode:</strong> ${episodeNumber}</p>
                        <p><strong>Vote Count:</strong> ${episodeData.vote_count || 0}</p>
                    </div>
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('Error fetching episode details:', error);
        container.innerHTML = '<div class="empty-state"><h3>Error</h3><p>Failed to load episode details. Please try again.</p></div>';
    }
}

async function toggleSeasonEpisodes(tvId, seasonNumber, seasonName) {
    const episodesContainer = document.getElementById(`episodes-${seasonNumber}`);
    const overviewContainer = document.getElementById(`overview-${seasonNumber}`);
    const toggleIcon = episodesContainer.previousElementSibling.previousElementSibling.querySelector('.season-toggle i');
    
    if (episodesContainer.style.display === 'none') {
        // Show overview and episodes
        overviewContainer.style.display = 'block';
        episodesContainer.style.display = 'block';
        toggleIcon.classList.remove('fa-chevron-down');
        toggleIcon.classList.add('fa-chevron-up');
        
        // Load episodes if not already loaded
        if (episodesContainer.querySelector('.loading-episodes')) {
            await loadSeasonEpisodes(tvId, parseInt(seasonNumber), seasonName);
        }
    } else {
        // Hide overview and episodes
        overviewContainer.style.display = 'none';
        episodesContainer.style.display = 'none';
        toggleIcon.classList.remove('fa-chevron-up');
        toggleIcon.classList.add('fa-chevron-down');
    }
}

async function loadSelectedSeason(tvId, seasonNumber, seasonName) {
    if (!seasonNumber) return;
    
    const contentContainer = document.getElementById('selected-season-content');
    contentContainer.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        // Load episodes for the selected season
        await loadSeasonEpisodes(tvId, parseInt(seasonNumber), seasonName);
        
    } catch (error) {
        console.error('Error loading selected season:', error);
        contentContainer.innerHTML = '<div class="error-episodes">Failed to load season episodes.</div>';
    }
}

function redirectToExternalEpisodeInfo(episodeName, seasonNumber, episodeNumber) {
    // Create a more specific search query for IMDB
    const searchQuery = encodeURIComponent(`${episodeName} S${seasonNumber.toString().padStart(2, '0')}E${episodeNumber.toString().padStart(2, '0')}`);
    
    // Try to find the episode directly on IMDB
    const imdbUrl = `https://www.imdb.com/find?q=${searchQuery}&s=ep&ref_=fn_ep`;
    window.open(imdbUrl, '_blank');
}

function closeEpisodesModal() {
    document.getElementById('episodes-modal').classList.remove('active');
}

// Discovery Functions
// Pagination state for each discovery type
let discoveryPagination = {
    trending: { page: 1, totalPages: 1, hasMore: false }, // Disabled pagination
    'top-rated': { page: 1, totalPages: 1, hasMore: false }, // Disabled pagination
    upcoming: { page: 1, totalPages: 1, hasMore: false }, // Disabled pagination
    random: { page: 1, totalPages: 1, hasMore: true }
};

// Genre data cache
let genreData = {
    movie: [],
    tv: [],
    loaded: false
};

// Language data cache
let languageData = {
    loaded: false,
    languages: []
};

async function loadDiscoveryContent(type, loadMore = false) {
    const resultsContainer = document.getElementById('discovery-results');
    const trailersSection = document.getElementById('trailers-section');
    const mediaType = document.getElementById('content-type-select').value;
    
    // Show discovery results and hide trailers section
    resultsContainer.style.display = 'block';
    trailersSection.style.display = 'none';
    
    // Store the current type for filter changes
    resultsContainer.dataset.lastType = type;
    
    // If not loading more, reset pagination and show loading
    if (!loadMore) {
        discoveryPagination[type] = { page: 1, totalPages: 1, hasMore: true };
        resultsContainer.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    } else {
        // Show loading on load more button
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            loadMoreBtn.disabled = true;
        }
    }
    
    try {
        let url, title;
        
        switch (type) {
            case 'trending':
                if (hasServerlessFunctions) {
                    url = `/api/trending?media_type=${mediaType}`;
                } else {
                    if (mediaType === 'all') {
                        url = `${API_BASE}/trending/all/week?api_key=${API_KEY}`;
                    } else {
                        url = `${API_BASE}/trending/${mediaType}/week?api_key=${API_KEY}`;
                    }
                }
                title = 'Trending Now';
                break;
                
            case 'top-rated':
                if (hasServerlessFunctions) {
                    url = `/api/top-rated?media_type=${mediaType}`;
                } else {
                    if (mediaType === 'tv') {
                        url = `${API_BASE}/tv/top_rated?api_key=${API_KEY}`;
                    } else if (mediaType === 'movie') {
                        url = `${API_BASE}/movie/top_rated?api_key=${API_KEY}`;
                    } else {
                        // For 'all', we'll fetch both and combine
                        const movieResponse = await fetch(`${API_BASE}/movie/top_rated?api_key=${API_KEY}`);
                        const tvResponse = await fetch(`${API_BASE}/tv/top_rated?api_key=${API_KEY}`);
                        const movieData = await movieResponse.json();
                        const tvData = await tvResponse.json();
                        
                        const combinedResults = [...movieData.results.slice(0, 10), ...tvData.results.slice(0, 10)];
                        displayDiscoveryResults(combinedResults, 'Top Rated Content', loadMore);
                        return;
                    }
                }
                title = mediaType === 'tv' ? 'Top Rated TV Series' : 'Top Rated Movies';
                break;
                
            case 'upcoming':
                if (hasServerlessFunctions) {
                    url = `/api/upcoming?media_type=${mediaType}`;
                } else {
                    if (mediaType === 'tv') {
                        url = `${API_BASE}/tv/on_the_air?api_key=${API_KEY}`;
                    } else if (mediaType === 'movie') {
                        url = `${API_BASE}/movie/upcoming?api_key=${API_KEY}`;
                    } else {
                        // For 'all', we'll fetch both and combine
                        const movieResponse = await fetch(`${API_BASE}/movie/upcoming?api_key=${API_KEY}`);
                        const tvResponse = await fetch(`${API_BASE}/tv/on_the_air?api_key=${API_KEY}`);
                        const movieData = await movieResponse.json();
                        const tvData = await tvResponse.json();
                        
                        const combinedResults = [...movieData.results.slice(0, 10), ...tvData.results.slice(0, 10)];
                        displayDiscoveryResults(combinedResults, 'Coming Soon', loadMore);
                        return;
                    }
                }
                title = mediaType === 'tv' ? 'Currently Airing TV Series' : 'Upcoming Movies';
                break;
                
            case 'random':
                const randomPage = Math.floor(Math.random() * 500) + 1;
                if (hasServerlessFunctions) {
                    url = `/api/discover?page=${randomPage}&media_type=${mediaType}`;
                } else {
                    if (mediaType === 'tv') {
                        url = `${API_BASE}/discover/tv?api_key=${API_KEY}&page=${randomPage}`;
                    } else if (mediaType === 'movie') {
                        url = `${API_BASE}/discover/movie?api_key=${API_KEY}&page=${randomPage}`;
                    } else {
                        // For 'all', pick randomly between movie and tv
                        const randomType = Math.random() > 0.5 ? 'movie' : 'tv';
                        url = `${API_BASE}/discover/${randomType}?api_key=${API_KEY}&page=${randomPage}`;
                    }
                }
                title = 'Random Selection';
                break;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        let results = data.results;
        if (type === 'random') {
            // Shuffle and take first 20 for random
            results = results.sort(() => 0.5 - Math.random()).slice(0, 20);
        }
        
        // Update pagination state only for types that support pagination
        if (type === 'random') {
            discoveryPagination[type].totalPages = data.total_pages || 1;
            discoveryPagination[type].hasMore = discoveryPagination[type].page < discoveryPagination[type].totalPages;
            
            // Increment page for next load more
            if (loadMore) {
                discoveryPagination[type].page++;
            }
        }
        
        displayDiscoveryResults(results, title, loadMore, data);
        
    } catch (error) {
        console.error(`Error loading ${type} content:`, error);
        if (!loadMore) {
            resultsContainer.innerHTML = '<div class="empty-state"><h3>Error</h3><p>Failed to load content. Please try again.</p></div>';
        } else {
            // Reset load more button on error
            const loadMoreBtn = document.getElementById('load-more-btn');
            if (loadMoreBtn) {
                loadMoreBtn.innerHTML = '<i class="fas fa-plus"></i> Load More';
                loadMoreBtn.disabled = false;
            }
        }
    }
}

// Search Function
async function searchContent(query) {
    const resultsContainer = document.getElementById('discovery-results');
    const mediaType = document.querySelector('.filter-btn.active').dataset.type;
    
    try {
        resultsContainer.innerHTML = '<div class="discovery-welcome"><i class="fas fa-spinner fa-spin"></i><h3>Searching...</h3><p>Finding results for "' + query + '"</p></div>';
        
        let searchResults = [];
        
        if (mediaType === 'all') {
            // Search both movies and TV shows
            const [movieResults, tvResults] = await Promise.all([
                searchMovies(query),
                searchTVShows(query)
            ]);
            searchResults = [...movieResults, ...tvResults];
        } else if (mediaType === 'movie') {
            searchResults = await searchMovies(query);
        } else if (mediaType === 'tv') {
            searchResults = await searchTVShows(query);
        }
        
        if (searchResults.length === 0) {
            resultsContainer.innerHTML = '<div class="discovery-welcome"><i class="fas fa-search"></i><h3>No Results Found</h3><p>Try a different search term or check your spelling.</p></div>';
            return;
        }
        
        // Display search results
        displayDiscoveryResults(searchResults, `Search Results for "${query}"`);
        
    } catch (error) {
        console.error('Error searching content:', error);
        resultsContainer.innerHTML = '<div class="discovery-welcome"><i class="fas fa-exclamation-triangle"></i><h3>Search Error</h3><p>Please try again later.</p></div>';
    }
}

async function searchMovies(query) {
    const response = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=1`);
    const data = await response.json();
    return data.results.map(movie => ({ ...movie, media_type: 'movie' }));
}

async function searchTVShows(query) {
    const response = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=1`);
    const data = await response.json();
    return data.results.map(tv => ({ ...tv, media_type: 'tv' }));
}

function displayDiscoveryResults(items, title, loadMore = false, paginationData = null) {
    const resultsContainer = document.getElementById('discovery-results');
    
    if (!items || items.length === 0) {
        if (!loadMore) {
            resultsContainer.innerHTML = '<div class="empty-state"><h3>No Results</h3><p>No content found for this category.</p></div>';
        }
        return;
    }
    
    // If loading more, append to existing results
    if (loadMore) {
        const existingGrid = resultsContainer.querySelector('.discovery-grid');
        if (existingGrid) {
            // Append new items to existing grid
            const newItemsHtml = generateDiscoveryItemsHtml(items);
            existingGrid.insertAdjacentHTML('beforeend', newItemsHtml);
            
            // Update result count
            const resultCount = resultsContainer.querySelector('.discovery-results-header p');
            if (resultCount) {
                const currentCount = parseInt(resultCount.textContent.match(/\d+/)[0]);
                resultCount.textContent = `${currentCount + items.length} results found`;
            }
            
            // Reset load more button
            const loadMoreBtn = document.getElementById('load-more-btn');
            if (loadMoreBtn) {
                loadMoreBtn.innerHTML = '<i class="fas fa-plus"></i> Load More';
                loadMoreBtn.disabled = false;
            }
            
            // Add event listeners for new add buttons
            addDiscoveryEventListeners();
            return;
        }
    }
    
    // Clear previous movie data store if not loading more
    if (!loadMore) {
        movieDataStore = {};
    }
    
    let html = `
        <div class="discovery-results-header">
            <h3>${title}</h3>
            <p>${items.length} results found</p>
        </div>
        <div class="discovery-grid">
    `;
    
    html += generateDiscoveryItemsHtml(items);
    html += '</div>';
    
    // Add load more button if there are more pages and the type supports pagination
    const currentType = resultsContainer.dataset.lastType;
    if (currentType && discoveryPagination[currentType] && discoveryPagination[currentType].hasMore && 
        currentType === 'random') {
        html += `
            <div class="discovery-load-more">
                <button class="btn btn-secondary" id="load-more-btn">
                    <i class="fas fa-plus"></i>
                    Load More
                </button>
            </div>
        `;
    }
    
    resultsContainer.innerHTML = html;
    
    // Scroll to the results section only if not loading more
    if (!loadMore) {
        setTimeout(() => {
            resultsContainer.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }, 100); // Small delay to ensure content is rendered
    }
    
    // Add event listeners for add buttons
    addDiscoveryEventListeners();
}

function generateDiscoveryItemsHtml(items) {
    let html = '';
    
    for (const item of items) {
        const itemTitle = item.title || item.name;
        const releaseDate = item.release_date || item.first_air_date;
        const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
        const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
        const posterPath = item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image';
        const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
        const mediaTypeLabel = mediaType === 'movie' ? 'Movie' : 'TV Series';
        
        // Store movie data for later use
        const movieKey = `${item.id}_${mediaType}`;
        movieDataStore[movieKey] = {
            id: item.id,
            title: itemTitle,
            year: year,
            rating: rating,
            poster_path: item.poster_path, // Store just the path, not full URL
            overview: item.overview || 'No overview available.',
            media_type: mediaType,
            added_date: new Date().toISOString()
        };
        
        html += `
            <div class="discovery-item" onclick="showMovieDetails(${item.id}, '${mediaType}')">
                <div class="discovery-poster">
                    <img src="${posterPath}" alt="${itemTitle}" loading="lazy">
                    <div class="discovery-media-type">${mediaTypeLabel}</div>
                    <div class="discovery-actions">
                        <button class="discovery-add-btn" data-movie-id="${item.id}" data-media-type="${mediaType}" data-movie-title="${itemTitle}" title="Add to Library">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
                <div class="discovery-info">
                    <h4>${itemTitle}</h4>
                    <div class="discovery-meta">
                        <span class="discovery-year">${year}</span>
                        <span class="discovery-rating">
                            <i class="fas fa-star"></i>
                            ${rating}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }
    
    return html;
}

function addDiscoveryEventListeners() {
    const resultsContainer = document.getElementById('discovery-results');
    
    // Add event listeners for add buttons
    resultsContainer.querySelectorAll('.discovery-add-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const movieId = btn.dataset.movieId;
            const mediaType = btn.dataset.mediaType;
            const movieTitle = btn.dataset.movieTitle;
            
            // Get movie data from store
            const movieKey = `${movieId}_${mediaType}`;
            const movieData = movieDataStore[movieKey];
            
            console.log('Movie key:', movieKey);
            console.log('Stored movie data:', movieData);
            
            showLibrarySelectionModal(movieId, mediaType, movieTitle, movieData);
        });
    });
}

// Genre Functions
async function loadGenres() {
    if (genreData.loaded) return;
    
    try {
        const [movieResponse, tvResponse] = await Promise.all([
            fetch(`${API_BASE}/genre/movie/list?api_key=${API_KEY}`),
            fetch(`${API_BASE}/genre/tv/list?api_key=${API_KEY}`)
        ]);
        
        if (!movieResponse.ok) {
            throw new Error(`Movie genres API failed: ${movieResponse.status}`);
        }
        if (!tvResponse.ok) {
            throw new Error(`TV genres API failed: ${tvResponse.status}`);
        }
        
        const movieData = await movieResponse.json();
        const tvData = await tvResponse.json();
        
        genreData.movie = movieData.genres;
        genreData.tv = tvData.genres;
        genreData.loaded = true;
        
        console.log('Genres loaded:', { movie: genreData.movie.length, tv: genreData.tv.length });
        
        // Populate genre dropdown after loading
        populateGenreDropdown();
    } catch (error) {
        console.error('Error loading genres:', error);
    }
}

function populateGenreDropdown() {
    const genreSelect = document.getElementById('genre-select');
    const mediaType = document.getElementById('content-type-select').value;
    
    console.log('Populating genre dropdown for media type:', mediaType);
    
    // Clear existing options except the first one
    genreSelect.innerHTML = '<option value="">All Genres</option>';
    
    let genres = [];
    if (mediaType === 'movie') {
        genres = genreData.movie;
    } else if (mediaType === 'tv') {
        genres = genreData.tv;
    } else {
        // For 'all', combine both and remove duplicates
        const allGenres = [...genreData.movie, ...genreData.tv];
        const uniqueGenres = allGenres.filter((genre, index, self) => 
            index === self.findIndex(g => g.name === genre.name)
        );
        genres = uniqueGenres.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    console.log('Adding genres:', genres.length);
    
    genres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre.id;
        option.textContent = genre.name;
        genreSelect.appendChild(option);
    });
    
    console.log('Genre dropdown populated with', genreSelect.options.length, 'options');
}

// Advanced Search Functions
async function performAdvancedSearch() {
    const query = document.getElementById('find-search-input').value.trim();
    const resultsContainer = document.getElementById('discovery-results');
    const trailersSection = document.getElementById('trailers-section');
    const mediaType = document.getElementById('content-type-select').value;
    
    // Show discovery results and hide trailers section
    resultsContainer.style.display = 'block';
    trailersSection.style.display = 'none';
    
    resultsContainer.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        let results = [];
        let title = 'Search Results';
        
        if (query) {
            // Text search
            results = await performTextSearch(query, mediaType);
            title = `Search Results for "${query}"`;
        } else {
            // Discovery search with filters
            results = await performDiscoverySearch(mediaType);
            title = 'Filtered Results';
        }
        
        if (results.length === 0) {
            resultsContainer.innerHTML = '<div class="empty-state"><h3>No Results Found</h3><p>Try adjusting your search criteria or filters.</p></div>';
            return;
        }
        
        displayDiscoveryResults(results, title);
        
    } catch (error) {
        console.error('Error performing advanced search:', error);
        resultsContainer.innerHTML = '<div class="empty-state"><h3>Search Error</h3><p>Please try again later.</p></div>';
    }
}

async function performTextSearch(query, mediaType) {
    let searchResults = [];
    
    if (mediaType === 'all') {
        const [movieResults, tvResults] = await Promise.all([
            searchMovies(query),
            searchTVShows(query)
        ]);
        searchResults = [...movieResults, ...tvResults];
    } else if (mediaType === 'movie') {
        searchResults = await searchMovies(query);
    } else if (mediaType === 'tv') {
        searchResults = await searchTVShows(query);
    }
    
    return searchResults;
}

async function performDiscoverySearch(mediaType) {
    const filters = getSearchFilters();
    let results = [];
    
    if (mediaType === 'all') {
        const [movieResults, tvResults] = await Promise.all([
            discoverMovies(filters),
            discoverTVShows(filters)
        ]);
        results = [...movieResults, ...tvResults];
    } else if (mediaType === 'movie') {
        results = await discoverMovies(filters);
    } else if (mediaType === 'tv') {
        results = await discoverTVShows(filters);
    }
    
    return results;
}

function getSearchFilters() {
    const yearFrom = document.getElementById('year-from').value;
    const yearTo = document.getElementById('year-to').value;
    const minRating = document.getElementById('min-rating').value;
    const genreId = document.getElementById('genre-select').value;
    const language = document.getElementById('language-select').value;
    const sortBy = document.getElementById('sort-select').value;
    const runtime = document.getElementById('runtime-select').value;
    const status = document.getElementById('status-select').value;
    const includeAdult = true; // Adult content is now always included by default
    
    const filters = {
        sort_by: sortBy,
        include_adult: includeAdult
    };
    
    if (yearFrom) filters['primary_release_date.gte'] = `${yearFrom}-01-01`;
    if (yearTo) filters['primary_release_date.lte'] = `${yearTo}-12-31`;
    if (minRating) filters['vote_average.gte'] = minRating;
    if (genreId) filters['with_genres'] = genreId;
    if (language) filters['with_original_language'] = language;
    if (status) filters['with_status'] = status;
    
    // Runtime filters
    if (runtime === 'short') {
        filters['with_runtime.lte'] = 90;
    } else if (runtime === 'medium') {
        filters['with_runtime.gte'] = 90;
        filters['with_runtime.lte'] = 150;
    } else if (runtime === 'long') {
        filters['with_runtime.gte'] = 150;
    }
    
    return filters;
}

async function discoverMovies(filters) {
    const params = new URLSearchParams({
        api_key: API_KEY,
        ...filters
    });
    
    const response = await fetch(`${API_BASE}/discover/movie?${params}`);
    const data = await response.json();
    return data.results.map(m => ({ ...m, media_type: 'movie' }));
}

async function discoverTVShows(filters) {
    const params = new URLSearchParams({
        api_key: API_KEY,
        ...filters
    });
    
    const response = await fetch(`${API_BASE}/discover/tv?${params}`);
    const data = await response.json();
    return data.results.map(t => ({ ...t, media_type: 'tv' }));
}

function clearAllFilters() {
    document.getElementById('find-search-input').value = '';
    document.getElementById('content-type-select').value = 'all';
    document.getElementById('year-from').value = '';
    document.getElementById('year-to').value = '';
    document.getElementById('min-rating').value = '';
    document.getElementById('genre-select').value = '';
    document.getElementById('language-select').value = '';
    document.getElementById('sort-select').value = 'popularity.desc';
    document.getElementById('runtime-select').value = '';
    document.getElementById('status-select').value = '';
    // Adult content is now always included by default
}

function toggleAdvancedFiltersSection() {
    const advancedFilters = document.getElementById('advanced-filters');
    const toggleBtn = document.getElementById('toggle-advanced-filters');
    
    if (advancedFilters.style.display === 'none' || advancedFilters.style.display === '') {
        advancedFilters.style.display = 'block';
        toggleBtn.classList.add('active');
    } else {
        advancedFilters.style.display = 'none';
        toggleBtn.classList.remove('active');
    }
}

// Language Functions
async function loadLanguages() {
    if (languageData.loaded) return;
    
    try {
        const response = await fetch(`${API_BASE}/configuration/languages?api_key=${API_KEY}`);
        const data = await response.json();
        
        languageData.languages = data.sort((a, b) => a.english_name.localeCompare(b.english_name));
        languageData.loaded = true;
        
        populateLanguageDropdown();
    } catch (error) {
        console.error('Error loading languages:', error);
    }
}

function populateLanguageDropdown() {
    const languageSelect = document.getElementById('language-select');
    
    // Clear existing options except the first one
    languageSelect.innerHTML = '<option value="">All Languages</option>';
    
    // Add popular languages first
    const popularLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'];
    const popularLangs = languageData.languages.filter(lang => popularLanguages.includes(lang.iso_639_1));
    
    popularLangs.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang.iso_639_1;
        option.textContent = lang.english_name;
        languageSelect.appendChild(option);
    });
    
    // Add separator
    const separator = document.createElement('option');
    separator.disabled = true;
    separator.textContent = '──────────────';
    languageSelect.appendChild(separator);
    
    // Add all other languages
    const otherLangs = languageData.languages.filter(lang => !popularLanguages.includes(lang.iso_639_1));
    otherLangs.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang.iso_639_1;
        option.textContent = lang.english_name;
        languageSelect.appendChild(option);
    });
}

function closeMovieModal() {
    document.getElementById('movie-modal').classList.remove('active');
}

function showLibrarySelectionModal(movieId, mediaType, movieTitle, movieData) {
    if (libraries.length === 0) {
        alert('You need to create a library first!');
        return;
    }
    
    // Store the movie data globally for the addToSelectedLibrary function
    window.currentMovieData = movieData;
    
    // Create modal HTML
    const modalHtml = `
        <div class="modal active" id="library-selection-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Add "${movieTitle}" to Library</h3>
                    <button class="close-btn" onclick="closeLibrarySelectionModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <p>Choose which library to add this ${mediaType === 'movie' ? 'movie' : 'TV series'} to:</p>
                    <div class="library-selection-grid">
                        ${libraries.map(library => `
                            <div class="library-selection-item" onclick="addToSelectedLibrary('${library.id}', ${movieId}, '${mediaType}')">
                                <div class="library-icon">
                                    <i class="fas fa-folder"></i>
                                </div>
                                <div class="library-info">
                                    <h4>${library.name}</h4>
                                    <p>${library.movies.length} items</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closeLibrarySelectionModal() {
    const modal = document.getElementById('library-selection-modal');
    if (modal) {
        modal.remove();
    }
    // Clean up the stored movie data
    window.currentMovieData = null;
}

async function addToSelectedLibrary(libraryId, movieId, mediaType) {
    const library = libraries.find(lib => lib.id === libraryId);
    if (!library) {
        alert('Library not found!');
        return;
    }
    
    // Check if item already exists in library
    const existingItem = library.movies.find(movie => movie.id === movieId && movie.media_type === mediaType);
    if (existingItem) {
        alert('This item is already in the selected library!');
        closeLibrarySelectionModal();
        return;
    }
    
    try {
        // Use the stored movie data from the modal
        let movieData = window.currentMovieData;
        
        // If we don't have stored data, fetch from API
        if (!movieData) {
            let url;
            if (hasServerlessFunctions) {
                url = `/api/details?id=${movieId}&type=${mediaType}`;
            } else {
                url = `${API_BASE}/${mediaType}/${movieId}?api_key=${API_KEY}`;
            }
            
            const response = await fetch(url);
            const apiData = await response.json();
            
            movieData = {
                id: apiData.id,
                title: apiData.title || apiData.name,
                year: apiData.release_date ? new Date(apiData.release_date).getFullYear() : 
                      (apiData.first_air_date ? new Date(apiData.first_air_date).getFullYear() : 'N/A'),
                rating: apiData.vote_average ? apiData.vote_average.toFixed(1) : 'N/A',
                poster_path: apiData.poster_path, // Store just the path, not full URL
                overview: apiData.overview || 'No overview available.',
                media_type: mediaType,
                added_date: new Date().toISOString()
            };
        }
        
        console.log('Movie data to add:', movieData); // Debug log
        console.log('Poster path being saved:', movieData.poster_path); // Debug log
        
        library.movies.push(movieData);
        saveData();
        
        console.log('Movie added to library:', library.movies[library.movies.length - 1]); // Debug log
        
        // Close modal and show success
        closeLibrarySelectionModal();
        
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'success-toast';
        successMessage.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>Added to "${library.name}" successfully!</span>
        `;
        document.body.appendChild(successMessage);
        
        setTimeout(() => {
            successMessage.remove();
        }, 3000);
        
    } catch (error) {
        console.error('Error adding item to library:', error);
        alert('Failed to add item to library. Please try again.');
    }
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
    const toggle = document.getElementById('header-dark-mode-toggle');
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
    const toggle = document.getElementById('header-dark-mode-toggle');
    
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

// Settings Dropdown Functions
function toggleHeaderSettingsDropdown() {
    const dropdown = document.getElementById('header-settings-dropdown-menu');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

// Buy Me a Coffee Function
function openBuyMeCoffee() {
    // Close the settings dropdown
    const dropdown = document.getElementById('header-settings-dropdown-menu');
    if (dropdown) {
        dropdown.classList.remove('show');
    }
    
    // Open Buy Me a Coffee page in a new tab
    const buyMeCoffeeUrl = 'https://buymeacoffee.com/streblainnovations';
    window.open(buyMeCoffeeUrl, '_blank');
}

// Data Storage Modal Functions
function showDataStorageModal() {
    const modal = document.getElementById('data-storage-modal');
    if (modal) {
        modal.style.display = 'flex';
        console.log('Data storage modal shown');
    } else {
        console.error('Data storage modal not found');
    }
}

function closeDataStorageModal() {
    const modal = document.getElementById('data-storage-modal');
    if (modal) {
        modal.style.display = 'none';
        // Set a flag so it doesn't show again in this session
        sessionStorage.setItem('dataStorageModalShown', 'true');
        console.log('Data storage modal closed');
    }
}

// Import/Export Functions
function exportData() {
    const data = {
        libraries: libraries,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `reel-minder-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    alert('Data exported successfully!');
}

function importData() {
    const fileInput = document.getElementById('import-file-input');
    fileInput.click();
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (!importedData.libraries || !Array.isArray(importedData.libraries)) {
                alert('Invalid file format. Please select a valid Reel Minder backup file.');
                return;
            }
            
            if (confirm(`This will replace all your current data with ${importedData.libraries.length} libraries from the backup. Are you sure?`)) {
                libraries = importedData.libraries;
                saveData();
                renderLibraries();
                alert('Data imported successfully!');
            }
        } catch (error) {
            alert('Error reading file. Please make sure it\'s a valid JSON file.');
        }
    };
    
    reader.readAsText(file);
    // Reset the input so the same file can be selected again
    event.target.value = '';
}

// Initialize share handling
document.addEventListener('DOMContentLoaded', function() {
    handleShareParams();
    initializeDarkMode();
    displayRandomTagline();
    initializeAds();
    
    // Show data storage modal on first visit
    // Uncomment the next line to test the modal (clears the session flag)
    // sessionStorage.removeItem('dataStorageModalShown');
    
    if (!sessionStorage.getItem('dataStorageModalShown')) {
        setTimeout(() => {
            showDataStorageModal();
        }, 1000); // Show after 1 second
    }
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
