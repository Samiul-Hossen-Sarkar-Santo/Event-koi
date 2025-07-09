// Events page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    let allEvents = [];
    let filteredEvents = [];
    let currentPage = 1;
    let eventsPerPage = 9;
    let currentView = 'grid';
    let currentUser = null;

    // Initialize the page
    init();

    async function init() {
        // Check user session and update navigation
        await checkUserSession();
        
        // Load categories for filters
        await loadEventCategories();
        
        // Load events
        await loadEvents();
        
        // Set up event listeners
        setupEventListeners();
        
        // Apply URL filters after categories are loaded
        applyUrlFilters();
    }

    async function checkUserSession() {
        try {
            const response = await fetch('/auth/check-session', {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const userData = await response.json();
                currentUser = userData;
                updateNavigationForUser(userData);
            } else {
                updateNavigationForGuest();
            }
        } catch (error) {
            console.error('Session check failed:', error);
            updateNavigationForGuest();
        }
    }

    function updateNavigationForUser(userData) {
        const navLinks = document.querySelector('.hidden.md\\:flex.items-center.space-x-8');
        const userSection = document.querySelector('.flex.items-center.space-x-4');
        const mobileMenu = document.getElementById('mobile-menu');

        if (!navLinks || !userSection || !mobileMenu) return;

        // Update main navigation
        let navHTML = `
            <a href="index.html" class="text-gray-600 hover:text-gray-900 font-medium transition-colors">Home</a>
            <a href="events.html" class="text-gray-600 hover:text-gray-900 font-medium transition-colors">Events</a>
        `;

        if (userData.role === 'organizer' || userData.role === 'admin') {
            navHTML += `<a href="event_creation.html" class="text-gray-600 hover:text-gray-900 font-medium transition-colors">Create Event</a>`;
        }

        navLinks.innerHTML = navHTML;

        // Insert user menu between mobile menu button
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        
        // Remove existing user menu if present
        const existingUserMenu = userSection.querySelector('.relative');
        if (existingUserMenu) {
            existingUserMenu.remove();
        }

        // Create user menu element
        const userMenuHTML = `
            <div class="relative">
                <button id="user-menu-button" class="flex items-center space-x-2 focus:outline-none bg-gray-100 hover:bg-gray-200 py-2 px-3 rounded-lg transition-colors">
                    <div class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold text-sm">
                        <span>${userData.username ? userData.username.charAt(0).toUpperCase() : 'U'}</span>
                    </div>
                    <span class="hidden md:inline text-gray-700 font-medium">${userData.username || 'User'}</span>
                    <i class="fas fa-chevron-down text-sm text-gray-500"></i>
                </button>
                
                <div id="user-menu" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-200">
                    <a href="${getUserDashboardUrl(userData.role)}" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Dashboard</a>
                    <a href="${getUserDashboardUrl(userData.role)}" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">My Events</a>
                    <a href="${getUserDashboardUrl(userData.role)}" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Profile</a>
                    <div class="border-t border-gray-200 my-1"></div>
                    <button id="logout-btn" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Sign out</button>
                </div>
            </div>
        `;

        // Insert the user menu before the mobile menu button
        mobileMenuButton.insertAdjacentHTML('beforebegin', userMenuHTML);

        // Update mobile menu
        let mobileHTML = `
            <a href="index.html" class="block py-2 px-4 hover:bg-gray-100 rounded">Home</a>
            <a href="events.html" class="block py-2 px-4 hover:bg-gray-100 rounded">Events</a>
        `;

        if (userData.role === 'organizer' || userData.role === 'admin') {
            mobileHTML += `<a href="event_creation.html" class="block py-2 px-4 hover:bg-gray-100 rounded">Create Event</a>`;
        }

        mobileHTML += `
            <div class="border-t border-gray-200 mt-2 pt-2">
                <a href="${getUserDashboardUrl(userData.role)}" class="block py-2 px-4 hover:bg-gray-100 rounded">Dashboard</a>
                <a href="${getUserDashboardUrl(userData.role)}" class="block py-2 px-4 hover:bg-gray-100 rounded">My Events</a>
                <button id="mobile-logout-btn" class="block w-full text-left py-2 px-4 hover:bg-gray-100 rounded">Sign out</button>
            </div>
        `;

        mobileMenu.innerHTML = mobileHTML;

        // Set up user menu and logout functionality
        setupUserMenu();
    }

    function updateNavigationForGuest() {
        // For guests, the navigation is static in the HTML
        // Just ensure mobile menu is set up correctly
        const mobileMenu = document.getElementById('mobile-menu');
        
        if (mobileMenu) {
            // Update mobile menu for guests
            mobileMenu.innerHTML = `
                <a href="index.html" class="block py-2 px-4 hover:bg-gray-100 rounded">Home</a>
                <a href="events.html" class="block py-2 px-4 hover:bg-gray-100 rounded">Events</a>
                <a href="event_creation.html" class="block py-2 px-4 hover:bg-gray-100 rounded">Create Event</a>
                <a href="login_signup.html" class="block py-2 px-4 hover:bg-gray-100 rounded">Join Now</a>
            `;
        }
    }

    function getUserDashboardUrl(role) {
        switch (role) {
            case 'admin': return 'admin.html';
            case 'organizer': return 'organizer.html';
            default: return 'user.html';
        }
    }

    function setupUserMenu() {
        const userMenuButton = document.getElementById('user-menu-button');
        const userMenu = document.getElementById('user-menu');
        const logoutBtn = document.getElementById('logout-btn');
        const mobileLogoutBtn = document.getElementById('mobile-logout-btn');

        if (userMenuButton && userMenu) {
            userMenuButton.addEventListener('click', (e) => {
                e.stopPropagation();
                userMenu.classList.toggle('hidden');
            });

            // Close menu when clicking outside
            document.addEventListener('click', () => {
                userMenu.classList.add('hidden');
            });
        }

        // Logout functionality
        [logoutBtn, mobileLogoutBtn].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', handleLogout);
            }
        });
    }

    async function handleLogout() {
        try {
            const response = await fetch('/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                // Clear any localStorage items
                localStorage.removeItem('userSession');
                localStorage.removeItem('organizerSession');
                localStorage.removeItem('adminSession');
                localStorage.removeItem('user');
                
                // Redirect to home page
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error('Logout failed:', error);
            // Fallback: still redirect
            window.location.href = 'index.html';
        }
    }

    async function loadEvents() {
        try {
            const response = await fetch('/events');
            if (response.ok) {
                allEvents = await response.json();
                filteredEvents = [...allEvents];
                displayEvents();
                updateEventsCount();
            } else {
                showNoEventsState();
            }
        } catch (error) {
            console.error('Error loading events:', error);
            showNoEventsState();
        } finally {
            hideLoadingState();
        }
    }

    function setupEventListeners() {
        // Mobile menu toggle
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenuButton && mobileMenu) {
            mobileMenuButton.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }

        // Search functionality
        const searchInput = document.getElementById('search-input');
        const searchButton = document.getElementById('search-button');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(handleSearch, 300));
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleSearch();
            });
        }
        if (searchButton) {
            searchButton.addEventListener('click', handleSearch);
        }

        // Category filters are now handled by CategoryManager
        // No need to set up static listeners here

        // Advanced filters toggle
        const advancedFiltersToggle = document.getElementById('advanced-filters-toggle');
        const advancedFilters = document.getElementById('advanced-filters');
        const advancedFiltersIcon = document.getElementById('advanced-filters-icon');
        
        if (advancedFiltersToggle && advancedFilters) {
            advancedFiltersToggle.addEventListener('click', () => {
                advancedFilters.classList.toggle('hidden');
                advancedFiltersIcon.classList.toggle('rotate-180');
            });
        }

        // Filter controls
        const applyFiltersBtn = document.getElementById('apply-filters');
        const clearFiltersBtn = document.getElementById('clear-filters');
        
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', applyAdvancedFilters);
        }
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', clearAllFilters);
        }

        // View toggle
        const viewToggle = document.getElementById('view-toggle');
        if (viewToggle) {
            viewToggle.addEventListener('click', toggleView);
        }

        // Pagination
        const prevPageBtn = document.getElementById('prev-page');
        const nextPageBtn = document.getElementById('next-page');
        
        if (prevPageBtn) {
            prevPageBtn.addEventListener('click', () => changePage(currentPage - 1));
        }
        if (nextPageBtn) {
            nextPageBtn.addEventListener('click', () => changePage(currentPage + 1));
        }
    }

    function applyUrlFilters() {
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('category');
        
        if (category) {
            const categoryFilter = document.querySelector(`[data-category="${category}"]`);
            if (categoryFilter) {
                handleCategoryFilter(categoryFilter);
            }
        }
    }

    function handleSearch() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
        
        if (searchTerm === '') {
            filteredEvents = [...allEvents];
        } else {
            filteredEvents = allEvents.filter(event => 
                event.title.toLowerCase().includes(searchTerm) ||
                event.description.toLowerCase().includes(searchTerm) ||
                event.organizerName.toLowerCase().includes(searchTerm) ||
                event.category.toLowerCase().includes(searchTerm)
            );
        }
        
        currentPage = 1;
        displayEvents();
        updateEventsCount();
    }

    function handleCategoryFilter(filterButtonOrCategory) {
        let category;
        
        // Handle both button objects and direct category strings
        if (typeof filterButtonOrCategory === 'string') {
            category = filterButtonOrCategory;
            // Update active state for button with this category
            document.querySelectorAll('.category-filter').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.category === category) {
                    btn.classList.add('active');
                }
            });
        } else {
            // Handle button object
            const filterButton = filterButtonOrCategory;
            document.querySelectorAll('.category-filter').forEach(btn => {
                btn.classList.remove('active');
            });
            filterButton.classList.add('active');
            category = filterButton.dataset.category;
        }
        
        if (category === 'all') {
            filteredEvents = [...allEvents];
        } else {
            filteredEvents = allEvents.filter(event => 
                event.category.toLowerCase() === category.toLowerCase()
            );
        }
        
        currentPage = 1;
        displayEvents();
        updateEventsCount();
    }

    function applyAdvancedFilters() {
        const dateFrom = document.getElementById('date-from').value;
        const dateTo = document.getElementById('date-to').value;
        const location = document.getElementById('location-filter').value;
        const status = document.getElementById('status-filter').value;
        const sortBy = document.getElementById('sort-filter').value;

        let filtered = [...allEvents];

        // Apply date filter
        if (dateFrom) {
            filtered = filtered.filter(event => new Date(event.date) >= new Date(dateFrom));
        }
        if (dateTo) {
            filtered = filtered.filter(event => new Date(event.date) <= new Date(dateTo));
        }

        // Apply location filter
        if (location !== 'all') {
            if (location === 'online') {
                filtered = filtered.filter(event => event.location.toLowerCase().includes('online') || event.location.toLowerCase().includes('virtual'));
            } else if (location === 'offline') {
                filtered = filtered.filter(event => !event.location.toLowerCase().includes('online') && !event.location.toLowerCase().includes('virtual'));
            }
        }

        // Apply status filter
        if (status !== 'all') {
            const now = new Date();
            filtered = filtered.filter(event => {
                const eventDate = new Date(event.date);
                const eventEndDate = new Date(event.endDate || event.date);
                
                switch (status) {
                    case 'upcoming':
                        return eventDate > now;
                    case 'ongoing':
                        return eventDate <= now && eventEndDate >= now;
                    case 'past':
                        return eventEndDate < now;
                    default:
                        return true;
                }
            });
        }

        // Apply sorting
        switch (sortBy) {
            case 'date':
                filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
                break;
            case 'popularity':
                filtered.sort((a, b) => (b.registrations?.length || 0) - (a.registrations?.length || 0));
                break;
            case 'newest':
                filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'alphabetical':
                filtered.sort((a, b) => a.title.localeCompare(b.title));
                break;
        }

        filteredEvents = filtered;
        currentPage = 1;
        displayEvents();
        updateEventsCount();
    }

    function clearAllFilters() {
        // Reset all filter controls
        document.getElementById('search-input').value = '';
        document.getElementById('date-from').value = '';
        document.getElementById('date-to').value = '';
        document.getElementById('location-filter').value = 'all';
        document.getElementById('status-filter').value = 'all';
        document.getElementById('sort-filter').value = 'date';

        // Reset category filter
        document.querySelectorAll('.category-filter').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector('[data-category="all"]').classList.add('active');

        // Reset events
        filteredEvents = [...allEvents];
        currentPage = 1;
        displayEvents();
        updateEventsCount();
    }

    function displayEvents() {
        const startIndex = (currentPage - 1) * eventsPerPage;
        const endIndex = startIndex + eventsPerPage;
        const eventsToShow = filteredEvents.slice(startIndex, endIndex);

        const eventsGrid = document.getElementById('events-grid');
        const eventsContainer = document.getElementById('events-container');
        const noEventsState = document.getElementById('no-events-state');

        if (eventsToShow.length === 0) {
            eventsContainer.classList.add('hidden');
            noEventsState.classList.remove('hidden');
            return;
        }

        eventsContainer.classList.remove('hidden');
        noEventsState.classList.add('hidden');

        eventsGrid.innerHTML = eventsToShow.map(event => createEventCard(event)).join('');
        updatePagination();

        // Set up event card interactions
        setupEventCardListeners();
    }

    function createEventCard(event) {
        const eventDate = new Date(event.date);
        const formattedDate = eventDate.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        const formattedTime = eventDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const isOnline = event.location.toLowerCase().includes('online') || event.location.toLowerCase().includes('virtual');
        const isPast = new Date() > eventDate;

        const imageHtml = event.coverImage ? 
            `<img src="/uploads/${event.coverImage}" alt="${event.title}" class="w-full h-48 object-cover">` : 
            `<img src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" alt="${event.title}" class="w-full h-48 object-cover">`;
        
        const pastEventOverlay = isPast ? '<div class="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center"><span class="text-white font-semibold">Event Ended</span></div>' : '';
        
        const heartIcon = currentUser && currentUser.favoriteEvents?.includes(event._id) ? 'text-red-500' : '';
        const locationIcon = isOnline ? 'fa-globe' : 'fa-map-marker-alt';
        const price = event.registrationFee > 0 ? '$' + event.registrationFee : 'Free';

        return `<div class="event-card bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden" data-event-id="${event._id}">
                <div class="relative">
                    ${imageHtml}
                    <div class="absolute top-3 left-3">
                        <span class="bg-gray-700 text-white px-2 py-1 rounded-full text-xs font-semibold">
                            ${event.category}
                        </span>
                    </div>
                    <div class="absolute top-3 right-3">
                        <button class="favorite-btn w-8 h-8 rounded-full bg-white bg-opacity-80 flex items-center justify-center text-gray-600 hover:text-red-500 transition-colors" data-event-id="${event._id}">
                            <i class="fas fa-heart ${heartIcon}"></i>
                        </button>
                    </div>
                    ${pastEventOverlay}
                </div>
                
                <div class="p-6">
                    <h3 class="text-xl font-bold text-gray-900 mb-2 line-clamp-2">${event.title}</h3>
                    
                    <div class="space-y-2 mb-4">
                        <div class="flex items-center text-sm text-gray-600">
                            <i class="fas fa-calendar-alt w-4 mr-2"></i>
                            <span>${formattedDate} at ${formattedTime}</span>
                        </div>
                        <div class="flex items-center text-sm text-gray-600">
                            <i class="fas ${locationIcon} w-4 mr-2"></i>
                            <span class="line-clamp-1">${event.location}</span>
                        </div>
                        <div class="flex items-center text-sm text-gray-600">
                            <i class="fas fa-user w-4 mr-2"></i>
                            <span>by ${event.organizerName}</span>
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                            <span class="text-sm text-gray-600">
                                ${event.registrations?.length || 0} registered
                            </span>
                            <span class="text-gray-800 font-semibold text-sm">
                                ${price}
                            </span>
                        </div>
                        <a href="event_page.html?id=${event._id}" class="view-details-btn bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                            View Details
                        </a>
                    </div>
                </div>
            </div>`;
    }

    function setupEventCardListeners() {
        // View details buttons
        document.querySelectorAll('.view-details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const eventId = btn.dataset.eventId;
                showEventModal(eventId);
            });
        });

        // Favorite buttons
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const eventId = btn.dataset.eventId;
                toggleFavorite(eventId, btn);
            });
        });
    }

    async function toggleFavorite(eventId, button) {
        if (!currentUser) {
            // Redirect to login if not authenticated
            window.location.href = 'login_signup.html';
            return;
        }

        try {
            const response = await fetch('/users/toggle-favorite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ eventId })
            });

            if (response.ok) {
                const result = await response.json();
                const heartIcon = button.querySelector('i');
                
                if (result.isFavorite) {
                    heartIcon.classList.add('text-red-500');
                    showNotification('Added to favorites!', 'success');
                } else {
                    heartIcon.classList.remove('text-red-500');
                    showNotification('Removed from favorites', 'info');
                }
            } else {
                showNotification('Failed to update favorites', 'error');
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            showNotification('Something went wrong', 'error');
        }
    }

    async function showEventModal(eventId) {
        const event = allEvents.find(e => e._id === eventId);
        if (!event) return;

        const modal = document.getElementById('event-modal');
        const modalContent = modal.querySelector('.relative');

        modalContent.innerHTML = createEventModalContent(event);
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        // Set up modal close functionality
        setupModalListeners();
    }

    function createEventModalContent(event) {
        const eventDate = new Date(event.date);
        const formattedDate = eventDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const formattedTime = eventDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const isRegistered = currentUser && event.registrations?.some(reg => reg.userId === currentUser._id);
        const isPast = new Date() > eventDate;
        
        const imageUrl = event.coverImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
        const price = event.registrationFee > 0 ? '$' + event.registrationFee : 'Free';
        
        let actionButtons = '';
        if (!isPast) {
            if (currentUser) {
                if (isRegistered) {
                    actionButtons = '<span class="px-4 py-2 bg-green-100 text-green-800 rounded-lg">Already Registered</span>';
                } else {
                    actionButtons = `<button id="register-btn" class="px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-lg hover:from-gray-800 hover:to-gray-900" data-event-id="${event._id}">Register Now</button>`;
                }
            } else {
                actionButtons = '<button id="login-to-register-btn" class="px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-lg hover:from-gray-800 hover:to-gray-900">Login to Register</button>';
            }
        }

        return `<div class="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 class="text-2xl font-bold text-gray-900">${event.title}</h2>
                <button id="close-modal" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <div class="p-6 max-h-96 overflow-y-auto">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <img src="${imageUrl}" alt="${event.title}" class="w-full h-64 object-cover rounded-lg">
                    </div>
                    
                    <div class="space-y-4">
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">Event Details</h3>
                            <div class="space-y-2">
                                <div class="flex items-center text-gray-600">
                                    <i class="fas fa-calendar-alt w-5 mr-3"></i>
                                    <span>${formattedDate} at ${formattedTime}</span>
                                </div>
                                <div class="flex items-center text-gray-600">
                                    <i class="fas fa-map-marker-alt w-5 mr-3"></i>
                                    <span>${event.location}</span>
                                </div>
                                <div class="flex items-center text-gray-600">
                                    <i class="fas fa-user w-5 mr-3"></i>
                                    <span>Organized by ${event.organizerName}</span>
                                </div>
                                <div class="flex items-center text-gray-600">
                                    <i class="fas fa-tag w-5 mr-3"></i>
                                    <span>${event.category}</span>
                                </div>
                                <div class="flex items-center text-gray-600">
                                    <i class="fas fa-dollar-sign w-5 mr-3"></i>
                                    <span>${price}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">Registration</h3>
                            <p class="text-gray-600">
                                ${event.registrations?.length || 0} people registered
                            </p>
                        </div>
                    </div>
                </div>
                
                <div class="mt-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                    <p class="text-gray-600 leading-relaxed">${event.description}</p>
                </div>
            </div>
            
            <div class="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button id="close-modal-btn" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    Close
                </button>
                ${actionButtons}
            </div>`;
    }

    function setupModalListeners() {
        const modal = document.getElementById('event-modal');
        const closeModalBtn = document.getElementById('close-modal');
        const closeModalBtnBottom = document.getElementById('close-modal-btn');
        const registerBtn = document.getElementById('register-btn');
        const loginToRegisterBtn = document.getElementById('login-to-register-btn');

        function closeModal() {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }

        [closeModalBtn, closeModalBtnBottom].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', closeModal);
            }
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        if (registerBtn) {
            registerBtn.addEventListener('click', () => {
                const eventId = registerBtn.dataset.eventId;
                window.location.href = `event_page.html?id=${eventId}`;
            });
        }

        if (loginToRegisterBtn) {
            loginToRegisterBtn.addEventListener('click', () => {
                window.location.href = 'login_signup.html';
            });
        }
    }

    function updatePagination() {
        const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
        const prevPageBtn = document.getElementById('prev-page');
        const nextPageBtn = document.getElementById('next-page');
        const pageNumbers = document.getElementById('page-numbers');

        // Update prev/next buttons
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;

        // Generate page numbers
        let paginationHTML = '';
        const maxVisiblePages = 5;
        const halfVisible = Math.floor(maxVisiblePages / 2);

        let startPage = Math.max(1, currentPage - halfVisible);
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === currentPage;
            const buttonClass = isActive ? 'bg-gray-700 text-white' : 'text-gray-700 hover:bg-gray-100';
            paginationHTML += `<button class="page-number px-3 py-2 rounded-lg border border-gray-300 ${buttonClass}" data-page="${i}">${i}</button>`;
        }

        pageNumbers.innerHTML = paginationHTML;

        // Set up page number click handlers
        document.querySelectorAll('.page-number').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page);
                changePage(page);
            });
        });
    }

    function changePage(page) {
        const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
        if (page >= 1 && page <= totalPages) {
            currentPage = page;
            displayEvents();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    function toggleView() {
        const viewToggle = document.getElementById('view-toggle');
        const viewIcon = document.getElementById('view-icon');
        const viewText = document.getElementById('view-text');
        const eventsGrid = document.getElementById('events-grid');

        if (currentView === 'grid') {
            currentView = 'list';
            viewIcon.className = 'fas fa-th';
            viewText.textContent = 'Grid View';
            eventsGrid.className = 'space-y-4';
            eventsPerPage = 5;
        } else {
            currentView = 'grid';
            viewIcon.className = 'fas fa-list';
            viewText.textContent = 'List View';
            eventsGrid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
            eventsPerPage = 9;
        }

        currentPage = 1;
        displayEvents();
    }

    function updateEventsCount() {
        const eventsCount = document.getElementById('events-count');
        eventsCount.textContent = filteredEvents.length + ' event' + (filteredEvents.length !== 1 ? 's' : '') + ' found';
    }

    function hideLoadingState() {
        document.getElementById('loading-state').classList.add('hidden');
    }

    function showNoEventsState() {
        document.getElementById('loading-state').classList.add('hidden');
        document.getElementById('no-events-state').classList.remove('hidden');
    }

    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        let bgColor = 'bg-blue-500 text-white';
        if (type === 'success') bgColor = 'bg-green-500 text-white';
        if (type === 'error') bgColor = 'bg-red-500 text-white';
        
        notification.className = 'fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transform translate-x-full transition-transform duration-300 ' + bgColor;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Slide in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);

        // Slide out and remove
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    async function loadEventCategories() {
        const categoryFilters = document.getElementById('category-filters');
        if (categoryFilters && typeof CategoryManager !== 'undefined') {
            await CategoryManager.renderEventsCategoryFilters(categoryFilters, handleCategoryFilter, 'all');
        }
    }
});
