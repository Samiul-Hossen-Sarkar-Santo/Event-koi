// This script handles all the dynamic functionality of the page.
// It's best practice to place this script tag right before the closing </body> tag
// or to use the 'defer' attribute in the script tag in the <head>.

// --- Theme Toggle Functionality ---
// Toggles between light and dark mode and saves the user's preference.
const themeToggle = document.getElementById('theme-toggle');
const html = document.documentElement;

// On page load, check for a saved theme in localStorage.
const currentTheme = localStorage.getItem('theme') || 'light';
if (currentTheme === 'dark') {
    html.classList.add('dark');
}

// Add a click event listener to the theme toggle button.
themeToggle.addEventListener('click', () => {
    html.classList.toggle('dark');
    // Save the new theme preference to localStorage.
    const theme = html.classList.contains('dark') ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
});

// --- User Menu Toggle ---
// Shows or hides the user profile dropdown menu.
const userMenuButton = document.getElementById('user-menu-button');
const userMenu = document.getElementById('user-menu');

userMenuButton.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent the click from bubbling up to the document
    userMenu.classList.toggle('hidden');
});

// --- Mobile Menu Toggle ---
// Shows or hides the main navigation menu on smaller screens.
const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileMenu = document.getElementById('mobile-menu');

mobileMenuButton.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
});

// --- Filter Toggle ---
// Expands or collapses the advanced search filters.
const filterButton = document.getElementById('filter-button');
const expandedFilters = document.getElementById('expanded-filters');

filterButton.addEventListener('click', () => {
    expandedFilters.classList.toggle('hidden');
});

// --- Event Details Modal Functionality ---
// Handles opening and closing the detailed view for an event.
const eventModal = document.getElementById('event-modal');
const closeModal = document.getElementById('close-modal');
// Select all "Details" buttons within event cards
const eventDetailButtons = document.querySelectorAll('.event-card button:not(.rounded-full)');

eventDetailButtons.forEach(button => {
    button.addEventListener('click', () => {
        eventModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    });
});

// Function to close the modal
function hideModal() {
    eventModal.classList.add('hidden');
    document.body.style.overflow = 'auto'; // Restore background scrolling
}

closeModal.addEventListener('click', hideModal);

// Close modal when clicking on the background overlay
eventModal.addEventListener('click', (e) => {
    if (e.target === eventModal) {
        hideModal();
    }
});

// --- Favorite Button & Notification Functionality ---
// Toggles the favorite status of an event and shows a confirmation.
const favoriteButtons = document.querySelectorAll('.fa-heart');
const notification = document.getElementById('notification');

favoriteButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent opening the modal when clicking the heart
        
        const isFavorited = button.classList.contains('fas');

        if (!isFavorited) {
            // Add to favorites
            button.classList.remove('far');
            button.classList.add('fas', 'text-red-500');
            
            // Show notification
            notification.classList.remove('hidden');
            setTimeout(() => {
                notification.classList.add('hidden');
            }, 3000); // Hide notification after 3 seconds
        } else {
            // Remove from favorites
            button.classList.remove('fas', 'text-red-500');
            button.classList.add('far');
        }
    });
});

// --- Smooth Scrolling for Anchor Links ---
// Makes page jumps to sections like #events or #categories smooth.
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// --- Global Click Listener to Close Menus ---
// Closes the user menu if a click occurs outside of it.
document.addEventListener('click', (e) => {
    // Close user menu if the click is outside
    if (!userMenu.classList.contains('hidden') && !userMenu.contains(e.target) && !userMenuButton.contains(e.target)) {
        userMenu.classList.add('hidden');
    }
});

// --- Authentication Check ---
// Check if user is logged in when accessing protected pages
function checkAuthentication() {
    const currentPage = window.location.pathname.split('/').pop();
    const hasUserSession = localStorage.getItem('userSession');
    const hasAdminSession = localStorage.getItem('adminSession');
    const hasOrganizerSession = localStorage.getItem('organizerSession');
    
    // Define which pages require authentication
    const protectedPages = ['user.html', 'admin.html', 'organizer.html'];
    
    if(protectedPages.includes(currentPage)) {
        if(!hasUserSession && !hasAdminSession && !hasOrganizerSession) {
            // Redirect to login if no session found
            window.location.href = 'login_signup.html';
        }
    }
}

// Run auth check on page load
if(typeof(Storage) !== "undefined") {
    checkAuthentication();
}

// --- Global Navigation Enhancement ---
// Update navigation based on login status
function updateNavigation() {
    const hasUserSession = localStorage.getItem('userSession');
    const hasAdminSession = localStorage.getItem('adminSession');
    const hasOrganizerSession = localStorage.getItem('organizerSession');
    
    // Find login/logout buttons and update them
    const loginLinks = document.querySelectorAll('a[href="login_signup.html"]');
    
    if(hasUserSession || hasAdminSession || hasOrganizerSession) {
        loginLinks.forEach(link => {
            if(link.textContent.trim() === 'Login') {
                if(hasUserSession) {
                    link.href = 'user.html';
                    link.textContent = 'Profile';
                } else if(hasAdminSession) {
                    link.href = 'admin.html';
                    link.textContent = 'Admin';
                } else if(hasOrganizerSession) {
                    link.href = 'organizer.html';
                    link.textContent = 'Dashboard';
                }
            }
        });
    }
}

