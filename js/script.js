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
