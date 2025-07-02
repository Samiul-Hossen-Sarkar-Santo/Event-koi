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
    setupEventApprovalFilters();
    setupReportsFilters();
    setupCategoriesFilters();
    setupAdminLogsFilters();
    setupUserManagementFilters();
    setupDeletionFilters();
    setupBannedWarnedFilters();

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
                        loadRecentActivity();
                        break;
                    case 'approvals':
                        loadEventApprovals();
                        setTimeout(setupEventApprovalFilters, 100);
                        break;
                    case 'users':
                        loadUserManagement();
                        setTimeout(setupUserManagementFilters, 100);
                        break;
                    case 'reports':
                        loadReports();
                        setTimeout(setupReportsFilters, 100);
                        break;
                    case 'categories':
                        loadCategories();
                        setTimeout(setupCategoriesFilters, 100);
                        break;
                    case 'logs':
                        loadAdminLogs();
                        setTimeout(setupAdminLogsFilters, 100);
                        break;
                    case 'deletions':
                        loadDeletionRequests();
                        setTimeout(setupDeletionFilters, 100);
                        break;
                    case 'banned-warned':
                        loadBannedWarned();
                        setTimeout(setupBannedWarnedFilters, 100);
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
        // Update the main stat cards using the new IDs
        const totalEventsEl = document.getElementById('total-events');
        const activeUsersEl = document.getElementById('active-users');
        const pendingApprovalsEl = document.getElementById('pending-approvals');
        const activeReportsEl = document.getElementById('active-reports');

        if (totalEventsEl) {
            totalEventsEl.textContent = stats.overview.totalEvents || '0';
            // Make the entire card clickable
            const totalEventsCard = document.getElementById('total-events-card');
            if (totalEventsCard) {
                totalEventsCard.onclick = () => {
                    document.querySelector('[data-admin-tab="approvals"]').click();
                    setTimeout(() => {
                        document.getElementById('event-status-filter').value = 'all';
                        loadEventApprovals();
                    }, 100);
                };
            }
        }

        if (activeUsersEl) {
            activeUsersEl.textContent = stats.overview.totalUsers || '0';
            const activeUsersCard = document.getElementById('active-users-card');
            if (activeUsersCard) {
                activeUsersCard.onclick = () => {
                    document.querySelector('[data-admin-tab="users"]').click();
                };
            }
        }

        if (pendingApprovalsEl) {
            pendingApprovalsEl.textContent = stats.overview.pendingEvents || '0';
            const pendingApprovalsCard = document.getElementById('pending-approvals-card');
            if (pendingApprovalsCard) {
                pendingApprovalsCard.onclick = () => {
                    document.querySelector('[data-admin-tab="approvals"]').click();
                    setTimeout(() => {
                        document.getElementById('event-status-filter').value = 'pending';
                        loadEventApprovals();
                    }, 100);
                };
            }
        }

        if (activeReportsEl) {
            activeReportsEl.textContent = stats.overview.activeReports || '0';
            const activeReportsCard = document.getElementById('active-reports-card');
            if (activeReportsCard) {
                activeReportsCard.onclick = () => {
                    document.querySelector('[data-admin-tab="reports"]').click();
                    setTimeout(() => {
                        document.getElementById('report-status-filter').value = 'pending';
                        loadReports();
                    }, 100);
                };
            }
        }

        // Load recent activity after updating cards
        loadRecentActivity();
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
            const statusFilter = document.getElementById('event-status-filter')?.value || 'pending';
            const categoryFilter = document.getElementById('event-category-filter')?.value || 'all';
            const dateFilter = document.getElementById('event-date-filter')?.value || 'all';
            const createdFilter = document.getElementById('event-created-filter')?.value || 'all';
            const searchQuery = document.getElementById('event-search-input')?.value || '';
            
            let url = `/admin/events/approval-queue?status=${statusFilter}`;
            if (categoryFilter !== 'all') {
                url += `&category=${categoryFilter}`;
            }
            if (dateFilter !== 'all') {
                url += `&dateRange=${dateFilter}`;
            }
            if (createdFilter !== 'all') {
                url += `&createdRange=${createdFilter}`;
            }
            if (searchQuery.trim()) {
                url += `&search=${encodeURIComponent(searchQuery.trim())}`;
            }
            
            const response = await fetch(url, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                displayEventApprovals(data.events || []);
            } else {
                console.error('Failed to load event approvals');
                displayEventApprovals([]);
            }
        } catch (error) {
            console.error('Error loading event approvals:', error);
            displayEventApprovals([]);
        }
    }

    function displayEventApprovals(events) {
        const container = document.getElementById('approvals-container');
        if (!container) return;

        if (events.length === 0) {
            container.innerHTML = '<div class="text-center py-8 text-gray-500">No events found matching your criteria.</div>';
            return;
        }

        const eventsHTML = events.map(event => {
            const eventDate = new Date(event.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            const createdDate = new Date(event.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            const statusBadge = getStatusBadge(event.approvalStatus);

            const organizerName = event.organizer ? 
                (event.organizer.name || event.organizer.username || 'Unknown Organizer') : 
                'Unknown Organizer';
            
            // Additional status indicators
            const resubmissionInfo = event.resubmissionCount > 0 ? 
                `<span class="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full ml-2">
                    Resubmitted ${event.resubmissionCount}x
                </span>` : '';
            
            const deletionInfo = event.deletionStatus && event.deletionStatus !== 'none' ?
                `<span class="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full ml-2">
                    Deletion: ${event.deletionStatus.replace('_', ' ')}
                </span>` : '';
            
            const rejectionReason = event.rejectionReason ? 
                `<div class="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                    <strong class="text-red-800">Rejection Reason:</strong> 
                    <span class="text-red-700">${event.rejectionReason}</span>
                </div>` : '';
            
            const requestedChanges = event.requestedChanges && event.requestedChanges.length > 0 ?
                `<div class="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                    <strong class="text-yellow-800">Requested Changes:</strong>
                    <ul class="list-disc list-inside text-yellow-700 mt-1">
                        ${event.requestedChanges.map(change => 
                            `<li>${change.field}: ${change.comment} ${change.resolved ? '✓' : ''}</li>`
                        ).join('')}
                    </ul>
                </div>` : '';

            return `
                <div class="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <div class="flex items-center gap-3 mb-2 flex-wrap">
                                <h3 class="text-lg font-semibold text-gray-800">${event.title || 'Untitled Event'}</h3>
                                ${statusBadge}
                                ${resubmissionInfo}
                                ${deletionInfo}
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                                <p><i class="fas fa-user mr-2"></i>By: ${organizerName}</p>
                                <p><i class="fas fa-calendar mr-2"></i>Event: ${eventDate} at ${event.time || 'TBD'}</p>
                                <p><i class="fas fa-map-marker-alt mr-2"></i>Location: ${event.location || 'TBD'}</p>
                                <p><i class="fas fa-clock mr-2"></i>Created: ${createdDate}</p>
                                <p><i class="fas fa-tag mr-2"></i>Category: ${event.category || 'Uncategorized'}</p>
                                ${event.coverImage ? '<p><i class="fas fa-image mr-2"></i>Has Cover Image</p>' : ''}
                            </div>
                            <p class="text-sm text-gray-700 mt-2 line-clamp-2">${event.description || 'No description provided'}</p>
                            ${rejectionReason}
                            ${requestedChanges}
                            ${event.coverImage ? `<img src="uploads/${event.coverImage}" alt="Event Cover" class="mt-3 w-32 h-20 object-cover rounded shadow-sm">` : ''}
                        </div>
                        <div class="flex flex-col space-y-2 ml-4 min-w-0">
                            ${event.approvalStatus === 'pending' ? `
                                <button onclick="approveEvent('${event._id}')" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm transition-colors whitespace-nowrap">
                                    <i class="fas fa-check mr-1"></i>Approve
                                </button>
                                <button onclick="rejectEvent('${event._id}')" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm transition-colors whitespace-nowrap">
                                    <i class="fas fa-times mr-1"></i>Reject
                                </button>
                                <button onclick="requestChanges('${event._id}')" class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded text-sm transition-colors whitespace-nowrap">
                                    <i class="fas fa-edit mr-1"></i>Request Changes
                                </button>
                            ` : ''}
                            <button onclick="viewEventDetails('${event._id}')" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm transition-colors whitespace-nowrap">
                                <i class="fas fa-external-link-alt mr-1"></i>View Event Page
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = eventsHTML;
    }

    function getStatusBadge(status) {
        const badges = {
            'pending': '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>',
            'approved': '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Approved</span>',
            'rejected': '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Rejected</span>',
            'changes_requested': '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">Changes Requested</span>'
        };
        return badges[status] || badges['pending'];
    }

    // Add refresh function
    function refreshApprovals() {
        loadEventApprovals();
    }

    // Make functions globally available
    window.refreshApprovals = refreshApprovals;

    // ==================== USER MANAGEMENT ====================
    
    async function loadUserManagement() {
        try {
            const response = await fetch('/admin/users/management?limit=50', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                displayUserManagement(data.users || []);
            } else {
                console.error('Failed to load users');
                displayUserManagement([]);
            }
        } catch (error) {
            console.error('Error loading users:', error);
            displayUserManagement([]);
        }
    }

    function displayUserManagement(users) {
        const container = document.getElementById('users-container');
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
                <div class="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div class="flex justify-between items-start">
                        <div class="flex items-center flex-1">
                            <div class="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center mr-4">
                                <span class="text-sm font-medium">${(user.name || user.username).substring(0, 2).toUpperCase()}</span>
                            </div>
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
                        </div>
                        <div class="flex flex-col space-y-2 ml-4">
                            <button onclick="warnUser('${user._id}', '${user.username}')" class="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm transition-colors">
                                <i class="fas fa-exclamation-triangle mr-1"></i>Warn
                            </button>
                            ${user.accountStatus !== 'suspended' ? 
                                `<button onclick="suspendUser('${user._id}', '${user.username}')" class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm transition-colors">
                                    <i class="fas fa-pause mr-1"></i>Suspend
                                </button>` : 
                                `<button onclick="activateUser('${user._id}', '${user.username}')" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors">
                                    <i class="fas fa-play mr-1"></i>Activate
                                </button>`
                            }
                            ${user.role !== 'admin' ? 
                                `<button onclick="banUser('${user._id}', '${user.username}')" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors">
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

    // User search functionality
    function searchUsers() {
        const searchTerm = document.getElementById('user-search').value.trim();
        const roleFilter = document.getElementById('user-role-filter').value;
        const statusFilter = document.getElementById('user-status-filter').value;
        
        loadUserManagementWithFilters(searchTerm, roleFilter, statusFilter);
    }

    function clearUserSearch() {
        document.getElementById('user-search').value = '';
        document.getElementById('user-role-filter').value = 'all';
        document.getElementById('user-status-filter').value = 'all';
        loadUserManagement();
    }

    async function loadUserManagementWithFilters(search = '', role = 'all', status = 'all') {
        try {
            const params = new URLSearchParams({
                limit: 50
            });
            
            if (search) params.append('search', search);
            if (role !== 'all') params.append('role', role);
            if (status !== 'all') params.append('status', status);
            
            const response = await fetch(`/admin/users/management?${params}`, {
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

    // Make functions globally available
    window.searchUsers = searchUsers;
    window.clearUserSearch = clearUserSearch;

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
                displayReports(data.reports || []);
                return Promise.resolve();
            } else {
                console.error('Failed to load reports, status:', response.status);
                displayReports([]);
                return Promise.reject('Failed to load reports');
            }
        } catch (error) {
            console.error('Error loading reports:', error);
            displayReports([]);
            return Promise.reject(error);
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
                displayCategories(data.categories || []);
                return Promise.resolve();
            } else {
                console.error('Failed to load categories');
                displayCategories([]);
                return Promise.reject('Failed to load categories');
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            displayCategories([]);
            return Promise.reject(error);
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
                displayAdminLogs(data.logs || []);
                return Promise.resolve();
            } else {
                console.error('Failed to load admin logs');
                displayAdminLogs([]);
                return Promise.reject('Failed to load admin logs');
            }
        } catch (error) {
            console.error('Error loading admin logs:', error);
            displayAdminLogs([]);
            return Promise.reject(error);
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

    // ==================== LOAD ALL EVENTS ====================
    
    // Load all events function
    async function loadAllEvents() {
        try {
            const response = await fetch('/admin/events/approval-queue?status=all&limit=100', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                displayAllEvents(data.events);
            } else {
                console.error('Failed to load all events');
            }
        } catch (error) {
            console.error('Error loading all events:', error);
        }
    }

    function displayAllEvents(events) {
        const container = document.querySelector('#approvals .space-y-4');
        if (!container) return;

        // Add filter buttons
        const filterHTML = `
            <div class="bg-white p-4 rounded-lg mb-6 border">
                <div class="flex flex-wrap gap-4">
                    <button onclick="filterEvents('all')" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                        All Events (${events.length})
                    </button>
                    <button onclick="filterEvents('pending')" class="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">
                        Pending (${events.filter(e => e.approvalStatus === 'pending').length})
                    </button>
                    <button onclick="filterEvents('approved')" class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                        Approved (${events.filter(e => e.approvalStatus === 'approved').length})
                    </button>
                    <button onclick="filterEvents('rejected')" class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                        Rejected (${events.filter(e => e.approvalStatus === 'rejected').length})
                    </button>
                </div>
            </div>
            <div id="events-list"></div>
        `;

        container.innerHTML = filterHTML;
        displayFilteredEvents(events, 'all');
    }

    function displayFilteredEvents(events, filter) {
        const filteredEvents = filter === 'all' ? events : events.filter(e => e.approvalStatus === filter);
        const listContainer = document.getElementById('events-list');
        
        if (filteredEvents.length === 0) {
            listContainer.innerHTML = '<div class="text-center py-8 text-gray-500">No events found for this filter.</div>';
            return;
        }

        const eventsHTML = filteredEvents.map(event => {
            const eventDate = new Date(event.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const statusColor = {
                'pending': 'bg-yellow-100 text-yellow-800',
                'approved': 'bg-green-100 text-green-800',
                'rejected': 'bg-red-100 text-red-800',
                'changes_requested': 'bg-orange-100 text-orange-800'
            }[event.approvalStatus];

            return `
                <div class="bg-white border rounded-lg p-6 mb-4">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <div class="flex items-center gap-3 mb-2">
                                <h3 class="text-lg font-semibold text-gray-800">${event.title}</h3>
                                <span class="px-2 py-1 text-xs font-medium rounded-full ${statusColor}">${event.approvalStatus}</span>
                            </div>
                            <p class="text-gray-600 mt-1">By: ${event.organizer?.name || event.organizer?.username || 'Unknown'}</p>
                            <p class="text-gray-600">Date: ${eventDate} at ${event.time}</p>
                            <p class="text-gray-600">Location: ${event.location}</p>
                            <p class="text-sm text-gray-500 mt-2">Category: ${event.category}</p>
                            <p class="text-sm text-gray-700 mt-2">${event.description}</p>
                            ${event.rejectionReason ? `<p class="text-red-600 text-sm mt-2"><strong>Rejection reason:</strong> ${event.rejectionReason}</p>` : ''}
                        </div>
                        <div class="flex flex-col space-y-2 ml-4">
                            ${event.approvalStatus === 'pending' ? `
                                <button onclick="approveEvent('${event._id}')" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm">
                                    <i class="fas fa-check mr-1"></i>Approve
                                </button>
                                <button onclick="rejectEvent('${event._id}')" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm">
                                    <i class="fas fa-times mr-1"></i>Reject
                                </button>
                                <button onclick="requestChanges('${event._id}')" class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded text-sm">
                                    <i class="fas fa-edit mr-1"></i>Request Changes
                                </button>
                            ` : `
                                <a href="event_page.html?id=${event._id}" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm text-center">
                                    <i class="fas fa-eye mr-1"></i>View Event
                                </a>
                            `}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        listContainer.innerHTML = eventsHTML;
    }

    // Global filter function
    window.filterEvents = function(filter) {
        // Re-fetch and filter events
        loadAllEvents().then(() => {
            // This will be handled in displayAllEvents
        });
    };

    // ==================== RECENT ACTIVITY ====================
    
    async function loadRecentActivity() {
        try {
            const response = await fetch('/admin/dashboard/recent-activity', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const activities = await response.json();
                displayRecentActivity(activities);
            } else {
                // Create mock recent activity for now
                const mockActivities = [
                    { type: 'event_approved', message: 'Approved "Tech Conference 2025"', time: '2 minutes ago', icon: 'check-circle', color: 'green' },
                    { type: 'user_warned', message: 'Warned user "john.doe" for policy violation', time: '15 minutes ago', icon: 'exclamation-triangle', color: 'yellow' },
                    { type: 'report_resolved', message: 'Resolved report about "Spam Event"', time: '1 hour ago', icon: 'flag', color: 'blue' },
                    { type: 'category_added', message: 'Approved new category "AI & Machine Learning"', time: '2 hours ago', icon: 'tags', color: 'purple' },
                    { type: 'user_banned', message: 'Banned user "spammer123" for repeated violations', time: '3 hours ago', icon: 'ban', color: 'red' }
                ];
                displayRecentActivity(mockActivities);
            }
        } catch (error) {
            console.log('Using mock recent activity data');
            const mockActivities = [
                { type: 'event_approved', message: 'Approved "Tech Conference 2025"', time: '2 minutes ago', icon: 'check-circle', color: 'green' },
                { type: 'user_warned', message: 'Warned user "john.doe" for policy violation', time: '15 minutes ago', icon: 'exclamation-triangle', color: 'yellow' },
                { type: 'report_resolved', message: 'Resolved report about "Spam Event"', time: '1 hour ago', icon: 'flag', color: 'blue' },
                { type: 'category_added', message: 'Approved new category "AI & Machine Learning"', time: '2 hours ago', icon: 'tags', color: 'purple' },
                { type: 'user_banned', message: 'Banned user "spammer123" for repeated violations', time: '3 hours ago', icon: 'ban', color: 'red' }
            ];
            displayRecentActivity(mockActivities);
        }
    }

    function displayRecentActivity(activities) {
        const container = document.getElementById('recent-activity');
        if (!container) return;

        if (activities.length === 0) {
            container.innerHTML = '<div class="text-center py-8 text-gray-500">No recent activity</div>';
            return;
        }

        const activitiesHTML = activities.map(activity => `
            <div class="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div class="w-10 h-10 rounded-full bg-${activity.color}-100 flex items-center justify-center mr-3">
                    <i class="fas fa-${activity.icon} text-${activity.color}-600"></i>
                </div>
                <div class="flex-1">
                    <p class="text-sm font-medium text-gray-900">${activity.message}</p>
                    <p class="text-xs text-gray-500">${activity.time}</p>
                </div>
            </div>
        `).join('');

        container.innerHTML = activitiesHTML;
    }

    // Quick Actions function for dashboard
    function quickAction(action) {
        switch(action) {
            case 'create-announcement':
                alert('Feature coming soon: Create platform-wide announcement');
                break;
            case 'view-analytics':
                alert('Feature coming soon: Detailed analytics dashboard');
                break;
            case 'export-data':
                alert('Feature coming soon: Export platform data');
                break;
            case 'system-health':
                alert('System Status: All services running normally');
                break;
            default:
                console.log('Unknown action:', action);
        }
    }

    // Make quickAction available globally
    window.quickAction = quickAction;

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
                const result = await response.json();
                alert('Event approved successfully!');
                loadEventApprovals();
                loadPendingCounts();
                loadDashboardStats(); // Refresh dashboard stats
            } else {
                const error = await response.json();
                alert('Failed to approve event: ' + (error.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error approving event:', error);
            alert('Error approving event. Please try again.');
        }
    };

    window.rejectEvent = async function(eventId) {
        const reason = prompt('Please provide a reason for rejection:');
        if (!reason || reason.trim() === '') {
            alert('A reason is required for rejection.');
            return;
        }
        
        try {
            const response = await fetch(`/admin/events/${eventId}/moderate`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reject', reason: reason.trim() }),
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                alert('Event rejected successfully!');
                loadEventApprovals();
                loadPendingCounts();
                loadDashboardStats(); // Refresh dashboard stats
            } else {
                const error = await response.json();
                alert('Failed to reject event: ' + (error.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error rejecting event:', error);
            alert('Error rejecting event. Please try again.');
        }
    };

    window.requestChanges = async function(eventId) {
        const changes = prompt('Please specify what changes are needed:');
        if (!changes || changes.trim() === '') {
            alert('Please specify what changes are needed.');
            return;
        }
        
        try {
            const response = await fetch(`/admin/events/${eventId}/moderate`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'request_changes', 
                    reason: changes.trim(),
                    requestedChanges: [changes.trim()]
                }),
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                alert('Change request sent successfully!');
                loadEventApprovals();
                loadPendingCounts();
                loadDashboardStats(); // Refresh dashboard stats
            } else {
                const error = await response.json();
                alert('Failed to request changes: ' + (error.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error requesting changes:', error);
            alert('Error requesting changes. Please try again.');
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

    // ==================== DELETION REQUESTS MANAGEMENT ====================
    
    async function loadDeletionRequests() {
        try {
            const statusFilter = document.getElementById('deletion-status-filter')?.value || 'deletion_requested';
            
            let url = `/admin/events/deletion-queue?status=${statusFilter}`;
            
            const response = await fetch(url, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                displayDeletionRequests(data.events || []);
                return Promise.resolve();
            } else {
                console.error('Failed to load deletion requests');
                displayDeletionRequests([]);
                return Promise.reject('Failed to load deletion requests');
            }
        } catch (error) {
            console.error('Error loading deletion requests:', error);
            displayDeletionRequests([]);
            return Promise.reject(error);
        }
    }

    function displayDeletionRequests(requests) {
        const container = document.getElementById('deletions-container');
        if (!container) return;

        if (requests.length === 0) {
            container.innerHTML = '<div class="text-center py-8 text-gray-500">No deletion requests found.</div>';
            return;
        }

        const requestsHTML = requests.map(event => {
            const requestDate = new Date(event.deletionRequestedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const eventDate = new Date(event.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const statusBadge = getDeletionStatusBadge(event.deletionStatus);
            const requesterName = event.deletionRequestedBy ? 
                (event.deletionRequestedBy.name || event.deletionRequestedBy.username || 'Unknown User') : 
                'Unknown User';

            return `
                <div class="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <div class="flex items-center gap-3 mb-2">
                                <h3 class="text-lg font-semibold text-gray-800">${event.title || 'Untitled Event'}</h3>
                                ${statusBadge}
                            </div>
                            <p class="text-gray-600 mt-1">Organizer: ${event.organizer ? (event.organizer.name || event.organizer.username) : 'Unknown'}</p>
                            <p class="text-gray-600">Deletion requested by: ${requesterName}</p>
                            <p class="text-gray-600">Request Date: ${requestDate}</p>
                            <p class="text-gray-600">Event Date: ${eventDate} at ${event.time || 'TBD'}</p>
                            <p class="text-gray-600">Location: ${event.location || 'TBD'}</p>
                            <p class="text-gray-600">Category: ${event.category || 'Uncategorized'}</p>
                            ${event.deletionReason ? `<p class="text-sm text-red-600 mt-2"><strong>Reason:</strong> ${event.deletionReason}</p>` : ''}
                            <p class="text-sm text-gray-700 mt-2">${event.description || 'No description provided'}</p>
                            ${event.coverImage ? `<img src="uploads/${event.coverImage}" alt="Event Cover" class="mt-3 w-32 h-20 object-cover rounded">` : ''}
                        </div>
                        <div class="flex flex-col space-y-2 ml-4">
                            ${event.deletionStatus === 'deletion_requested' ? `
                                <button onclick="approveDeletion('${event._id}')" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm transition-colors">
                                    <i class="fas fa-trash mr-1"></i>Approve Deletion
                                </button>
                                <button onclick="rejectDeletion('${event._id}')" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm transition-colors">
                                    <i class="fas fa-ban mr-1"></i>Reject Deletion
                                </button>
                                <button onclick="viewEventDetails('${event._id}')" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm transition-colors">
                                    <i class="fas fa-eye mr-1"></i>View Details
                                </button>
                            ` : `
                                <button onclick="viewEventDetails('${event._id}')" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm transition-colors">
                                    <i class="fas fa-eye mr-1"></i>View Details
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = requestsHTML;
    }

    function getDeletionStatusBadge(status) {
        const badges = {
            'deletion_requested': '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending Review</span>',
            'deletion_approved': '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Deletion Approved</span>',
            'deletion_rejected': '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Deletion Rejected</span>',
            'active': '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Active</span>'
        };
        return badges[status] || badges['active'];
    }

    // Add refresh function
    function refreshDeletions() {
        document.getElementById('deletion-status-filter').value = 'deletion_requested';
        loadDeletionRequests();
    }

    // Deletion action functions
    window.approveDeletion = async function(eventId) {
        if (!confirm('Are you sure you want to PERMANENTLY DELETE this event? This action cannot be undone!')) return;
        
        const reason = prompt('Please provide a reason for approving the deletion:');
        if (!reason || reason.trim() === '') {
            alert('A reason is required for deletion approval.');
            return;
        }
        
        try {
            const response = await fetch(`/admin/events/${eventId}/deletion`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'approve_deletion', reason: reason.trim() }),
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                alert('Event deletion approved and event permanently removed!');
                loadDeletionRequests();
                loadPendingCounts();
                loadDashboardStats();
            } else {
                const error = await response.json();
                alert('Failed to approve deletion: ' + (error.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error approving deletion:', error);
            alert('Error approving deletion. Please try again.');
        }
    };

    window.rejectDeletion = async function(eventId) {
        const reason = prompt('Please provide a reason for rejecting the deletion request:');
        if (!reason || reason.trim() === '') {
            alert('A reason is required for rejection.');
            return;
        }
        
        try {
            const response = await fetch(`/admin/events/${eventId}/deletion`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reject_deletion', reason: reason.trim() }),
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                alert('Deletion request rejected successfully!');
                loadDeletionRequests();
                loadPendingCounts();
                loadDashboardStats();
            } else {
                const error = await response.json();
                alert('Failed to reject deletion: ' + (error.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error rejecting deletion:', error);
            alert('Error rejecting deletion. Please try again.');
        }
    };

    // ==================== BANNED & WARNED USERS MANAGEMENT ====================
    
    async function loadBannedWarned() {
        try {
            const statusFilter = document.getElementById('ban-status-filter')?.value || 'banned';
            const daysFilter = document.getElementById('ban-days-filter')?.value || 'all';
            
            const params = new URLSearchParams({
                status: statusFilter,
                days: daysFilter,
                limit: 50
            });
            
            const response = await fetch(`/admin/banned-warned?${params}`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                displayBannedWarned(data.users || []);
                return Promise.resolve();
            } else {
                console.error('Failed to load banned/warned users');
                displayBannedWarned([]);
                return Promise.reject('Failed to load banned/warned users');
            }
        } catch (error) {
            console.error('Error loading banned/warned users:', error);
            displayBannedWarned([]);
            return Promise.reject(error);
        }
    }

    function displayBannedWarned(users) {
        const container = document.getElementById('banned-warned-container');
        if (!container) return;

        if (users.length === 0) {
            container.innerHTML = '<div class="text-center py-8 text-gray-500">No users found for selected criteria.</div>';
            return;
        }

        const usersHTML = users.map(user => {
            const statusChangeDate = user.statusChangedAt ? 
                new Date(user.statusChangedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }) : 'Unknown';
            
            const appealDate = user.appealSubmittedAt ? 
                new Date(user.appealSubmittedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }) : null;

            const statusColor = {
                'banned': 'bg-red-100 text-red-800',
                'suspended': 'bg-yellow-100 text-yellow-800',
                'warned': 'bg-orange-100 text-orange-800'
            }[user.accountStatus];

            const hasAppeal = user.appealText && user.appealText.trim() !== '';

            return `
                <div class="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <div class="flex items-center gap-3 mb-2">
                                <h3 class="text-lg font-semibold text-gray-800">${user.username}</h3>
                                <span class="px-2 py-1 text-xs font-medium rounded-full ${statusColor}">${user.accountStatus}</span>
                                ${hasAppeal ? '<span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Has Appeal</span>' : ''}
                                ${user.warningCount > 0 ? `<span class="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">${user.warningCount} warnings</span>` : ''}
                            </div>
                            <p class="text-gray-600 text-sm mb-2">
                                <strong>Email:</strong> ${user.email}
                            </p>
                            <p class="text-gray-600 text-sm mb-2">
                                <strong>Status Changed:</strong> ${statusChangeDate}
                            </p>
                            ${user.banReason ? `
                                <div class="mt-2 p-3 bg-red-50 border border-red-200 rounded">
                                    <p class="text-sm text-red-800"><strong>Reason:</strong></p>
                                    <p class="text-sm text-red-700">${user.banReason}</p>
                                </div>
                            ` : ''}
                            ${hasAppeal ? `
                                <div class="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
                                    <p class="text-sm text-blue-800"><strong>Appeal (${appealDate}):</strong></p>
                                    <p class="text-sm text-blue-700">${user.appealText}</p>
                                </div>
                            ` : ''}
                        </div>
                        <div class="flex flex-col space-y-2 ml-4">
                            ${user.accountStatus === 'banned' && !hasAppeal ? `
                                <button onclick="unbanUser('${user._id}', '${user.username}')" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors">
                                    <i class="fas fa-unlock mr-1"></i>Unban
                                </button>
                            ` : ''}
                            ${hasAppeal ? `
                                <button onclick="handleAppeal('${user._id}', 'approve')" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors">
                                    <i class="fas fa-check mr-1"></i>Approve Appeal
                                </button>
                                <button onclick="handleAppeal('${user._id}', 'reject')" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors">
                                    <i class="fas fa-times mr-1"></i>Reject Appeal
                                </button>
                            ` : ''}
                            ${user.accountStatus === 'suspended' ? `
                                <button onclick="unsuspendUser('${user._id}', '${user.username}')" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors">
                                    <i class="fas fa-play mr-1"></i>Unsuspend
                                </button>
                            ` : ''}
                            <button onclick="viewUserWarnings('${user._id}', '${user.username}')" class="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm transition-colors">
                                <i class="fas fa-eye mr-1"></i>View History
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = usersHTML;
    }

    // Ban appeal handling functions
    window.handleAppeal = async function(userId, action) {
        const actionText = action === 'approve' ? 'approve' : 'reject';
        if (!confirm(`Are you sure you want to ${actionText} this ban appeal?`)) return;
        
        const adminResponse = prompt(`Please provide your response for ${actionText}ing the appeal:`);
        if (!adminResponse || adminResponse.trim() === '') {
            alert('A response is required.');
            return;
        }
        
        try {
            const response = await fetch(`/admin/handle-appeal/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action, 
                    adminResponse: adminResponse.trim() 
                }),
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                alert(`Ban appeal ${actionText}ed successfully!`);
                loadBannedWarned();
                loadPendingCounts();
            } else {
                const error = await response.json();
                alert(`Failed to ${actionText} appeal: ` + (error.message || 'Unknown error'));
            }
        } catch (error) {
            console.error(`Error ${actionText}ing appeal:`, error);
            alert(`Error ${actionText}ing appeal. Please try again.`);
        }
    };

    window.unbanUser = async function(userId, username) {
        if (!confirm(`Are you sure you want to unban user "${username}"?`)) return;
        
        const reason = prompt('Please provide a reason for unbanning:');
        if (!reason || reason.trim() === '') {
            alert('A reason is required for unbanning.');
            return;
        }
        
        try {
            const response = await fetch(`/admin/unban-user/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: reason.trim() }),
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                alert('User unbanned successfully!');
                loadBannedWarned();
                loadUserManagement();
                loadPendingCounts();
            } else {
                const error = await response.json();
                alert('Failed to unban user: ' + (error.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error unbanning user:', error);
            alert('Error unbanning user. Please try again.');
        }
    };

    window.unsuspendUser = async function(userId, username) {
        if (!confirm(`Are you sure you want to unsuspend user "${username}"?`)) return;
        
        try {
            const response = await fetch(`/admin/users/${userId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'active', reason: 'Unsuspended by admin' }),
                credentials: 'include'
            });

            if (response.ok) {
                alert('User unsuspended successfully!');
                loadBannedWarned();
                loadUserManagement();
            } else {
                const error = await response.json();
                alert('Failed to unsuspend user: ' + error.message);
            }
        } catch (error) {
            console.error('Error unsuspending user:', error);
            alert('Error unsuspending user');
        }
    };

    window.viewUserWarnings = async function(userId, username) {
        try {
            const response = await fetch(`/admin/users/${userId}/warnings`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                displayUserWarningsModal(username, data.warnings || []);
            } else {
                alert('Failed to load user warnings');
            }
        } catch (error) {
            console.error('Error loading user warnings:', error);
            alert('Error loading user warnings');
        }
    };

    function displayUserWarningsModal(username, warnings) {
        const warningsHTML = warnings.length > 0 ? warnings.map(warning => `
            <div class="p-3 border rounded-lg mb-3 ${warning.isActive ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}">
                <div class="flex justify-between items-start mb-2">
                    <span class="text-sm font-medium text-gray-800">${warning.category.replace('_', ' ')}</span>
                    <span class="text-xs px-2 py-1 rounded ${warning.isActive ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}">
                        ${warning.isActive ? 'Active' : 'Resolved'}
                    </span>
                </div>
                <p class="text-sm text-gray-700 mb-1"><strong>Reason:</strong> ${warning.reason}</p>
                <p class="text-sm text-gray-600">${warning.description}</p>
                <p class="text-xs text-gray-500 mt-2">
                    Issued: ${new Date(warning.createdAt).toLocaleDateString()}
                    ${warning.expiryDate ? ` | Expires: ${new Date(warning.expiryDate).toLocaleDateString()}` : ''}
                </p>
            </div>
        `).join('') : '<p class="text-center text-gray-500 py-4">No warnings found for this user.</p>';

        const modalHTML = `
            <div id="warning-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold text-gray-800">Warning History: ${username}</h3>
                        <button onclick="closeWarningModal()" class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div>${warningsHTML}</div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    window.closeWarningModal = function() {
        const modal = document.getElementById('warning-modal');
        if (modal) {
            modal.remove();
        }
    };

    // Update pending counts to include ban appeals
    async function updateBannedAppealsCount() {
        try {
            const response = await fetch('/admin/banned-warned?status=appeals&limit=1', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                const badge = document.getElementById('banned-appeals-badge');
                if (badge) {
                    const count = data.pagination?.totalUsers || 0;
                    badge.textContent = count;
                    badge.style.display = count > 0 ? 'block' : 'none';
                }
            }
        } catch (error) {
            console.error('Error loading ban appeals count:', error);
        }
    }

    // Make functions globally available
    window.loadBannedWarned = loadBannedWarned;

    // Add to the setup functions
    const originalSetupEventListeners = setupEventListeners;
    setupEventListeners = function() {
        originalSetupEventListeners.call(this);
        setupBannedWarnedFilters();
    };

    // Add to the pending counts function
    const originalLoadPendingCounts = loadPendingCounts;
    loadPendingCounts = async function() {
        await originalLoadPendingCounts.call(this);
        await updateBannedAppealsCount();
    };

    // Load banned/warned users when the tab is first activated
    setupTabSwitching = function() {
        const tabButtons = document.querySelectorAll('.admin-tab-btn');
        const tabContents = document.querySelectorAll('.admin-tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                const targetTab = this.getAttribute('data-admin-tab');
                
                // Remove active class from all buttons and contents
                tabButtons.forEach(btn => btn.classList.remove('active-tab'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked button and corresponding content
                this.classList.add('active-tab');
                const targetContent = document.getElementById(targetTab);
                if (targetContent) {
                    targetContent.classList.add('active');
                    
                    // Load data for the active tab
                    switch(targetTab) {
                        case 'dashboard':
                            loadDashboardStats();
                            loadRecentActivity();
                            break;
                        case 'approvals':
                            loadEventApprovals();
                            break;
                        case 'deletions':
                            loadDeletionRequests();
                            break;
                        case 'users':
                            loadUserManagement();
                            break;
                        case 'banned-warned':
                            loadBannedWarned();
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
                }
            });
        });
    };
    // Re-initialize tab switching with the new banned-warned tab
    setupTabSwitching();
});
