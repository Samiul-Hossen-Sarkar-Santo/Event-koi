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
        logoutBtn.addEventListener('click', async function() {
            try {
                const response = await fetch('/auth/logout', {
                    method: 'POST',
                    credentials: 'include'
                });

                if (response.ok) {
                    // Clear localStorage and redirect
                    localStorage.removeItem('userSession');
                    localStorage.removeItem('organizerSession');
                    localStorage.removeItem('adminSession');
                    localStorage.removeItem('user');
                    sessionStorage.clear();
                    
                    window.location.href = 'login_signup.html';
                } else {
                    console.error('Logout failed');
                    localStorage.clear();
                    window.location.href = 'login_signup.html';
                }
            } catch (error) {
                console.error('Logout error:', error);
                localStorage.clear();
                window.location.href = 'login_signup.html';
            }
        });
    }
});
