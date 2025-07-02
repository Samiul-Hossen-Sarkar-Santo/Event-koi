// Comprehensive Admin Dashboard Script
// Handles all admin functionality including event moderation, user management, reports, and accountability

document.addEventListener('DOMContentLoaded', function() {
    
    // Check admin authentication first
    checkAdminAuth();
    
    // Load initial data
    loadDashboardStats();
    loadPendingCounts();
    
    // --- Main Tab Switching ---
    setupTabSwitching();
    
    // --- Setup Event Listeners ---
    setupEventListeners();

    // ==================== AUTHENTICATION ====================
    
    async function checkAdminAuth() {
        try {
            const response = await fetch('/auth/admin-check', {
                credentials: 'include'
            });
            
            if (!response.ok) {
                window.location.href = '/admin-portal.html';
                return;
            }
            
            const authData = await response.json();
            if (!authData.authenticated || !authData.isAdmin) {
                window.location.href = '/admin-portal.html';
                return;
            }
            
        } catch (error) {
            console.error('Error checking admin auth:', error);
            window.location.href = '/admin-portal.html';
        }
    }

    // ==================== TAB SWITCHING ====================
    
    function setupTabSwitching() {
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
                switch(tabId) {
                    case 'dashboard':
                        loadDashboardStats();
                        break;
                    case 'approvals':
                        loadEventApprovals();
                        break;
                    case 'users':
                        loadUserManagement();
                        break;
                    case 'reports':
                        loadReports();
                        break;
                    case 'categories':
                        loadCategories();
                        break;
                    case 'logs':
                        loadAdminLogs();
                        break;
                }
            });
        });
    }

    // ==================== EVENT LISTENERS ====================
    
    function setupEventListeners() {
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if(logoutBtn) {
            logoutBtn.addEventListener('click', async function() {
                try {
                    const response = await fetch('/auth/logout', {
                        method: 'POST',
                        credentials: 'include'
                    });

                    if (response.ok) {
                        localStorage.removeItem('adminSession');
                        localStorage.removeItem('userRole');
                        window.location.href = 'admin-portal.html';
                    } else {
                        alert('Logout failed');
                    }
                } catch (error) {
                    console.error('Logout error:', error);
                    alert('Logout error occurred');
                }
            });
        }
    }

    // ==================== DASHBOARD STATS ====================
    
    async function loadDashboardStats() {
        try {
            const response = await fetch('/admin/dashboard/stats', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const stats = await response.json();
                updateDashboardDisplay(stats);
            } else {
                console.error('Failed to load dashboard stats');
            }
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        }
    }

    function updateDashboardDisplay(stats) {
        // Update the main stat cards
        const totalEventsEl = document.querySelector('.from-blue-500 .text-3xl');
        const activeUsersEl = document.querySelector('.from-green-500 .text-3xl');
        const pendingApprovalsEl = document.querySelector('.from-yellow-500 .text-3xl');
        const activeReportsEl = document.querySelector('.from-purple-500 .text-3xl');

        if (totalEventsEl) totalEventsEl.textContent = stats.overview.totalEvents || '0';
        if (activeUsersEl) activeUsersEl.textContent = stats.overview.totalUsers || '0';
        if (pendingApprovalsEl) pendingApprovalsEl.textContent = stats.overview.pendingEvents || '0';
        if (activeReportsEl) activeReportsEl.textContent = stats.overview.activeReports || '0';
    }

    async function loadPendingCounts() {
        try {
            const response = await fetch('/admin/dashboard/stats', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const stats = await response.json();
                
                // Update notification badges
                const pendingEventsBadge = document.getElementById('pending-events-badge');
                const activeReportsBadge = document.getElementById('active-reports-badge');
                const pendingCategoriesBadge = document.getElementById('pending-categories-badge');

                if (pendingEventsBadge) {
                    pendingEventsBadge.textContent = stats.overview.pendingEvents || '0';
                    pendingEventsBadge.style.display = stats.overview.pendingEvents > 0 ? 'block' : 'none';
                }
                
                if (activeReportsBadge) {
                    activeReportsBadge.textContent = stats.overview.activeReports || '0';
                    activeReportsBadge.style.display = stats.overview.activeReports > 0 ? 'block' : 'none';
                }
                
                if (pendingCategoriesBadge) {
                    pendingCategoriesBadge.textContent = stats.overview.pendingCategories || '0';
                    pendingCategoriesBadge.style.display = stats.overview.pendingCategories > 0 ? 'block' : 'none';
                }
            }
        } catch (error) {
            console.error('Error loading pending counts:', error);
        }
    }

    // ==================== EVENT APPROVALS ====================
    
    async function loadEventApprovals() {
        try {
            const response = await fetch('/admin/events/approval-queue?status=pending', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                displayEventApprovals(data.events);
            } else {
                console.error('Failed to load event approvals');
            }
        } catch (error) {
            console.error('Error loading event approvals:', error);
        }
    }

    function displayEventApprovals(events) {
        const container = document.querySelector('#approvals .space-y-4');
        if (!container) return;

        if (events.length === 0) {
            container.innerHTML = '<div class="text-center py-8 text-gray-500">No pending approvals.</div>';
            return;
        }

        const eventsHTML = events.map(event => {
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
                            <p class="text-gray-600">Date: ${eventDate} at ${event.time}</p>
                            <p class="text-gray-600">Location: ${event.location}</p>
                            <p class="text-sm text-gray-500 mt-2">Category: ${event.category}</p>
                            <p class="text-sm text-gray-700 mt-2">${event.description}</p>
                        </div>
                        <div class="flex flex-col space-y-2 ml-4">
                            <button onclick="approveEvent('${event._id}')" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm">
                                <i class="fas fa-check mr-1"></i>Approve
                            </button>
                            <button onclick="rejectEvent('${event._id}')" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm">
                                <i class="fas fa-times mr-1"></i>Reject
                            </button>
                            <button onclick="requestChanges('${event._id}')" class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded text-sm">
                                <i class="fas fa-edit mr-1"></i>Request Changes
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = eventsHTML;
    }

    // ==================== USER MANAGEMENT ====================
    
    async function loadUserManagement() {
        try {
            const response = await fetch('/admin/users/management?limit=50', {
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
                'banned': 'bg-red-100 text-red-800',
                'restricted': 'bg-orange-100 text-orange-800'
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
                                ${user.stats?.activeWarnings > 0 ? `<span class="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">${user.stats.activeWarnings} warnings</span>` : ''}
                            </div>
                            <p class="text-gray-600 text-sm">@${user.username} • ${user.email}</p>
                            <p class="text-gray-500 text-sm mt-1">Joined: ${joinDate}</p>
                            <div class="mt-2 text-sm text-gray-600">
                                <span class="mr-4">Events: ${user.stats?.eventsCreated || 0}</span>
                                <span class="mr-4">Reports: ${user.stats?.reportsSubmitted || 0}</span>
                            </div>
                        </div>
                        <div class="flex flex-col space-y-2 ml-4">
                            <button onclick="warnUser('${user._id}', '${user.username}')" class="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm">
                                <i class="fas fa-exclamation-triangle mr-1"></i>Warn
                            </button>
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

    // ==================== REPORTS MANAGEMENT ====================
    
    async function loadReports() {
        try {
            const statusFilter = document.getElementById('report-status-filter')?.value || 'all';
            const typeFilter = document.getElementById('report-type-filter')?.value || 'all';
            const priorityFilter = document.getElementById('report-priority-filter')?.value || 'all';
            
            const params = new URLSearchParams({
                status: statusFilter,
                type: typeFilter,
                priority: priorityFilter,
                limit: 20
            });
            
            const response = await fetch(`/admin/reports?${params}`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                displayReports(data.reports);
            } else {
                console.error('Failed to load reports');
            }
        } catch (error) {
            console.error('Error loading reports:', error);
        }
    }

    function displayReports(reports) {
        const container = document.getElementById('reports-container');
        if (!container) return;

        if (reports.length === 0) {
            container.innerHTML = '<div class="text-center py-8 text-gray-500">No reports found.</div>';
            return;
        }

        const reportsHTML = reports.map(report => {
            const priorityColor = {
                'urgent': 'bg-red-100 text-red-800',
                'high': 'bg-orange-100 text-orange-800',
                'medium': 'bg-yellow-100 text-yellow-800',
                'low': 'bg-blue-100 text-blue-800'
            }[report.priority];

            const statusColor = {
                'pending': 'bg-red-100 text-red-800',
                'investigating': 'bg-yellow-100 text-yellow-800',
                'resolved': 'bg-green-100 text-green-800',
                'dismissed': 'bg-gray-100 text-gray-800'
            }[report.status];

            return `
                <div class="bg-white border rounded-lg p-6">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <div class="flex items-center gap-3 mb-2">
                                <h3 class="text-lg font-semibold text-gray-800">Report #${report._id.slice(-6)}</h3>
                                <span class="px-2 py-1 text-xs font-medium rounded-full ${priorityColor}">${report.priority}</span>
                                <span class="px-2 py-1 text-xs font-medium rounded-full ${statusColor}">${report.status}</span>
                            </div>
                            <p class="text-gray-600 text-sm mb-2">
                                <strong>Type:</strong> ${report.reportType} • 
                                <strong>Category:</strong> ${report.category} • 
                                <strong>By:</strong> ${report.reportedBy.username}
                            </p>
                            <p class="text-gray-700 mb-2"><strong>Reason:</strong> ${report.reason}</p>
                            <p class="text-gray-600 text-sm">${report.description}</p>
                            <p class="text-gray-500 text-xs mt-2">
                                Reported: ${new Date(report.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                        <div class="flex flex-col space-y-2 ml-4">
                            ${report.status === 'pending' ? `
                                <button onclick="resolveReport('${report._id}', 'resolved')" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">
                                    <i class="fas fa-check mr-1"></i>Resolve
                                </button>
                                <button onclick="resolveReport('${report._id}', 'dismissed')" class="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm">
                                    <i class="fas fa-times mr-1"></i>Dismiss
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = reportsHTML;
    }

    // ==================== CATEGORY MANAGEMENT ====================
    
    async function loadCategories() {
        try {
            const statusFilter = document.getElementById('category-status-filter')?.value || 'pending';
            
            const response = await fetch(`/admin/categories/pending?status=${statusFilter}`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                displayCategories(data.categories);
            } else {
                console.error('Failed to load categories');
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    function displayCategories(categories) {
        const container = document.getElementById('categories-container');
        if (!container) return;

        if (categories.length === 0) {
            container.innerHTML = '<div class="text-center py-8 text-gray-500">No categories found.</div>';
            return;
        }

        const categoriesHTML = categories.map(category => {
            const statusColor = {
                'pending': 'bg-yellow-100 text-yellow-800',
                'approved': 'bg-green-100 text-green-800',
                'rejected': 'bg-red-100 text-red-800'
            }[category.status];

            return `
                <div class="bg-white border rounded-lg p-6">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <div class="flex items-center gap-3 mb-2">
                                <h3 class="text-lg font-semibold text-gray-800">${category.name}</h3>
                                <span class="px-2 py-1 text-xs font-medium rounded-full ${statusColor}">${category.status}</span>
                            </div>
                            <p class="text-gray-600 text-sm mb-2">
                                <strong>Suggested by:</strong> ${category.suggestedBy.username}
                            </p>
                            <p class="text-gray-700 mb-2">${category.description}</p>
                            <p class="text-gray-500 text-xs">
                                Suggested: ${new Date(category.createdAt).toLocaleDateString()}
                            </p>
                            ${category.rejectionReason ? `<p class="text-red-600 text-sm mt-2"><strong>Rejection reason:</strong> ${category.rejectionReason}</p>` : ''}
                        </div>
                        <div class="flex flex-col space-y-2 ml-4">
                            ${category.status === 'pending' ? `
                                <button onclick="approveCategory('${category._id}')" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">
                                    <i class="fas fa-check mr-1"></i>Approve
                                </button>
                                <button onclick="rejectCategory('${category._id}')" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
                                    <i class="fas fa-times mr-1"></i>Reject
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = categoriesHTML;
    }

    // ==================== ADMIN LOGS ====================
    
    async function loadAdminLogs() {
        try {
            const adminFilter = document.getElementById('log-admin-filter')?.value || 'all';
            const actionFilter = document.getElementById('log-action-filter')?.value || 'all';
            const daysFilter = document.getElementById('log-days-filter')?.value || '30';
            
            const params = new URLSearchParams({
                adminId: adminFilter,
                action: actionFilter,
                days: daysFilter,
                limit: 50
            });
            
            const response = await fetch(`/admin/logs?${params}`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                displayAdminLogs(data.logs);
            } else {
                console.error('Failed to load admin logs');
            }
        } catch (error) {
            console.error('Error loading admin logs:', error);
        }
    }

    function displayAdminLogs(logs) {
        const container = document.getElementById('logs-container');
        if (!container) return;

        if (logs.length === 0) {
            container.innerHTML = '<div class="text-center py-8 text-gray-500">No logs found.</div>';
            return;
        }

        const logsHTML = logs.map(log => {
            const severityColor = {
                'critical': 'bg-red-100 text-red-800',
                'high': 'bg-orange-100 text-orange-800',
                'medium': 'bg-yellow-100 text-yellow-800',
                'low': 'bg-blue-100 text-blue-800'
            }[log.severity];

            return `
                <div class="bg-white border rounded-lg p-4">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <div class="flex items-center gap-3 mb-2">
                                <h4 class="font-semibold text-gray-800">${log.action.replace(/_/g, ' ').toUpperCase()}</h4>
                                <span class="px-2 py-1 text-xs font-medium rounded-full ${severityColor}">${log.severity}</span>
                            </div>
                            <p class="text-gray-600 text-sm">
                                <strong>Admin:</strong> ${log.adminId.username} • 
                                <strong>Target:</strong> ${log.targetType} • 
                                <strong>Date:</strong> ${new Date(log.createdAt).toLocaleString()}
                            </p>
                            ${log.details?.reason ? `<p class="text-gray-700 text-sm mt-1"><strong>Reason:</strong> ${log.details.reason}</p>` : ''}
                            <p class="text-gray-500 text-xs mt-1">IP: ${log.ipAddress}</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = logsHTML;
    }

    // ==================== GLOBAL ACTION FUNCTIONS ====================
    
    // Event moderation functions
    window.approveEvent = async function(eventId) {
        if (!confirm('Are you sure you want to approve this event?')) return;
        
        try {
            const response = await fetch(`/admin/events/${eventId}/moderate`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'approve' }),
                credentials: 'include'
            });

            if (response.ok) {
                alert('Event approved successfully!');
                loadEventApprovals();
                loadPendingCounts();
            } else {
                const error = await response.json();
                alert('Failed to approve event: ' + error.message);
            }
        } catch (error) {
            console.error('Error approving event:', error);
            alert('Error approving event');
        }
    };

    window.rejectEvent = async function(eventId) {
        const reason = prompt('Please provide a reason for rejection:');
        if (!reason) return;
        
        try {
            const response = await fetch(`/admin/events/${eventId}/moderate`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reject', reason }),
                credentials: 'include'
            });

            if (response.ok) {
                alert('Event rejected successfully!');
                loadEventApprovals();
                loadPendingCounts();
            } else {
                const error = await response.json();
                alert('Failed to reject event: ' + error.message);
            }
        } catch (error) {
            console.error('Error rejecting event:', error);
            alert('Error rejecting event');
        }
    };

    window.requestChanges = async function(eventId) {
        const changes = prompt('Please specify what changes are needed:');
        if (!changes) return;
        
        try {
            const response = await fetch(`/admin/events/${eventId}/moderate`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'request_changes', 
                    reason: changes,
                    requestedChanges: [{ field: 'general', comment: changes, resolved: false }]
                }),
                credentials: 'include'
            });

            if (response.ok) {
                alert('Change request sent successfully!');
                loadEventApprovals();
            } else {
                const error = await response.json();
                alert('Failed to request changes: ' + error.message);
            }
        } catch (error) {
            console.error('Error requesting changes:', error);
            alert('Error requesting changes');
        }
    };

    // User moderation functions
    window.warnUser = async function(userId, username) {
        const reason = prompt(`Issue a warning to ${username}. Please provide a reason:`);
        if (!reason) return;
        
        const description = prompt('Please provide additional details:');
        if (!description) return;
        
        try {
            const response = await fetch(`/admin/users/${userId}/warn`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    reason,
                    description,
                    severity: 'minor',
                    category: 'policy_violation'
                }),
                credentials: 'include'
            });

            if (response.ok) {
                alert('Warning issued successfully!');
                loadUserManagement();
            } else {
                const error = await response.json();
                alert('Failed to issue warning: ' + error.message);
            }
        } catch (error) {
            console.error('Error issuing warning:', error);
            alert('Error issuing warning');
        }
    };

    window.suspendUser = async function(userId, username) {
        if (!confirm(`Are you sure you want to suspend user "${username}"?`)) return;
        
        const reason = prompt('Reason for suspension:');
        if (!reason) return;
        
        try {
            const response = await fetch(`/admin/users/${userId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'suspended', reason }),
                credentials: 'include'
            });

            if (response.ok) {
                alert('User suspended successfully!');
                loadUserManagement();
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
            const response = await fetch(`/admin/users/${userId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'active', reason: 'Reactivated by admin' }),
                credentials: 'include'
            });

            if (response.ok) {
                alert('User activated successfully!');
                loadUserManagement();
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
            const response = await fetch(`/admin/users/${userId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'banned', reason }),
                credentials: 'include'
            });

            if (response.ok) {
                alert('User banned successfully!');
                loadUserManagement();
            } else {
                const error = await response.json();
                alert('Failed to ban user: ' + error.message);
            }
        } catch (error) {
            console.error('Error banning user:', error);
            alert('Error banning user');
        }
    };

    // Report functions
    window.resolveReport = async function(reportId, action) {
        const actionText = action === 'resolved' ? 'resolve' : 'dismiss';
        if (!confirm(`Are you sure you want to ${actionText} this report?`)) return;
        
        const adminNotes = prompt('Please provide admin notes:');
        const resolutionAction = action === 'resolved' ? 
            prompt('What action was taken? (warning_issued, content_removed, user_suspended, etc.)') : 
            'no_action';
        
        try {
            const response = await fetch(`/admin/reports/${reportId}/resolve`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, adminNotes, resolutionAction }),
                credentials: 'include'
            });

            if (response.ok) {
                alert(`Report ${actionText}d successfully!`);
                loadReports();
                loadPendingCounts();
            } else {
                const error = await response.json();
                alert(`Failed to ${actionText} report: ` + error.message);
            }
        } catch (error) {
            console.error(`Error ${actionText}ing report:`, error);
            alert(`Error ${actionText}ing report`);
        }
    };

    // Category functions
    window.approveCategory = async function(categoryId) {
        if (!confirm('Are you sure you want to approve this category?')) return;
        
        try {
            const response = await fetch(`/admin/categories/${categoryId}/moderate`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'approve' }),
                credentials: 'include'
            });

            if (response.ok) {
                alert('Category approved successfully!');
                loadCategories();
                loadPendingCounts();
            } else {
                const error = await response.json();
                alert('Failed to approve category: ' + error.message);
            }
        } catch (error) {
            console.error('Error approving category:', error);
            alert('Error approving category');
        }
    };

    window.rejectCategory = async function(categoryId) {
        const reason = prompt('Please provide a reason for rejection:');
        if (!reason) return;
        
        try {
            const response = await fetch(`/admin/categories/${categoryId}/moderate`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reject', rejectionReason: reason }),
                credentials: 'include'
            });

            if (response.ok) {
                alert('Category rejected successfully!');
                loadCategories();
                loadPendingCounts();
            } else {
                const error = await response.json();
                alert('Failed to reject category: ' + error.message);
            }
        } catch (error) {
            console.error('Error rejecting category:', error);
            alert('Error rejecting category');
        }
    };

    // Make filter functions globally available
    window.loadReports = loadReports;
    window.loadCategories = loadCategories;
    window.loadAdminLogs = loadAdminLogs;

});
