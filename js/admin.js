// This script handles the interactive elements on the admin dashboard.

document.addEventListener('DOMContentLoaded', function() {
    
    // --- Main Tab Switching (Dashboard, Approvals, etc.) ---
    const adminTabButtons = document.querySelectorAll('.admin-tab-btn');
    const adminTabContents = document.querySelectorAll('.admin-tab-content');

    adminTabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-admin-tab');
            
            // Update button styles
            adminTabButtons.forEach(button => button.classList.remove('active-tab'));
            this.classList.add('active-tab');
            
            // Show the corresponding content
            adminTabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
        });
    });

    // --- Logout Button ---
    const logoutBtn = document.getElementById('logoutBtn');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            // Clear any admin session data
            localStorage.removeItem('adminSession');
            sessionStorage.clear();
            
            // Redirect to login page
            window.location.href = 'login_signup.html';
        });
    }
});
