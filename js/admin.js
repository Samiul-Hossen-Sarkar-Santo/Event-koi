// This script handles the interactive elements on the admin dashboard.

document.addEventListener('DOMContentLoaded', function() {
    
    // Global variables
    let activityLogsData = [];
    
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

            // Initialize user management when switching to users tab
            if (tabId === 'users') {
                initializeUserManagement();
            }
            
            // Initialize reports when switching to reports tab
            if (tabId === 'reports') {
                initializeReportsManagement();
            }
            
            // Initialize approvals when switching to approvals tab
            if (tabId === 'approvals') {
                initializeApprovalsManagement();
            }
            
            // Initialize activity logs when switching to logs tab
            if (tabId === 'logs') {
                initializeActivityLogsManagement();
            }
            
            // Load recent activity when switching to dashboard
            if (tabId === 'dashboard') {
                loadRecentActivity();
            }
        });
    });

    // --- Logout Button ---
    const logoutBtn = document.getElementById('logoutBtn');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            logout();
        });
    }

    // --- Admin User Data Loading ---
    async function loadAdminUserData() {
        try {
            const response = await fetch('/auth/check');
            if (response.ok) {
                const userData = await response.json();
                if (userData.authenticated && userData.user) {
                    // Check if we have complete user data
                    if (userData.user.name && userData.user.email) {
                        updateAdminProfileDisplay(userData.user);
                    } else {
                        console.warn('Incomplete user data received, using fallback');
                        // Use fallback data or fetch from database
                        updateAdminProfileDisplay({
                            name: 'Admin User',
                            email: userData.user.email || 'admin@system.com',
                            username: userData.user.username || 'admin'
                        });
                    }
                } else {
                    // Not authenticated, redirect to admin portal
                    window.location.href = '/admin-portal.html';
                }
            } else {
                // Auth check failed, redirect to admin portal
                window.location.href = '/admin-portal.html';
            }
        } catch (error) {
            console.error('Error loading admin user data:', error);
            // On error, redirect to admin portal
            window.location.href = '/admin-portal.html';
        }
    }

    function updateAdminProfileDisplay(user) {
        // Update admin name in sidebar - more specific selector
        const adminNameElement = document.querySelector('aside div div h2.text-xl.font-semibold');
        if (adminNameElement && user.name) {
            adminNameElement.textContent = user.name;
        }

        // Update admin email in sidebar - more specific selector
        const adminEmailElement = document.querySelector('aside div div p.text-gray-600');
        if (adminEmailElement && user.email) {
            adminEmailElement.textContent = user.email;
        }

        // Update avatar initials
        const avatarElement = document.querySelector('aside .bg-red-200 span');
        if (avatarElement && user.name) {
            const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
            avatarElement.textContent = initials;
        }

        // Update welcome message in header - more specific selector
        const welcomeElement = document.querySelector('header div div span.font-semibold');
        if (welcomeElement && user.name) {
            welcomeElement.textContent = `Welcome, ${user.name}!`;
        }
    }

    async function loadDashboardStats() {
        try {
            const response = await fetch('/admin/dashboard/stats');
            if (response.ok) {
                const stats = await response.json();
                updateNotificationBadges(stats.overview);
                updateDashboardCards(stats.overview);
            }
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        }
    }

    function updateNotificationBadges(stats) {
        // Update approval queue badge
        const approvalBadge = document.querySelector('[data-admin-tab="approvals"] .notification-badge');
        if (approvalBadge) {
            approvalBadge.textContent = stats.pendingEvents || 0;
            if (stats.pendingEvents === 0) {
                approvalBadge.style.display = 'none';
            } else {
                approvalBadge.style.display = 'inline-flex';
            }
        }

        // Update reports badge
        const reportsBadge = document.querySelector('[data-admin-tab="reports"] .notification-badge');
        if (reportsBadge) {
            reportsBadge.textContent = stats.activeReports || 0;
            if (stats.activeReports === 0) {
                reportsBadge.style.display = 'none';
            } else {
                reportsBadge.style.display = 'inline-flex';
            }
        }
    }

    function updateDashboardCards(stats) {
        // Update pending approvals card
        const pendingApprovalsCard = document.querySelector('#dashboard .text-4xl.text-red-600');
        if (pendingApprovalsCard) {
            pendingApprovalsCard.textContent = stats.pendingEvents || 0;
        }

        // Update open reports card
        const openReportsCards = document.querySelectorAll('#dashboard .text-4xl.text-red-600');
        if (openReportsCards.length > 1) {
            openReportsCards[1].textContent = stats.activeReports || 0;
        }

        // Update active users card
        if (openReportsCards.length > 2) {
            openReportsCards[2].textContent = stats.totalUsers || 0;
        }
    }

    // Load admin user data and stats on page load
    loadAdminUserData();
    loadDashboardStats();
    loadRecentActivity(); // Load recent activity on page load

    async function logout() {
        try {
            const response = await fetch('/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                alert('You have been logged out.');
                window.location.href = '/admin-portal.html';
            } else {
                // Fallback - clear session and redirect anyway
                alert('Logged out (session cleared).');
                window.location.href = '/admin-portal.html';
            }
        } catch (error) {
            console.error('Logout error:', error);
            alert('Logged out (session cleared).');
            window.location.href = '/admin-portal.html';
        }
    }

    // --- User Management Functionality ---
    let usersData = [];
    let filteredUsers = [];
    let currentPage = 1;
    const usersPerPage = 10;

    function initializeUserManagement() {
        if (usersData.length === 0) {
            loadUsers();
        }
        setupUserSearchFilters();
        loadCurrentUserInfo();
    }

    function setupUserSearchFilters() {
        const searchInput = document.getElementById('user-search');
        const roleFilter = document.getElementById('user-role-filter');
        const statusFilter = document.getElementById('user-status-filter');
        const clearButton = document.getElementById('clear-user-search');

        if (!searchInput || !roleFilter || !statusFilter || !clearButton) return;

        // Add event listeners for real-time filtering
        searchInput.addEventListener('input', debounce(filterUsers, 300));
        roleFilter.addEventListener('change', filterUsers);
        statusFilter.addEventListener('change', filterUsers);
        clearButton.addEventListener('click', clearFilters);
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

    async function loadUsers() {
        try {
            showLoadingState();
            const response = await fetch('/users/admin/all?limit=100'); // Load more users for client-side filtering
            
            if (response.status === 401) {
                // User not authenticated
                showAuthRequired();
                return;
            }
            
            if (response.status === 403) {
                // User not admin
                showAccessDenied();
                return;
            }
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            usersData = data.users || [];
            filteredUsers = [...usersData];
            renderUsers();
        } catch (error) {
            console.error('Error loading users:', error);
            showErrorState('Failed to load users. Please try again.');
        }
    }

    function filterUsers() {
        const searchInput = document.getElementById('user-search');
        const roleFilter = document.getElementById('user-role-filter');
        const statusFilter = document.getElementById('user-status-filter');

        if (!searchInput || !roleFilter || !statusFilter) return;

        const searchTerm = searchInput.value.toLowerCase().trim();
        const selectedRole = roleFilter.value;
        const selectedStatus = statusFilter.value;

        filteredUsers = usersData.filter(user => {
            // Search filter
            const matchesSearch = !searchTerm || 
                (user.name && user.name.toLowerCase().includes(searchTerm)) ||
                (user.username && user.username.toLowerCase().includes(searchTerm)) ||
                (user.email && user.email.toLowerCase().includes(searchTerm));

            // Role filter
            const matchesRole = selectedRole === 'all' || user.role === selectedRole;

            // Status filter
            const matchesStatus = selectedStatus === 'all' || user.accountStatus === selectedStatus;

            return matchesSearch && matchesRole && matchesStatus;
        });

        currentPage = 1; // Reset to first page when filtering
        renderUsers();
    }

    function clearFilters() {
        const searchInput = document.getElementById('user-search');
        const roleFilter = document.getElementById('user-role-filter');
        const statusFilter = document.getElementById('user-status-filter');

        if (searchInput) searchInput.value = '';
        if (roleFilter) roleFilter.value = 'all';
        if (statusFilter) statusFilter.value = 'all';

        filteredUsers = [...usersData];
        currentPage = 1;
        renderUsers();
    }

    function renderUsers() {
        const container = document.getElementById('users-container');
        if (!container) return;

        if (filteredUsers.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-users text-4xl mb-4"></i>
                    <p>No users found matching your criteria.</p>
                </div>
            `;
            return;
        }

        // Calculate pagination
        const startIndex = (currentPage - 1) * usersPerPage;
        const endIndex = startIndex + usersPerPage;
        const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
        const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

        let html = '';

        // Users list
        paginatedUsers.forEach(user => {
            const statusColor = getStatusColor(user.accountStatus);
            const roleIcon = getRoleIcon(user.role);
            
            html += `
                <div class="bg-white rounded-lg p-6 border shadow-sm hover:shadow-md transition-shadow">
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div class="flex items-center space-x-4 mb-4 md:mb-0">
                            <div class="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                ${user.profilePicture ? 
                                    `<img src="${user.profilePicture}" alt="${user.name || user.username}" class="w-12 h-12 rounded-full object-cover">` :
                                    `<i class="fas fa-user text-gray-500"></i>`
                                }
                            </div>
                            <div>
                                <h3 class="font-semibold text-lg">${user.name || user.username}</h3>
                                <p class="text-gray-600 text-sm">${user.email}</p>
                                <div class="flex items-center space-x-3 mt-1">
                                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        <i class="${roleIcon} mr-1"></i> ${capitalizeFirst(user.role)}
                                    </span>
                                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColor}">
                                        ${capitalizeFirst(user.accountStatus || 'active')}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="flex flex-col items-end space-y-2">
                            <div class="text-sm text-gray-500">
                                <p><strong>Registrations:</strong> ${user.stats?.registrations || 0}</p>
                                <p><strong>Events Created:</strong> ${user.stats?.eventsCreated || 0}</p>
                                <p><strong>Last Active:</strong> ${formatDate(user.stats?.lastActive || user.createdAt)}</p>
                            </div>
                            <div class="flex space-x-2">
                                <button class="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors" onclick="viewUser('${user._id}')">
                                    <i class="fas fa-eye mr-1"></i> View
                                </button>
                                <button class="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition-colors" onclick="editUser('${user._id}')">
                                    <i class="fas fa-edit mr-1"></i> Edit
                                </button>
                                ${user.accountStatus !== 'banned' ? 
                                    `<button class="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors" onclick="banUser('${user._id}')">
                                        <i class="fas fa-ban mr-1"></i> Ban
                                    </button>` :
                                    `<button class="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors" onclick="unbanUser('${user._id}')">
                                        <i class="fas fa-check mr-1"></i> Unban
                                    </button>`
                                }
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        // Pagination
        if (totalPages > 1) {
            html += `
                <div class="flex justify-center items-center space-x-2 mt-6">
                    <button class="px-3 py-2 bg-gray-200 text-gray-600 rounded hover:bg-gray-300 transition-colors ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}" 
                            onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <span class="text-sm text-gray-600">
                        Page ${currentPage} of ${totalPages} (${filteredUsers.length} users)
                    </span>
                    <button class="px-3 py-2 bg-gray-200 text-gray-600 rounded hover:bg-gray-300 transition-colors ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}" 
                            onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    function showLoadingState() {
        const container = document.getElementById('users-container');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-spinner fa-spin text-4xl mb-4"></i>
                    <p>Loading users...</p>
                </div>
            `;
        }
    }

    function showErrorState(message) {
        const container = document.getElementById('users-container');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-8 text-red-500">
                    <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                    <p>${message}</p>
                    <button class="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600" onclick="location.reload()">
                        Try Again
                    </button>
                </div>
            `;
        }
    }

    function showAuthRequired() {
        const container = document.getElementById('users-container');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-8 text-yellow-600">
                    <i class="fas fa-lock text-4xl mb-4"></i>
                    <h3 class="text-xl font-semibold mb-2">Authentication Required</h3>
                    <p class="mb-4">You need to log in as an admin to access this page.</p>
                    <a href="/login_signup.html" class="inline-block px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                        <i class="fas fa-sign-in-alt mr-2"></i>Go to Login
                    </a>
                </div>
            `;
        }
    }

    function showAccessDenied() {
        const container = document.getElementById('users-container');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-8 text-red-600">
                    <i class="fas fa-ban text-4xl mb-4"></i>
                    <h3 class="text-xl font-semibold mb-2">Access Denied</h3>
                    <p class="mb-4">You don't have admin privileges to access this page.</p>
                    <button class="px-6 py-3 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors" onclick="logout()">
                        <i class="fas fa-sign-out-alt mr-2"></i>Logout
                    </button>
                </div>
            `;
        }
    }

    function getStatusColor(status) {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'suspended': return 'bg-yellow-100 text-yellow-800';
            case 'banned': return 'bg-red-100 text-red-800';
            case 'restricted': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    function getRoleIcon(role) {
        switch (role) {
            case 'admin': return 'fas fa-crown';
            case 'organizer': return 'fas fa-calendar-plus';
            case 'user': return 'fas fa-user';
            default: return 'fas fa-user';
        }
    }

    function capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    async function loadCurrentUserInfo() {
        try {
            const response = await fetch('/auth/status');
            if (response.ok) {
                const userData = await response.json();
                if (userData.user && userData.user.name) {
                    // Update the welcome message if we have user info
                    const welcomeElement = document.querySelector('header span');
                    if (welcomeElement) {
                        welcomeElement.textContent = `Welcome, ${userData.user.name}!`;
                    }
                }
            }
        } catch (error) {
            // Silently handle user info loading errors
        }
    }

    // Global functions for user actions
    window.changePage = function(page) {
        const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
        if (page >= 1 && page <= totalPages) {
            currentPage = page;
            renderUsers();
        }
    };

    window.viewUser = function(userId) {
        // In a real app, this would open a user detail modal or navigate to user profile
        window.open(`/user.html?id=${userId}`, '_blank');
    };

    window.editUser = function(userId) {
        // Find the user data
        const user = usersData.find(u => u._id === userId);
        if (!user) return;

        // Create a simple edit modal (in a real app, this would be more sophisticated)
        const newRole = prompt(`Edit role for ${user.name || user.username}\nCurrent: ${user.role}\nNew role (admin/organizer/user):`, user.role);
        if (newRole && ['admin', 'organizer', 'user'].includes(newRole.toLowerCase())) {
            updateUserRole(userId, newRole.toLowerCase());
        }
    };

    window.banUser = function(userId) {
        if (confirm('Are you sure you want to ban this user?')) {
            updateUserStatus(userId, 'banned', 'Banned by admin');
        }
    };

    window.unbanUser = function(userId) {
        if (confirm('Are you sure you want to unban this user?')) {
            updateUserStatus(userId, 'active', 'Unbanned by admin');
        }
    };

    async function updateUserStatus(userId, status, reason) {
        try {
            const response = await fetch(`/users/admin/${userId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status, reason })
            });

            if (response.ok) {
                alert(`User status updated to ${status}`);
                loadUsers(); // Reload to reflect changes
            } else {
                const error = await response.text();
                alert(`Failed to update user status: ${error}`);
            }
        } catch (error) {
            console.error('Error updating user status:', error);
            alert('Failed to update user status. Please try again.');
        }
    }

    async function updateUserRole(userId, role) {
        try {
            const response = await fetch(`/users/admin/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ role })
            });

            if (response.ok) {
                alert(`User role updated to ${role}`);
                loadUsers(); // Reload to reflect changes
            } else {
                const error = await response.text();
                alert(`Failed to update user role: ${error}`);
            }
        } catch (error) {
            console.error('Error updating user role:', error);
            alert('Failed to update user role. Please try again.');
        }
    }

    // Make logout function globally available
    window.logout = logout;

    // --- Reports Management Functionality ---
    let reportsData = [];
    let filteredReports = [];

    function initializeReportsManagement() {
        loadReports();
    }

    async function loadReports() {
        try {
            showReportsLoadingState();
            const response = await fetch('/admin/reports?limit=100');
            
            if (response.status === 401) {
                showReportsAuthRequired();
                return;
            }
            
            if (response.status === 403) {
                showReportsAccessDenied();
                return;
            }
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            reportsData = data.reports || [];
            filteredReports = [...reportsData];
            renderReports();
        } catch (error) {
            console.error('Error loading reports:', error);
            showReportsErrorState('Failed to load reports. Please try again.');
        }
    }

    function renderReports() {
        const reportsTab = document.getElementById('reports');
        if (!reportsTab) return;

        const existingTable = reportsTab.querySelector('.overflow-x-auto');
        if (!existingTable) return;

        if (filteredReports.length === 0) {
            existingTable.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-flag text-4xl mb-4"></i>
                    <p>No reports found.</p>
                </div>
            `;
            return;
        }

        let tableHTML = `
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-100">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reporter</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
        `;

        filteredReports.forEach(report => {
            const statusColor = getReportStatusColor(report.status);
            const priorityColor = getReportPriorityColor(report.priority);
            
            // Use the populated names instead of IDs
            const targetName = report.reportedEntityName || `${report.reportedEntityModel}: ${report.reportedEntity}`;
            const reporterName = report.reporterName || 'Anonymous';
            
            tableHTML += `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                            <div class="font-medium">${report.reportedEntityModel}: ${targetName}</div>
                            <div class="text-gray-500 text-xs">${report.reason}</div>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${reporterName}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${capitalizeFirst(report.reportType)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">
                            ${capitalizeFirst(report.status)}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${priorityColor}">
                            ${capitalizeFirst(report.priority)}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        ${report.status === 'pending' || report.status === 'investigating' ? `
                            <button class="text-blue-600 hover:text-blue-900 mr-3" onclick="reviewReport('${report._id}')">
                                Review
                            </button>
                            <button class="text-green-600 hover:text-green-900 mr-3" onclick="resolveReport('${report._id}')">
                                Resolve
                            </button>
                            <button class="text-red-600 hover:text-red-900" onclick="dismissReport('${report._id}')">
                                Dismiss
                            </button>
                        ` : `
                            <span class="text-gray-400">Completed</span>
                        `}
                    </td>
                </tr>
            `;
        });

        tableHTML += `
                </tbody>
            </table>
        `;

        existingTable.innerHTML = tableHTML;
    }

    function showReportsLoadingState() {
        const reportsTab = document.getElementById('reports');
        if (!reportsTab) return;
        
        const existingTable = reportsTab.querySelector('.overflow-x-auto');
        if (existingTable) {
            existingTable.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-spinner fa-spin text-4xl mb-4"></i>
                    <p>Loading reports...</p>
                </div>
            `;
        }
    }

    function showReportsErrorState(message) {
        const reportsTab = document.getElementById('reports');
        if (!reportsTab) return;
        
        const existingTable = reportsTab.querySelector('.overflow-x-auto');
        if (existingTable) {
            existingTable.innerHTML = `
                <div class="text-center py-8 text-red-500">
                    <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                    <p>${message}</p>
                    <button class="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600" onclick="loadReports()">
                        Try Again
                    </button>
                </div>
            `;
        }
    }

    function showReportsAuthRequired() {
        const reportsTab = document.getElementById('reports');
        if (!reportsTab) return;
        
        const existingTable = reportsTab.querySelector('.overflow-x-auto');
        if (existingTable) {
            existingTable.innerHTML = `
                <div class="text-center py-8 text-yellow-600">
                    <i class="fas fa-lock text-4xl mb-4"></i>
                    <h3 class="text-xl font-semibold mb-2">Authentication Required</h3>
                    <p class="mb-4">You need to log in as an admin to access reports.</p>
                </div>
            `;
        }
    }

    function showReportsAccessDenied() {
        const reportsTab = document.getElementById('reports');
        if (!reportsTab) return;
        
        const existingTable = reportsTab.querySelector('.overflow-x-auto');
        if (existingTable) {
            existingTable.innerHTML = `
                <div class="text-center py-8 text-red-600">
                    <i class="fas fa-ban text-4xl mb-4"></i>
                    <h3 class="text-xl font-semibold mb-2">Access Denied</h3>
                    <p class="mb-4">You don't have admin privileges to access reports.</p>
                </div>
            `;
        }
    }

    function getReportStatusColor(status) {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'investigating': return 'bg-blue-100 text-blue-800';
            case 'resolved': return 'bg-green-100 text-green-800';
            case 'dismissed': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    function getReportPriorityColor(priority) {
        switch (priority) {
            case 'low': return 'bg-green-100 text-green-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'high': return 'bg-orange-100 text-orange-800';
            case 'urgent': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    // Global functions for report actions
    window.reviewReport = function(reportId) {
        const report = reportsData.find(r => r._id === reportId);
        if (!report) return;
        
        alert(`Reviewing report: ${report.reason}\nDescription: ${report.description}`);
    };

    window.resolveReport = function(reportId) {
        const report = reportsData.find(r => r._id === reportId);
        if (!report) return;

        const action = prompt('Resolution action (no_action/warning_issued/content_removed/user_suspended/user_banned):', 'no_action');
        if (!action) return;

        const adminNotes = prompt('Admin notes (optional):', '');
        
        updateReportStatus(reportId, 'resolved', action, adminNotes);
    };

    window.dismissReport = function(reportId) {
        if (confirm('Are you sure you want to dismiss this report?')) {
            const adminNotes = prompt('Reason for dismissal (optional):', '');
            updateReportStatus(reportId, 'dismissed', 'no_action', adminNotes);
        }
    };

    async function updateReportStatus(reportId, status, resolutionAction, adminNotes) {
        try {
            const response = await fetch(`/admin/reports/${reportId}/resolve`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    action: status, 
                    resolutionAction, 
                    adminNotes 
                })
            });

            if (response.ok) {
                alert(`Report ${status} successfully`);
                loadReports(); // Reload to reflect changes
            } else {
                const error = await response.text();
                alert(`Failed to update report: ${error}`);
            }
        } catch (error) {
            console.error('Error updating report:', error);
            alert('Failed to update report. Please try again.');
        }
    }

    // Make reports functions globally available
    window.loadReports = loadReports;

    // --- Approval Queue Management Functionality ---
    let approvalsData = [];
    let filteredApprovals = [];

    function initializeApprovalsManagement() {
        loadApprovals();
    }

    async function loadApprovals() {
        try {
            showApprovalsLoadingState();
            const response = await fetch('/admin/events/approval-queue?limit=100');
            
            if (response.status === 401) {
                showApprovalsAuthRequired();
                return;
            }
            
            if (response.status === 403) {
                showApprovalsAccessDenied();
                return;
            }
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            approvalsData = data.events || [];
            filteredApprovals = [...approvalsData];
            renderApprovals();
        } catch (error) {
            console.error('Error loading approvals:', error);
            showApprovalsErrorState('Failed to load approval queue. Please try again.');
        }
    }

    function renderApprovals() {
        const approvalsTab = document.getElementById('approvals');
        if (!approvalsTab) return;

        const existingContainer = approvalsTab.querySelector('.space-y-4');
        if (!existingContainer) return;

        if (filteredApprovals.length === 0) {
            existingContainer.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-inbox text-4xl mb-4"></i>
                    <p>No events pending approval.</p>
                </div>
            `;
            return;
        }

        let html = '';
        filteredApprovals.forEach(event => {
            const statusColor = getApprovalStatusColor(event.approvalStatus);
            const eventDate = new Date(event.date).toLocaleDateString();
            const createdDate = new Date(event.createdAt).toLocaleDateString();
            
            // Determine event type tags
            let eventTypeTags = '';
            if (event.isEdit) {
                eventTypeTags += `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                    <i class="fas fa-edit mr-1"></i>EDIT
                </span>`;
            }
            if (event.deletionStatus === 'requested') {
                eventTypeTags += `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mr-2">
                    <i class="fas fa-trash mr-1"></i>DELETE REQUEST
                </span>`;
            }
            
            html += `
                <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div class="flex flex-col md:flex-row justify-between">
                        <div class="flex-1">
                            <div class="flex items-center gap-2 mb-2">
                                <h3 class="font-bold text-lg">${event.title}</h3>
                                ${eventTypeTags}
                            </div>
                            ${event.isEdit ? `<p class="text-blue-600 text-sm mb-2">
                                <i class="fas fa-info-circle mr-1"></i>This is an edit of an existing event
                                ${event.editReason ? ` - ${event.editReason}` : ''}
                            </p>` : ''}
                            ${event.deletionStatus === 'requested' ? `<p class="text-red-600 text-sm mb-2">
                                <i class="fas fa-exclamation-triangle mr-1"></i>Organizer requested deletion: ${event.deletionReason || 'No reason provided'}
                            </p>` : ''}
                            <p class="text-gray-500 text-sm mt-1">
                                <i class="fas fa-user mr-2"></i>${event.organizer?.name || event.organizer?.username || 'Unknown Organizer'}
                            </p>
                            <p class="text-gray-500 text-sm">
                                <i class="fas fa-calendar-alt mr-2"></i>${eventDate} at ${event.time}
                            </p>
                            <p class="text-gray-500 text-sm">
                                <i class="fas fa-map-marker-alt mr-2"></i>${event.location}
                            </p>
                            <p class="text-gray-500 text-sm">
                                <i class="fas fa-tag mr-2"></i>${event.category}
                            </p>
                            <p class="text-gray-500 text-sm">
                                <i class="fas fa-clock mr-2"></i>Submitted: ${createdDate}
                            </p>
                            <div class="mt-2">
                                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColor}">
                                    ${capitalizeFirst(event.approvalStatus.replace('_', ' '))}
                                </span>
                            </div>
                            ${event.adminRemarks ? `
                                <div class="mt-2">
                                    <p class="text-sm text-gray-600"><strong>Admin Remarks:</strong> ${event.adminRemarks}</p>
                                </div>
                            ` : ''}
                        </div>
                        <div class="flex items-center mt-4 md:mt-0 space-x-2">
                            ${event.deletionStatus === 'requested' ? `
                                <button class="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg" onclick="approveEventDeletion('${event._id}')">
                                    <i class="fas fa-trash mr-1"></i>Approve Deletion
                                </button>
                                <button class="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg" onclick="rejectEventDeletion('${event._id}')">
                                    <i class="fas fa-times mr-1"></i>Deny Deletion
                                </button>
                            ` : event.approvalStatus === 'pending' || event.approvalStatus === 'changes_requested' ? `
                                <button class="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg" onclick="approveEvent('${event._id}')">
                                    <i class="fas fa-check mr-1"></i>Approve
                                </button>
                                <button class="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg" onclick="rejectEvent('${event._id}')">
                                    <i class="fas fa-times mr-1"></i>Reject
                                </button>
                                <button class="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg" onclick="requestChanges('${event._id}')">
                                    <i class="fas fa-edit mr-1"></i>Request Changes
                                </button>
                            ` : `
                                <span class="text-gray-400 font-medium">
                                    ${event.approvalStatus === 'approved' ? 'Approved' : 'Rejected'}
                                </span>
                            `}
                            <button class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg" onclick="viewEvent('${event._id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        existingContainer.innerHTML = html;
    }

    function showApprovalsLoadingState() {
        const approvalsTab = document.getElementById('approvals');
        if (!approvalsTab) return;
        
        const existingContainer = approvalsTab.querySelector('.space-y-4');
        if (existingContainer) {
            existingContainer.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-spinner fa-spin text-4xl mb-4"></i>
                    <p>Loading approval queue...</p>
                </div>
            `;
        }
    }

    function showApprovalsErrorState(message) {
        const approvalsTab = document.getElementById('approvals');
        if (!approvalsTab) return;
        
        const existingContainer = approvalsTab.querySelector('.space-y-4');
        if (existingContainer) {
            existingContainer.innerHTML = `
                <div class="text-center py-8 text-red-500">
                    <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                    <p>${message}</p>
                    <button class="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600" onclick="loadApprovals()">
                        Try Again
                    </button>
                </div>
            `;
        }
    }

    function showApprovalsAuthRequired() {
        const approvalsTab = document.getElementById('approvals');
        if (!approvalsTab) return;
        
        const existingContainer = approvalsTab.querySelector('.space-y-4');
        if (existingContainer) {
            existingContainer.innerHTML = `
                <div class="text-center py-8 text-yellow-600">
                    <i class="fas fa-lock text-4xl mb-4"></i>
                    <h3 class="text-xl font-semibold mb-2">Authentication Required</h3>
                    <p class="mb-4">You need to log in as an admin to access the approval queue.</p>
                </div>
            `;
        }
    }

    function showApprovalsAccessDenied() {
        const approvalsTab = document.getElementById('approvals');
        if (!approvalsTab) return;
        
        const existingContainer = approvalsTab.querySelector('.space-y-4');
        if (existingContainer) {
            existingContainer.innerHTML = `
                <div class="text-center py-8 text-red-600">
                    <i class="fas fa-ban text-4xl mb-4"></i>
                    <h3 class="text-xl font-semibold mb-2">Access Denied</h3>
                    <p class="mb-4">You don't have admin privileges to access the approval queue.</p>
                </div>
            `;
        }
    }

    function getApprovalStatusColor(status) {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            case 'changes_requested': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    // Global functions for approval actions
    window.approveEvent = function(eventId) {
        if (confirm('Are you sure you want to approve this event?')) {
            updateEventStatus(eventId, 'approve', '');
        }
    };

    window.rejectEvent = function(eventId) {
        const reason = prompt('Reason for rejection:', '');
        if (reason !== null) {
            updateEventStatus(eventId, 'reject', reason);
        }
    };

    window.requestChanges = function(eventId) {
        const changes = prompt('What changes are requested?', '');
        if (changes !== null) {
            updateEventStatus(eventId, 'request_changes', changes);
        }
    };

    window.approveEventDeletion = function(eventId) {
        if (confirm('⚠️ WARNING: This will permanently delete the event from the database.\n\nThis action cannot be undone. All registrations, comments, and event data will be lost forever.\n\nAre you sure you want to approve this deletion request?')) {
            updateEventStatus(eventId, 'approve_deletion', 'Deletion approved by admin');
        }
    };

    window.rejectEventDeletion = function(eventId) {
        const reason = prompt('Reason for denying the deletion request:', 'Deletion request denied');
        if (reason !== null) {
            updateEventStatus(eventId, 'reject', reason);
        }
    };

    window.viewEvent = function(eventId) {
        // In a real app, this would open event details
        window.open(`/event_page.html?id=${eventId}`, '_blank');
    };

    async function updateEventStatus(eventId, action, reason) {
        try {
            const response = await fetch(`/admin/events/${eventId}/moderate`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    action, 
                    reason,
                    requestedChanges: action === 'request_changes' ? [reason] : []
                })
            });

            if (response.ok) {
                const result = await response.json();
                alert(result.message);
                loadApprovals(); // Reload to reflect changes
            } else {
                const error = await response.text();
                alert(`Failed to update event: ${error}`);
            }
        } catch (error) {
            console.error('Error updating event status:', error);
            alert('Failed to update event. Please try again.');
        }
    }

    // --- Activity Logs Management Functionality ---

    function initializeActivityLogsManagement() {
        loadActivityLogs();
        
        // Setup admin filter dropdown
        const adminFilter = document.getElementById('admin-filter');
        if (adminFilter) {
            adminFilter.addEventListener('change', function() {
                filterActivityLogsByAdmin(this.value);
            });
        }
    }

    // Populate admin filter dropdown from loaded activity logs data
    function populateAdminFilterFromData() {
        const adminFilter = document.getElementById('admin-filter');
        if (!adminFilter || !activityLogsData) return;

        // Extract unique admin names from the logs
        const uniqueAdmins = [...new Set(activityLogsData.map(log => {
            if (log.adminId && log.adminId.name) return log.adminId.name;
            if (log.adminId && log.adminId.username) return log.adminId.username;
            if (log.adminName) return log.adminName;
            return 'Unknown Admin';
        }))];

        // Clear and repopulate dropdown
        adminFilter.innerHTML = '<option value="all">All Admins</option>';
        uniqueAdmins.forEach(adminName => {
            const option = document.createElement('option');
            option.value = adminName;
            option.textContent = adminName;
            adminFilter.appendChild(option);
        });
    }

    // Filter activity logs by selected admin
    function filterActivityLogsByAdmin(selectedAdmin) {
        const tbody = document.getElementById('activity-log-tbody');
        if (!tbody || !activityLogsData) return;

        let filteredLogs = activityLogsData;
        if (selectedAdmin !== 'all') {
            filteredLogs = activityLogsData.filter(log => {
                const adminName = log.adminId ? (log.adminId.name || log.adminId.username) : 'Unknown Admin';
                return adminName === selectedAdmin;
            });
        }

        // Re-render the table with filtered data
        if (filteredLogs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No logs found for selected admin.</td></tr>';
            return;
        }

        let html = '';
        filteredLogs.forEach(log => {
            const adminName = log.adminId ? (log.adminId.name || log.adminId.username) : 'Unknown Admin';
            const timeAgo = formatTimeAgo(log.createdAt);
            
            html += `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <div class="text-sm font-medium text-gray-900">${adminName}</div>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(log.action)}">
                            ${formatActionName(log.action)}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${log.targetType}
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-500">
                        <div class="max-w-xs">
                            ${log.details?.reason ? `<div><strong>Reason:</strong> ${log.details.reason}</div>` : ''}
                            ${log.details?.previousStatus ? `<div><strong>From:</strong> ${log.details.previousStatus}</div>` : ''}
                            ${log.details?.newStatus ? `<div><strong>To:</strong> ${log.details.newStatus}</div>` : ''}
                            ${log.details?.additionalNotes ? `<div><strong>Notes:</strong> ${log.details.additionalNotes}</div>` : ''}
                        </div>
                        <div class="mt-1">
                            <span class="px-1 inline-flex text-xs leading-5 font-semibold rounded ${getSeverityColor(log.severity)}">
                                ${capitalizeFirst(log.severity)}
                            </span>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${timeAgo}
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    }

    async function loadActivityLogs() {
        try {
            showActivityLogsLoadingState();
            const response = await fetch('/admin/logs?limit=100');
            
            if (response.status === 401) {
                showActivityLogsAuthRequired();
                return;
            }
            
            if (response.status === 403) {
                showActivityLogsAccessDenied();
                return;
            }
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            activityLogsData = data.logs || [];
            renderActivityLogs();
            
            // Populate admin filter dropdown from loaded data
            populateAdminFilterFromData();
            
        } catch (error) {
            console.error('Error loading activity logs:', error);
            showActivityLogsErrorState('Failed to load activity logs. Please try again.');
        }
    }

    function renderActivityLogs() {
        const logsTab = document.getElementById('logs');
        if (!logsTab) return;

        // Check if we need to recreate the structure (but preserve the filter if it exists)
        let container = logsTab.querySelector('.activity-logs-container');
        let hasFilter = document.getElementById('admin-filter');
        
        if (!container) {
            logsTab.innerHTML = `
                <h2 class="text-2xl font-bold mb-6 text-gray-800">Admin Activity Log</h2>
                
                <!-- Filter Section -->
                <div class="mb-4 flex items-center space-x-4">
                    <label for="admin-filter" class="text-sm font-medium text-gray-700">Filter by Admin:</label>
                    <select id="admin-filter" class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500">
                        <option value="all">All Admins</option>
                    </select>
                </div>
                
                <div class="overflow-x-auto bg-gray-50 p-4 rounded-lg border">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-100">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200" id="activity-log-tbody">
                        </tbody>
                    </table>
                </div>
            `;
            
            // Re-setup filter after recreating HTML
            const adminFilter = document.getElementById('admin-filter');
            if (adminFilter) {
                adminFilter.addEventListener('change', function() {
                    filterActivityLogsByAdmin(this.value);
                });
            }
        }

        const tbody = document.getElementById('activity-log-tbody');
        if (!tbody) return;

        if (activityLogsData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                        <i class="fas fa-clipboard-list text-4xl mb-4 block"></i>
                        No activity logs found.
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        activityLogsData.forEach(log => {
            const adminName = log.adminId ? (log.adminId.name || log.adminId.username) : 'Unknown Admin';
            const timeAgo = formatTimeAgo(log.createdAt);
            
            html += `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <div class="text-sm font-medium text-gray-900">${adminName}</div>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(log.action)}">
                            ${formatActionName(log.action)}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${log.targetType}
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-500">
                        <div class="max-w-xs">
                            ${log.details?.reason ? `<div><strong>Reason:</strong> ${log.details.reason}</div>` : ''}
                            ${log.details?.previousStatus ? `<div><strong>From:</strong> ${log.details.previousStatus}</div>` : ''}
                            ${log.details?.newStatus ? `<div><strong>To:</strong> ${log.details.newStatus}</div>` : ''}
                            ${log.details?.additionalNotes ? `<div><strong>Notes:</strong> ${log.details.additionalNotes}</div>` : ''}
                        </div>
                        <div class="mt-1">
                            <span class="px-1 inline-flex text-xs leading-5 font-semibold rounded ${getSeverityColor(log.severity)}">
                                ${capitalizeFirst(log.severity)}
                            </span>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${timeAgo}
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
        
        // Populate filter dropdown after rendering
        populateAdminFilterFromData();
    }

    function showActivityLogsLoadingState() {
        const logsTab = document.getElementById('logs');
        if (!logsTab) return;
        
        logsTab.innerHTML = `
            <h2 class="text-2xl font-bold mb-6 text-gray-800">Activity Log</h2>
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-spinner fa-spin text-4xl mb-4"></i>
                <p>Loading activity logs...</p>
            </div>
        `;
    }

    function showActivityLogsErrorState(message) {
        const logsTab = document.getElementById('logs');
        if (!logsTab) return;
        
        logsTab.innerHTML = `
            <h2 class="text-2xl font-bold mb-6 text-gray-800">Activity Log</h2>
            <div class="text-center py-8 text-red-500">
                <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                <p>${message}</p>
                <button class="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600" onclick="loadActivityLogs()">
                    Try Again
                </button>
            </div>
        `;
    }

    function showActivityLogsAuthRequired() {
        const logsTab = document.getElementById('logs');
        if (!logsTab) return;
        
        logsTab.innerHTML = `
            <h2 class="text-2xl font-bold mb-6 text-gray-800">Activity Log</h2>
            <div class="text-center py-8 text-yellow-600">
                <i class="fas fa-lock text-4xl mb-4"></i>
                <h3 class="text-xl font-semibold mb-2">Authentication Required</h3>
                <p class="mb-4">You need to log in as an admin to access activity logs.</p>
            </div>
        `;
    }

    function showActivityLogsAccessDenied() {
        const logsTab = document.getElementById('logs');
        if (!logsTab) return;
        
        logsTab.innerHTML = `
            <h2 class="text-2xl font-bold mb-6 text-gray-800">Activity Log</h2>
            <div class="text-center py-8 text-red-600">
                <i class="fas fa-ban text-4xl mb-4"></i>
                <h3 class="text-xl font-semibold mb-2">Access Denied</h3>
                <p class="mb-4">You don't have admin privileges to access activity logs.</p>
            </div>
        `;
    }

    // --- Recent Activity for Dashboard ---
    async function loadRecentActivity() {
        try {
            const response = await fetch('/admin/dashboard/recent-activity?limit=5');
            
            if (!response.ok) {
                console.error('Failed to load recent activity');
                return;
            }
            
            const activities = await response.json();
            renderRecentActivity(activities);
        } catch (error) {
            console.error('Error loading recent activity:', error);
        }
    }

    function renderRecentActivity(activities) {
        const activityTable = document.querySelector('#dashboard tbody');
        if (!activityTable) return;

        if (activities.length === 0) {
            activityTable.innerHTML = `
                <tr>
                    <td colspan="3" class="px-6 py-4 text-center text-gray-500">No recent activity</td>
                </tr>
            `;
            return;
        }

        let html = '';
        activities.forEach(activity => {
            const actionColor = getRecentActivityColor(activity.color);
            
            html += `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium ${actionColor}">
                        <i class="fas fa-${activity.icon} mr-2"></i>${formatActionName(activity.type)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${activity.message}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${activity.time}</td>
                </tr>
            `;
        });

        activityTable.innerHTML = html;
    }

    function getActionColor(action) {
        const actionLower = action?.toLowerCase() || '';
        if (actionLower.includes('approve')) return 'bg-green-100 text-green-800';
        if (actionLower.includes('reject')) return 'bg-red-100 text-red-800';
        if (actionLower.includes('delete')) return 'bg-red-100 text-red-800';
        if (actionLower.includes('update') || actionLower.includes('edit')) return 'bg-blue-100 text-blue-800';
        if (actionLower.includes('create')) return 'bg-green-100 text-green-800';
        return 'bg-gray-100 text-gray-800';
    }

    function getSeverityColor(severity) {
        switch(severity?.toLowerCase()) {
            case 'high': return 'bg-red-100 text-red-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'low': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    function formatActionName(action) {
        return action ? action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown Action';
    }

    function capitalizeFirst(str) {
        return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';
    }

    function formatTimeAgo(date) {
        if (!date) return 'Unknown time';
        const now = new Date();
        const diffMs = now - new Date(date);
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        return 'Just now';
    }

    function getRecentActivityColor(color) {
        switch (color) {
            case 'green': return 'text-green-600';
            case 'red': return 'text-red-600';
            case 'yellow': return 'text-yellow-600';
            case 'blue': return 'text-blue-600';
            case 'orange': return 'text-orange-600';
            case 'purple': return 'text-purple-600';
            default: return 'text-gray-600';
        }
    }

});
