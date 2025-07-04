// This script handles the interactive elements on the admin dashboard.

document.addEventListener('DOMContentLoaded', function() {
    
    // Check admin authentication first
    checkAdminAuth();
    
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

    async function loadUserManagement() {
        try {
            const response = await fetch('/users/admin/all?limit=50', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                displayUserManagement(data.users);
            } else {
                console.error('Failed to load users');
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    function displayUserManagement(users) {
        const container = document.querySelector('#users .space-y-4');
        if (!container) return;

        if (users.length === 0) {
            container.innerHTML = '<div class="text-center py-8 text-gray-500">No users found.</div>';
            return;
        }

        const usersHTML = users.map(user => {
            const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            const statusColor = {
                'active': 'bg-green-100 text-green-800',
                'suspended': 'bg-yellow-100 text-yellow-800',
                'banned': 'bg-red-100 text-red-800'
            }[user.accountStatus || 'active'];

            const roleColor = {
                'admin': 'bg-purple-100 text-purple-800',
                'organizer': 'bg-blue-100 text-blue-800',
                'user': 'bg-gray-100 text-gray-800'
            }[user.role];

            return `
                <div class="bg-white border rounded-lg p-6">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <div class="flex items-center gap-3 mb-2">
                                <h3 class="text-lg font-semibold text-gray-800">${user.name || user.username}</h3>
                                <span class="px-2 py-1 text-xs font-medium rounded-full ${roleColor}">${user.role}</span>
                                <span class="px-2 py-1 text-xs font-medium rounded-full ${statusColor}">${user.accountStatus || 'active'}</span>
                            </div>
                            <p class="text-gray-600 text-sm">@${user.username} • ${user.email}</p>
                            <p class="text-gray-500 text-sm mt-1">Joined: ${joinDate}</p>
                            <div class="mt-2 text-sm text-gray-600">
                                <span class="mr-4">Events: ${user.stats?.eventsCreated || 0}</span>
                                <span class="mr-4">Registrations: ${user.stats?.registrations || 0}</span>
                            </div>
                        </div>
                        <div class="flex space-x-2 ml-4">
                            ${user.accountStatus !== 'suspended' ? 
                                `<button onclick="suspendUser('${user._id}', '${user.username}')" class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm">
                                    <i class="fas fa-pause mr-1"></i>Suspend
                                </button>` : 
                                `<button onclick="activateUser('${user._id}', '${user.username}')" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">
                                    <i class="fas fa-play mr-1"></i>Activate
                                </button>`
                            }
                            ${user.role !== 'admin' ? 
                                `<button onclick="banUser('${user._id}', '${user.username}')" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
                                    <i class="fas fa-ban mr-1"></i>Ban
                                </button>` : ''
                            }
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = usersHTML;
    }

    // Check admin authentication
    async function checkAdminAuth() {
        try {
            const response = await fetch('/auth/admin-check', {
                credentials: 'include'
            });
            
            if (!response.ok) {
                // Redirect to admin portal if not authenticated
                window.location.href = '/admin-portal.html';
                return;
            }
            
            const authData = await response.json();
            if (!authData.authenticated || !authData.isAdmin) {
                window.location.href = '/admin-portal.html';
                return;
            }
            
            // Update admin info in UI if needed
            console.log('Admin authenticated:', authData);
            
        } catch (error) {
            console.error('Error checking admin auth:', error);
            window.location.href = '/admin-portal.html';
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

    // Global functions for user management
    window.suspendUser = async function(userId, username) {
        if (!confirm(`Are you sure you want to suspend user "${username}"?`)) return;
        
        const reason = prompt('Reason for suspension (optional):');
        
        try {
            const response = await fetch(`/users/admin/${userId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    status: 'suspended',
                    reason: reason || 'Suspended by admin'
                }),
                credentials: 'include'
            });

            if (response.ok) {
                alert('User suspended successfully!');
                loadUserManagement(); // Reload the list
            } else {
                const error = await response.json();
                alert('Failed to suspend user: ' + error.message);
            }
        } catch (error) {
            console.error('Error suspending user:', error);
            alert('Error suspending user');
        }
    };

    window.activateUser = async function(userId, username) {
        if (!confirm(`Are you sure you want to activate user "${username}"?`)) return;
        
        try {
            const response = await fetch(`/users/admin/${userId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    status: 'active',
                    reason: 'Reactivated by admin'
                }),
                credentials: 'include'
            });

            if (response.ok) {
                alert('User activated successfully!');
                loadUserManagement(); // Reload the list
            } else {
                const error = await response.json();
                alert('Failed to activate user: ' + error.message);
            }
        } catch (error) {
            console.error('Error activating user:', error);
            alert('Error activating user');
        }
    };

    window.banUser = async function(userId, username) {
        if (!confirm(`Are you sure you want to BAN user "${username}"? This is a serious action!`)) return;
        
        const reason = prompt('Reason for ban (required):');
        if (!reason) {
            alert('A reason is required to ban a user.');
            return;
        }
        
        try {
            const response = await fetch(`/users/admin/${userId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    status: 'banned',
                    reason: reason
                }),
                credentials: 'include'
            });

            if (response.ok) {
                alert('User banned successfully!');
                loadUserManagement(); // Reload the list
            } else {
                const error = await response.json();
                alert('Failed to ban user: ' + error.message);
            }
        } catch (error) {
            console.error('Error banning user:', error);
            alert('Error banning user');
        }
    };

});