// Run navigation update on page load
document.addEventListener('DOMContentLoaded', updateNavigation);

// --- Fetch and Display Events ---
const eventsGrid = document.getElementById('events-grid');

// Function to format date (e.g., "June 15, 2025")
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Function to generate HTML for a single event card
function createEventCardHtml(event) {
    // You might need to adjust how you get image, category, etc., based on your event schema
    // For now, using placeholder or assuming simple fields exist.
    const eventImage = event.image || 'https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'; // Placeholder image
    const eventCategory = event.category || 'General'; // Assuming a category field
    const attendeeCount = event.attendees ? event.attendees.length : 0; // Assuming an attendees array
    const eventDate = event.date ? formatDate(event.date) : 'Date TBD';
    const eventLocation = event.location || 'Location TBD';
    const organizerName = event.organizer ? event.organizer.username : 'Organizer TBD'; // Assuming organizer is populated and has a username

    // Basic date comparison for 'days left' - needs refinement for accuracy
    const registrationEndDate = event.registrationDeadline ? new Date(event.registrationDeadline) : null;
    let registrationStatus = '';
    if (registrationEndDate) {
        const now = new Date();
        const timeDiff = registrationEndDate.getTime() - now.getTime();
        const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        if (daysLeft > 0) {
            registrationStatus = `<span class="text-sm font-semibold text-purple-600 dark:text-purple-400">
                                      <i class="fas fa-clock mr-1"></i> ${daysLeft} days left to register
                                  </span>`;
        } else {
            registrationStatus = `<span class="text-sm font-semibold text-red-600 dark:text-red-400">
                                      <i class="fas fa-clock mr-1"></i> Registration Closed
                                  </span>`;
        }
    }

    return `
        <div class="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md event-card smooth-transition" data-event-id="${event._id}">
            <div class="relative">
                <img src="${eventImage}" alt="${event.title}" class="w-full h-48 object-cover">
                <div class="absolute top-2 right-2">
                    <button class="bg-white dark:bg-gray-800 p-2 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 favorite-button">
                        <i class="far fa-heart text-gray-600 dark:text-gray-300"></i>
                    </button>
                </div>
            </div>
            <div class="p-6">
                <div class="flex justify-between items-start mb-2">
                    <span class="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs font-semibold px-2.5 py-0.5 rounded">${eventCategory}</span>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                        <i class="fas fa-users mr-1"></i> ${attendeeCount} going
                    </div>
                </div>
                <h3 class="text-xl font-bold mb-2 dark:text-white">${event.title}</h3>
                <p class="text-gray-600 dark:text-gray-300 mb-4">${event.description.substring(0, 100)}...</p>

                <div class="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <i class="fas fa-calendar-alt mr-2"></i>
                    <span>${eventDate}</span>
                </div>

                <div class="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <i class="fas fa-map-marker-alt mr-2"></i>
                    <span>${eventLocation}</span>
                </div>

                <div class="flex justify-between items-center">
                    ${registrationStatus}
                    <a href="event_page.html?id=${event._id}" class="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg">
                        Details
                    </a>
                </div>
            </div>
        </div>
    `;
}

async function fetchAndDisplayEvents() {
    // Check if we're on a page with an events grid
    if (!eventsGrid) {
        return; // Exit if not on the homepage or events grid doesn't exist
    }

    try {
        const response = await fetch('/events');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const events = await response.json();

        if (events.length === 0) {
            eventsGrid.innerHTML = '<p class="text-center text-gray-600 dark:text-gray-300 w-full">No approved events found yet.</p>';
            return;
        }

        eventsGrid.innerHTML = ''; // Clear existing dummy content
        events.forEach(event => {
            const eventCardHtml = createEventCardHtml(event);
            eventsGrid.innerHTML += eventCardHtml; // Append each event card
        });

        // Re-attach event listeners for favorite buttons on new elements
        document.querySelectorAll('.event-card .favorite-button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const isFavorited = button.querySelector('.fa-heart').classList.contains('fas');
                if (!isFavorited) {
                    button.querySelector('.fa-heart').classList.remove('far');
                    button.querySelector('.fa-heart').classList.add('fas', 'text-red-500');
                    notification.classList.remove('hidden');
                    setTimeout(() => {
                        notification.classList.add('hidden');
                    }, 3000);
                } else {
                    button.querySelector('.fa-heart').classList.remove('fas', 'text-red-500');
                    button.querySelector('.fa-heart').classList.add('far');
                }
            });
        });

        // Note: You might need to re-attach modal event listeners if the modal is part of the dynamic card.
        // For now, assuming the modal is outside the dynamically generated cards.

    } catch (error) {
        console.error('Error fetching events:', error);
        eventsGrid.innerHTML = '<p class="text-center text-red-500 dark:text-red-400 w-full">Error loading events. Please try again later.</p>';
    }
}

// Call the function to fetch and display events when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    updateNavigation(); // Keep existing navigation update
    
    // Only fetch events if we're on the homepage with events grid
    if (eventsGrid) {
        fetchAndDisplayEvents(); // Fetch and display events
    }
});

