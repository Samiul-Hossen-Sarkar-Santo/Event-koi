// This script handles the interactive elements on the admin dashboard.

document.addEventListener('DOMContentLoaded', function() {
    
    // Load admin data on page load
    loadAdminDashboardData();
    loadPendingApprovals();
    
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

            // Load data based on active tab
            if (tabId === 'approvals') {
                loadPendingApprovals();
            } else if (tabId === 'users') {
                loadUserManagement();
            }
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

    // --- Admin Data Loading Functions ---
    async function loadAdminDashboardData() {
        try {
            const response = await fetch('/events/admin/dashboard-stats', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const stats = await response.json();
                updateAdminDashboardStats(stats);
            } else {
                console.error('Failed to load admin dashboard stats');
            }
        } catch (error) {
            console.error('Error loading admin dashboard data:', error);
        }
    }

    function updateAdminDashboardStats(stats) {
        // Update Total Events
        const totalEventsEl = document.querySelector('.from-blue-500 .text-3xl');
        if (totalEventsEl) totalEventsEl.textContent = stats.totalEvents || 0;

        // Update Active Users (placeholder - would need user stats endpoint)
        const activeUsersEl = document.querySelector('.from-green-500 .text-3xl');
        if (activeUsersEl) activeUsersEl.textContent = stats.totalRegistrations || 0;

        // Update Pending Approvals
        const pendingApprovalsEl = document.querySelector('.from-yellow-500 .text-3xl');
        if (pendingApprovalsEl) pendingApprovalsEl.textContent = stats.pendingApprovals || 0;

        // Update Revenue (placeholder)
        const revenueEl = document.querySelector('.from-red-500 .text-3xl');
        if (revenueEl) revenueEl.textContent = `$${(stats.totalRegistrations * 15).toFixed(0)}`;
    }

    async function loadPendingApprovals() {
        try {
            const response = await fetch('/events/admin/all-events', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const eventGroups = await response.json();
                displayPendingApprovals(eventGroups.pending);
            } else {
                console.error('Failed to load pending approvals');
            }
        } catch (error) {
            console.error('Error loading pending approvals:', error);
        }
    }

    function displayPendingApprovals(pendingEvents) {
        const container = document.querySelector('#approvals .space-y-4');
        if (!container) return;

        if (pendingEvents.length === 0) {
            container.innerHTML = '<div class="text-center py-8 text-gray-500">No pending approvals.</div>';
            return;
        }

        const eventsHTML = pendingEvents.map(event => {
            const eventDate = new Date(event.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            return `
                <div class="bg-white border rounded-lg p-6">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h3 class="text-lg font-semibold text-gray-800">${event.title}</h3>
                            <p class="text-gray-600 mt-1">By: ${event.organizer.name || event.organizer.username}</p>
                            <p class="text-gray-600">Date: ${eventDate}</p>
                            <p class="text-gray-600">Location: ${event.location}</p>
                            <p class="text-sm text-gray-500 mt-2">Category: ${event.category}</p>
                            <p class="text-sm text-gray-700 mt-2">${event.description}</p>
                        </div>
                        <div class="flex space-x-2 ml-4">
                            <button onclick="approveEvent('${event._id}')" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm">
                                <i class="fas fa-check mr-1"></i>Approve
                            </button>
                            <button onclick="rejectEvent('${event._id}')" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm">
                                <i class="fas fa-times mr-1"></i>Reject
                            </button>
                            <a href="event_page.html?id=${event._id}" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm inline-block">
                                <i class="fas fa-eye mr-1"></i>View
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = eventsHTML;
    }

    function loadUserManagement() {
        // Placeholder for user management functionality
        const container = document.querySelector('#users .space-y-4');
        if (container) {
            container.innerHTML = '<div class="text-center py-8 text-gray-500">User management coming soon...</div>';
        }
    }

    // Global functions for event approval/rejection
    window.approveEvent = async function(eventId) {
        try {
            const response = await fetch(`/events/admin/${eventId}/approval`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ approvalStatus: 'approved' }),
                credentials: 'include'
            });

            if (response.ok) {
                alert('Event approved successfully!');
                loadPendingApprovals(); // Reload the list
                loadAdminDashboardData(); // Update stats
            } else {
                alert('Failed to approve event');
            }
        } catch (error) {
            console.error('Error approving event:', error);
            alert('Error approving event');
        }
    };

    window.rejectEvent = async function(eventId) {
        const reason = prompt('Enter rejection reason (optional):');
        
        try {
            const response = await fetch(`/events/admin/${eventId}/approval`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    approvalStatus: 'rejected',
                    rejectionReason: reason 
                }),
                credentials: 'include'
            });

            if (response.ok) {
                alert('Event rejected successfully!');
                loadPendingApprovals(); // Reload the list
                loadAdminDashboardData(); // Update stats
            } else {
                alert('Failed to reject event');
            }
        } catch (error) {
            console.error('Error rejecting event:', error);
            alert('Error rejecting event');
        }
    };
});
