// This script handles all the dynamic functionality of the page.

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    init();

    async function init() {
        // Check user session and update navigation
        await checkUserSession();
        
        // Set up basic event listeners
        setupEventListeners();
        
        // Load categories for homepage
        await loadHomepageCategories();
        
        // Load events on homepage
        const eventsGrid = document.getElementById('events-grid');
        if (eventsGrid) {
            await loadHomePageEvents();
        }
    }

    async function checkUserSession() {
        try {
            const response = await fetch('/auth/check-session', {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const userData = await response.json();
                updateNavigationForUser(userData);
                return userData;
            } else {
                updateNavigationForGuest();
                return null;
            }
        } catch (error) {
            console.error('Session check failed:', error);
            updateNavigationForGuest();
            return null;
        }
    }

    function updateNavigationForUser(userData) {
        const navLinks = document.querySelector('.hidden.md\\:flex.items-center.space-x-6');
        const userSection = document.querySelector('.flex.items-center.space-x-4');
        const mobileMenu = document.getElementById('mobile-menu');

        if (!navLinks || !userSection || !mobileMenu) return;

        // Update main navigation
        let navHTML = `
            <a href="index.html" class="hover:text-gray-200">Home</a>
            <a href="events.html" class="hover:text-gray-200">Events</a>
        `;

        if (userData.role === 'organizer' || userData.role === 'admin') {
            navHTML += `<a href="event_creation.html" class="hover:text-gray-200">Create Event</a>`;
        }

        navLinks.innerHTML = navHTML;

        // Insert user menu between theme toggle and mobile menu button
        const themeToggle = document.getElementById('theme-toggle');
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        
        // Remove existing user menu if present
        const existingUserMenu = userSection.querySelector('.relative');
        if (existingUserMenu) {
            existingUserMenu.remove();
        }

        // Create user menu element
        const userMenuHTML = `
            <div class="relative">
                <button id="user-menu-button" class="flex items-center space-x-2 focus:outline-none">
                    <div class="w-8 h-8 rounded-full bg-white flex items-center justify-center text-purple-700 font-bold">
                        <span>${userData.username ? userData.username.charAt(0).toUpperCase() : 'U'}</span>
                    </div>
                    <span class="hidden md:inline">${userData.username || 'User'}</span>
                    <i class="fas fa-chevron-down text-sm"></i>
                </button>
                
                <div id="user-menu" class="hidden absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50">
                    <a href="${getUserDashboardUrl(userData.role)}" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Dashboard</a>
                    <a href="${getUserDashboardUrl(userData.role)}" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">My Events</a>
                    <a href="${getUserDashboardUrl(userData.role)}" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Profile</a>
                    <div class="border-t border-gray-200 dark:border-gray-700"></div>
                    <button id="logout-btn" class="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Sign out</button>
                </div>
            </div>
        `;

        // Insert before mobile menu button
        if (mobileMenuButton && themeToggle) {
            mobileMenuButton.insertAdjacentHTML('beforebegin', userMenuHTML);
        }

        // Update mobile menu
        let mobileHTML = `
            <a href="index.html" class="block py-2 px-4 hover:bg-white hover:bg-opacity-10 rounded">Home</a>
            <a href="events.html" class="block py-2 px-4 hover:bg-white hover:bg-opacity-10 rounded">Events</a>
        `;

        if (userData.role === 'organizer' || userData.role === 'admin') {
            mobileHTML += `<a href="event_creation.html" class="block py-2 px-4 hover:bg-white hover:bg-opacity-10 rounded">Create Event</a>`;
        }

        mobileHTML += `
            <div class="border-t border-white border-opacity-20 mt-2 pt-2">
                <a href="${getUserDashboardUrl(userData.role)}" class="block py-2 px-4 hover:bg-white hover:bg-opacity-10 rounded">Dashboard</a>
                <a href="${getUserDashboardUrl(userData.role)}" class="block py-2 px-4 hover:bg-white hover:bg-opacity-10 rounded">My Events</a>
                <button id="mobile-logout-btn" class="block w-full text-left py-2 px-4 hover:bg-white hover:bg-opacity-10 rounded">Sign out</button>
            </div>
        `;

        mobileMenu.innerHTML = mobileHTML;

        // Set up user menu and logout functionality
        setupUserMenu();
    }

    function updateNavigationForGuest() {
        const navLinks = document.querySelector('.hidden.md\\:flex.items-center.space-x-6');
        const userSection = document.querySelector('.flex.items-center.space-x-4');
        const mobileMenu = document.getElementById('mobile-menu');

        if (!navLinks || !userSection || !mobileMenu) return;

        // Update main navigation for guests
        navLinks.innerHTML = `
            <a href="index.html" class="hover:text-gray-200">Home</a>
            <a href="events.html" class="hover:text-gray-200">Events</a>
            <a href="login_signup.html" class="hover:text-gray-200">Sign Up as Organizer</a>
        `;

        // Remove existing user menu if present
        const existingUserMenu = userSection.querySelector('.relative');
        if (existingUserMenu) {
            existingUserMenu.remove();
        }

        // Remove existing login button if present
        const existingLoginBtn = userSection.querySelector('a[href="login_signup.html"]');
        if (existingLoginBtn) {
            existingLoginBtn.remove();
        }

        // Insert login button before mobile menu button
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        if (mobileMenuButton) {
            const loginButtonHTML = `
                <a href="login_signup.html" class="bg-white text-purple-700 hover:bg-gray-100 font-semibold py-2 px-4 rounded-lg">
                    Login / Sign Up
                </a>
            `;
            mobileMenuButton.insertAdjacentHTML('beforebegin', loginButtonHTML);
        }

        // Update mobile menu for guests
        mobileMenu.innerHTML = `
            <a href="index.html" class="block py-2 px-4 hover:bg-white hover:bg-opacity-10 rounded">Home</a>
            <a href="events.html" class="block py-2 px-4 hover:bg-white hover:bg-opacity-10 rounded">Events</a>
            <a href="login_signup.html" class="block py-2 px-4 hover:bg-white hover:bg-opacity-10 rounded">Sign Up as Organizer</a>
            <a href="login_signup.html" class="block py-2 px-4 hover:bg-white hover:bg-opacity-10 rounded">Login</a>
        `;
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

    function setupEventListeners() {
        // Theme toggle will be set up after navigation update
        setupThemeToggle();
        
        // Mobile menu toggle will be set up after navigation update
        setupMobileMenu();
        
        // Filter button (if exists)
        const filterButton = document.getElementById('filter-button');
        const expandedFilters = document.getElementById('expanded-filters');
        if (filterButton && expandedFilters) {
            filterButton.addEventListener('click', () => {
                expandedFilters.classList.toggle('hidden');
            });
        }
    }

    function setupThemeToggle() {
        // Set theme from localStorage
        const currentTheme = localStorage.getItem('theme') || 'light';
        if (currentTheme === 'dark') {
            document.documentElement.classList.add('dark');
        }

        // Theme toggle functionality
        document.addEventListener('click', (e) => {
            if (e.target.closest('#theme-toggle')) {
                const html = document.documentElement;
                html.classList.toggle('dark');
                const theme = html.classList.contains('dark') ? 'dark' : 'light';
                localStorage.setItem('theme', theme);
            }
        });
    }

    function setupMobileMenu() {
        document.addEventListener('click', (e) => {
            const mobileMenuButton = e.target.closest('#mobile-menu-button');
            const mobileMenu = document.getElementById('mobile-menu');
            
            if (mobileMenuButton && mobileMenu) {
                mobileMenu.classList.toggle('hidden');
            }
        });
    }

    async function loadHomePageEvents() {
        try {
            const response = await fetch('/events');
            if (response.ok) {
                const events = await response.json();
                allHomeEvents = events;
                filteredHomeEvents = events;
                // Show only first 8 events on homepage (increased for better search results)
                displayHomePageEvents(filteredHomeEvents.slice(0, 8));
                setupHomeSearchListeners();
            } else {
                showEventsError();
            }
        } catch (error) {
            console.error('Error loading events:', error);
            showEventsError();
        }
    }

    async function loadHomepageCategories() {
        const categoriesGrid = document.getElementById('categories-grid');
        if (categoriesGrid && typeof CategoryManager !== 'undefined') {
            await CategoryManager.renderHomepageCategories(categoriesGrid);
        }
        
        // Also load category filters
        const categoryFilters = document.getElementById('category-filters');
        if (categoryFilters && typeof CategoryManager !== 'undefined') {
            await CategoryManager.renderCategoryFilters(categoryFilters, handleHomeSearch, 'all');
        }
    }

    function displayHomepageCategories(categories) {
        const categoriesContainer = document.getElementById('homepage-categories');
        if (!categoriesContainer) return;

        if (categories.length === 0) {
            categoriesContainer.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-tags text-6xl text-gray-400 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">No categories found</h3>
                    <p class="text-gray-500 dark:text-gray-500">Please check back later for updates!</p>
                </div>
            `;
            return;
        }

        categoriesContainer.innerHTML = categories.map(category => createCategoryCard(category)).join('');
        
        // Set up category card interactions if needed
        setupCategoryCardListeners();
    }

    function createCategoryCard(category) {
        return `
            <div class="category-card bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-transform transform hover:scale-105">
                <a href="events.html?category=${category.slug}" class="block p-4">
                    <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">${category.name}</h4>
                    <p class="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">${category.description}</p>
                </a>
            </div>
        `;
    }

    function setupCategoryCardListeners() {
        // Add any specific listeners for category cards if needed
    }

    function setupHomeSearchListeners() {
        const searchInput = document.getElementById('home-search-input');
        const searchButton = document.getElementById('home-search-button');
        const categoryFilters = document.querySelectorAll('.home-category-filter');

        if (searchInput) {
            searchInput.addEventListener('input', debounce(handleHomeSearch, 300));
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleHomeSearch();
                }
            });
        }

        if (searchButton) {
            searchButton.addEventListener('click', handleHomeSearch);
        }

        categoryFilters.forEach(filter => {
            filter.addEventListener('click', (e) => {
                handleHomeCategoryFilter(e.target);
            });
        });
    }

    function handleHomeSearch() {
        const searchTerm = document.getElementById('home-search-input').value.toLowerCase().trim();
        
        if (searchTerm === '') {
            filteredHomeEvents = [...allHomeEvents];
        } else {
            filteredHomeEvents = allHomeEvents.filter(event => 
                event.title.toLowerCase().includes(searchTerm) ||
                event.description.toLowerCase().includes(searchTerm) ||
                event.category.toLowerCase().includes(searchTerm) ||
                event.location.toLowerCase().includes(searchTerm)
            );
        }
        
        displayHomePageEvents(filteredHomeEvents.slice(0, 8));
        
        // If searching, redirect to events page with search query
        if (searchTerm !== '') {
            window.location.href = `events.html?search=${encodeURIComponent(searchTerm)}`;
        }
    }

    function handleHomeCategoryFilter(filterButton) {
        // Update active state
        document.querySelectorAll('.home-category-filter').forEach(btn => {
            btn.classList.remove('bg-purple-100', 'dark:bg-purple-900', 'text-purple-700', 'dark:text-purple-300');
            btn.classList.add('bg-gray-100', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');
        });
        
        filterButton.classList.remove('bg-gray-100', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');
        filterButton.classList.add('bg-purple-100', 'dark:bg-purple-900', 'text-purple-700', 'dark:text-purple-300');

        const category = filterButton.dataset.category;
        
        if (category === 'all') {
            // Redirect to events page
            window.location.href = 'events.html';
        } else {
            // Redirect to events page with category filter
            window.location.href = `events.html?category=${category}`;
        }
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

    function displayHomePageEvents(events) {
        const eventsGrid = document.getElementById('events-grid');
        if (!eventsGrid) return;

        if (events.length === 0) {
            eventsGrid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-calendar-times text-6xl text-gray-400 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">No events yet</h3>
                    <p class="text-gray-500 dark:text-gray-500">Check back soon for exciting events!</p>
                </div>
            `;
            return;
        }

        eventsGrid.innerHTML = events.map(event => createEventCard(event)).join('');
        
        // Set up event card interactions
        setupEventCardListeners();
    }

    function createEventCard(event) {
        const eventDate = new Date(event.date);
        const formattedDate = eventDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
        const formattedTime = eventDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const isOnline = event.location.toLowerCase().includes('online') || event.location.toLowerCase().includes('virtual');
        const isPast = new Date() > eventDate;

        return `
            <div class="event-card bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden" data-event-id="${event._id}">
                <div class="relative">
                    ${event.coverImage ? `
                                        <img src="/uploads/${event.coverImage}" alt="${event.title}" class="w-full h-48 object-cover rounded-lg mr-4">
                                    ` : `
                                        <img src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                         alt="${event.title}" class="w-full h-48 object-cover">
                                    `}
                    <div class="absolute top-3 left-3">
                        <span class="bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                            ${event.category}
                        </span>
                    </div>
                    <div class="absolute top-3 right-3">
                        <button class="favorite-btn w-8 h-8 rounded-full bg-white bg-opacity-80 flex items-center justify-center text-gray-600 hover:text-red-500 transition-colors" data-event-id="${event._id}">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                    ${isPast ? '<div class="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center"><span class="text-white font-semibold">Event Ended</span></div>' : ''}
                </div>
                
                <div class="p-6">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">${event.title}</h3>
                    
                    <div class="space-y-2 mb-4">
                        <div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <i class="fas fa-calendar-alt w-4 mr-2"></i>
                            <span>${formattedDate} at ${formattedTime}</span>
                        </div>
                        <div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <i class="fas ${isOnline ? 'fa-globe' : 'fa-map-marker-alt'} w-4 mr-2"></i>
                            <span class="line-clamp-1">${event.location}</span>
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                            <span class="text-sm text-gray-500 dark:text-gray-400">
                                ${event.registrations?.length || 0} registered
                            </span>
                        </div>
                        <a href="event_page.html?id=${event._id}" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                            View Details
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    function setupEventCardListeners() {
        // Favorite buttons
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                e.preventDefault();
                
                // Check if user is logged in
                const userData = await checkUserSession();
                if (!userData) {
                    window.location.href = 'login_signup.html';
                    return;
                }
                
                const eventId = btn.dataset.eventId;
                await toggleFavorite(eventId, btn);
            });
        });
    }

    async function toggleFavorite(eventId, button) {
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

    function showEventsError() {
        const eventsGrid = document.getElementById('events-grid');
        if (eventsGrid) {
            eventsGrid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-exclamation-triangle text-6xl text-red-400 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">Error loading events</h3>
                    <p class="text-gray-500 dark:text-gray-500">Please try again later</p>
                </div>
            `;
        }
    }

    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transform translate-x-full transition-transform duration-300 ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
        }`;
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
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
});

