// This script handles the interactive elements on the user profile page.

document.addEventListener('DOMContentLoaded', function() {
    
    // --- Main Tab Switching (Profile, My Events, etc.) ---
    const mainTabButtons = document.querySelectorAll('.tab-btn');
    const mainTabContents = document.querySelectorAll('.tab-content');

    mainTabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Update button styles
            mainTabButtons.forEach(button => button.classList.remove('active-tab'));
            this.classList.add('active-tab');
            
            // Show the corresponding content
            mainTabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
        });
    });

    // --- Nested Event Tab Switching (Interested, Registered, etc.) ---
    const eventTabButtons = document.querySelectorAll('.event-tab-btn');
    const eventTabContents = document.querySelectorAll('.event-tab-content');

    eventTabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const eventTabId = this.getAttribute('data-event-tab');
            
            // Update button styles
            eventTabButtons.forEach(button => {
                button.classList.remove('text-indigo-600', 'border-indigo-600');
                button.classList.add('text-gray-500', 'hover:text-indigo-600');
            });
            this.classList.add('text-indigo-600', 'border-indigo-600');
            this.classList.remove('text-gray-500');
            
            // Show the corresponding content
            eventTabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === eventTabId) {
                    content.classList.add('active');
                }
            });
        });
    });

    // --- Logout Button ---
    const logoutBtn = document.getElementById('logoutBtn');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            // Clear any session data
            localStorage.removeItem('userSession');
            sessionStorage.clear();
            
            // Redirect to login page
            window.location.href = 'login_signup.html';
        });
    }
});
