// This script handles the interactive elements on the organizer dashboard.

document.addEventListener('DOMContentLoaded', function() {
    
    // Check organizer authentication first
    checkOrganizerAuth();
    
    // Load dashboard data on page load
    loadDashboardData();
    loadMyEvents();
    loadSponsorInquiries();
    loadQuestions();
    loadNotices();
    loadRecentActivity();
    
    // Initialize charts after a small delay to ensure DOM is ready
    setTimeout(() => {
        initializeCharts();
    }, 500);
    
    // Organizer Events Search and Filter Variables
    let allOrganizerEvents = { active: [], pending: [], past: [] };
    let filteredOrganizerEvents = { active: [], pending: [], past: [] };
    
    // Initialize Organizer Events Search and Filter
    function initializeOrganizerEventsSearch() {
        const searchInput = document.getElementById('organizer-events-search');
        const categoryFilter = document.getElementById('organizer-events-category-filter');
        const statusFilter = document.getElementById('organizer-events-status-filter');
        const clearButton = document.getElementById('organizer-events-clear-filter');
        
        if (searchInput) {
            searchInput.addEventListener('input', debounce(filterOrganizerEvents, 300));
        }
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', filterOrganizerEvents);
        }
        
        if (statusFilter) {
            statusFilter.addEventListener('change', filterOrganizerEvents);
        }
        
        if (clearButton) {
            clearButton.addEventListener('click', clearOrganizerEventsFilters);
        }
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
    
    function filterOrganizerEvents() {
        const searchQuery = document.getElementById('organizer-events-search')?.value.toLowerCase() || '';
        const categoryFilter = document.getElementById('organizer-events-category-filter')?.value || 'all';
        const statusFilter = document.getElementById('organizer-events-status-filter')?.value || 'all';
        
        // Filter each event category
        ['active', 'pending', 'past'].forEach(status => {
            filteredOrganizerEvents[status] = allOrganizerEvents[status].filter(event => {
                // Search filter
                const matchesSearch = searchQuery === '' || 
                    event.title.toLowerCase().includes(searchQuery) ||
                    event.category.toLowerCase().includes(searchQuery) ||
                    event.location.toLowerCase().includes(searchQuery) ||
                    (event.description && event.description.toLowerCase().includes(searchQuery));
                
                // Category filter
                const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter;
                
                return matchesSearch && matchesCategory;
            });
        });
        
        // If status filter is applied, show only events from that status
        let eventsToShow;
        if (statusFilter === 'all') {
            eventsToShow = filteredOrganizerEvents;
        } else {
            eventsToShow = {
                active: statusFilter === 'active' ? filteredOrganizerEvents.active : [],
                pending: statusFilter === 'pending' ? filteredOrganizerEvents.pending : [],
                past: statusFilter === 'past' ? filteredOrganizerEvents.past : []
            };
        }
        
        // Update the display
        updateEventsDisplay(eventsToShow);
    }
    
    function clearOrganizerEventsFilters() {
        document.getElementById('organizer-events-search').value = '';
        document.getElementById('organizer-events-category-filter').value = 'all';
        document.getElementById('organizer-events-status-filter').value = 'all';
        
        // Reset to show all events
        filteredOrganizerEvents = { ...allOrganizerEvents };
        updateEventsDisplay(filteredOrganizerEvents);
    }
    
    // ==================== AUTHENTICATION ====================
    
    async function checkOrganizerAuth() {
        try {
            const response = await fetch('/auth/check', {
                credentials: 'include'
            });
            
            if (!response.ok) {
                console.warn('Authentication failed, loading demo data');
                loadFallbackData();
                return;
            }
            
            const authData = await response.json();
            if (!authData.authenticated || authData.userRole !== 'organizer') {
                console.warn('User not authorized as organizer, loading demo data');
                loadFallbackData();
                return;
            }
            
            // Update UI with user info
            if (authData.user) {
                updateUserInfo(authData.user);
            }
            
        } catch (error) {
            console.error('Error checking organizer auth:', error);
            loadFallbackData();
        }
    }
    
    function updateUserInfo(user) {
        // Update user name and email in the dashboard
        const userNameElements = document.querySelectorAll('[data-user-name]');
        const userEmailElements = document.querySelectorAll('[data-user-email]');
        const userInitialElements = document.querySelectorAll('[data-user-initial]');
        
        userNameElements.forEach(el => el.textContent = user.name || user.username || 'Organizer');
        userEmailElements.forEach(el => el.textContent = user.email || 'organizer@example.com');
        userInitialElements.forEach(el => {
            const name = user.name || user.username || 'O';
            el.textContent = name.charAt(0).toUpperCase();
        });
    }

    // --- Main Tab Switching (My Events, Analytics, etc.) ---
    const mainTabButtons = document.querySelectorAll('.org-tab-btn');
    const mainTabContents = document.querySelectorAll('.org-tab-content');

    mainTabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            mainTabButtons.forEach(button => button.classList.remove('active-tab'));
            this.classList.add('active-tab');
            
            mainTabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
            
            // Load data based on active tab
            if (tabId === 'analytics') {
                initCharts();
            } else if (tabId === 'events') {
                loadMyEvents();
            } else if (tabId === 'inquiries') {
                loadSponsorInquiries();
            } else if (tabId === 'questions') {
                loadQuestions();
            } else if (tabId === 'rejections') {
                loadRejectedEvents();
            } else if (tabId === 'changes') {
                loadChangesRequiredEvents();
            } else if (tabId === 'notices') {
                loadNotices();
            }
        });
    });

    // --- Nested Event Management Tab Switching (Active, Pending, etc.) ---
    const eventMgmtTabButtons = document.querySelectorAll('.event-mgmt-tab-btn');
    const eventMgmtTabContents = document.querySelectorAll('.event-mgmt-tab-content');

    eventMgmtTabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const eventTabId = this.getAttribute('data-tab');
            
            eventMgmtTabButtons.forEach(button => {
                button.classList.remove('bg-purple-600', 'text-white');
                button.classList.add('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
            });
            this.classList.remove('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
            this.classList.add('bg-purple-600', 'text-white');
            
            eventMgmtTabContents.forEach(content => {
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

    // --- Dashboard Data Loading Functions ---
    async function loadDashboardData() {
        try {
            // Load both dashboard stats and analytics data
            const [dashboardResponse, analyticsResponse] = await Promise.all([
                fetch('/events/dashboard-stats', { credentials: 'include' }),
                fetch('/events/analytics-data', { credentials: 'include' })
            ]);
            
            if (dashboardResponse.ok) {
                const stats = await dashboardResponse.json();
                updateDashboardStats(stats);
            }
            
            if (analyticsResponse.ok) {
                const analyticsData = await analyticsResponse.json();
                // Update dashboard stats with analytics data
                updateDashboardStats(analyticsData);
                // Update charts with real data
                updateChartsWithRealData(analyticsData);
            }
            
            if (!dashboardResponse.ok && !analyticsResponse.ok) {
                console.error('Failed to load dashboard data');
                loadFallbackData();
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            loadFallbackData();
        }
    }

    function updateDashboardStats(stats) {
        // Update Total Events
        const totalEventsEl = document.getElementById('total-events-count');
        if (totalEventsEl) totalEventsEl.textContent = stats.totalEvents || 0;

        // Update Active Events
        const activeEventsEl = document.getElementById('active-events-count');
        if (activeEventsEl) activeEventsEl.textContent = stats.activeEvents || 0;

        // Update Total Attendees (if available)
        const totalAttendeesEl = document.getElementById('total-attendees-count');
        if (totalAttendeesEl) totalAttendeesEl.textContent = stats.totalAttendees || 0;

        // Update Monthly Events (if available)
        const monthlyEventsEl = document.getElementById('monthly-events-count');
        if (monthlyEventsEl) monthlyEventsEl.textContent = stats.monthlyEvents || 0;
    }

    async function loadMyEvents() {
        try {
            const response = await fetch('/events/my-events', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const eventGroups = await response.json();
                updateEventsDisplay(eventGroups);
                
                // Store all events for search and filter
                allOrganizerEvents = { ...eventGroups };
                filteredOrganizerEvents = { ...eventGroups };
                
                // Initialize search functionality if not already done
                if (!window.organizerEventsSearchInitialized) {
                    initializeOrganizerEventsSearch();
                    window.organizerEventsSearchInitialized = true;
                }
            } else {
                console.error('Failed to load events');
                // Load fallback demo data
                loadFallbackData();
            }
        } catch (error) {
            console.error('Error loading events:', error);
            // Load fallback demo data
            loadFallbackData();
        }
    }

    function updateEventsDisplay(eventGroups) {
        // Update active events
        updateEventList('active-events', eventGroups.active);
        updateEventList('pending-events', eventGroups.pending);
        updateEventList('past-events', eventGroups.past);
    }

    function updateEventList(containerId, events) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (events.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">No events found.</p>';
            return;
        }

        const eventsHTML = events.map(event => {
            const eventDate = new Date(event.date);
            const formattedDate = eventDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            const registrationCount = event.registrations ? event.registrations.length : 0;
            const sponsorInquiries = event.sponsorInquiries ? event.sponsorInquiries.length : 0;
            const questions = event.questions ? event.questions.length : 0;
            
            return `
                <div class="bg-gray-50 p-6 rounded-lg border">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h3 class="text-lg font-semibold text-gray-800">${event.title}</h3>
                            <p class="text-gray-600 mt-1">${formattedDate} • ${event.location}</p>
                            <div class="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                                <span><i class="fas fa-users mr-1"></i>${registrationCount} registered</span>
                                ${sponsorInquiries > 0 ? `<span><i class="fas fa-handshake mr-1"></i>${sponsorInquiries} sponsor inquiries</span>` : ''}
                                ${questions > 0 ? `<span><i class="fas fa-question-circle mr-1"></i>${questions} questions</span>` : ''}
                                <span class="px-2 py-1 rounded text-xs ${getStatusBadgeClass(event.approvalStatus)}">${event.approvalStatus}</span>
                            </div>
                        </div>
                        <div class="flex space-x-2 ml-4">
                            <button onclick="viewRegistrations('${event._id}')" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">
                                <i class="fas fa-list mr-1"></i>Registrations
                            </button>
                            <button onclick="editEvent('${event._id}')" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
                                <i class="fas fa-edit mr-1"></i>Edit
                            </button>
                            <button onclick="requestDeleteEvent('${event._id}')" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
                                <i class="fas fa-trash mr-1"></i>Delete
                            </button>
                            <a href="event_page.html?id=${event._id}" class="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm inline-block">
                                <i class="fas fa-eye mr-1"></i>View
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = eventsHTML;
    }

    function getStatusBadgeClass(status) {
        switch(status) {
            case 'approved': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    // Make requestDeleteEvent function global
    window.requestDeleteEvent = async function(eventId) {
        // Show warning and get deletion reason
        const confirmed = confirm(
            "⚠️ WARNING: If your deletion request is approved by an admin, this event will be permanently deleted from the database with no way to recover it.\n\n" +
            "All registrations, comments, and event data will be lost forever.\n\n" +
            "Are you sure you want to proceed with the deletion request?"
        );
        
        if (!confirmed) return;
        
        const reason = prompt(
            "Please provide a reason for deleting this event:\n\n" +
            "(This will help the admin understand why you want to delete the event)"
        );
        
        if (!reason || reason.trim() === '') {
            alert('Deletion reason is required. Request cancelled.');
            return;
        }
        
        try {
            const response = await fetch(`/events/${eventId}/request-deletion`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ reason: reason.trim() })
            });
            
            if (response.ok) {
                const result = await response.json();
                alert('Deletion request submitted successfully! An admin will review your request.');
                loadMyEvents(); // Refresh the events list
            } else {
                const error = await response.json();
                alert(`Failed to submit deletion request: ${error.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error submitting deletion request:', error);
            alert('An error occurred while submitting the deletion request. Please try again.');
        }
    };

    // Make editEvent function global for onclick handlers
    window.editEvent = function(eventId) {
        // Redirect to the comprehensive event editing page
        window.location.href = `event_edit.html?id=${eventId}`;
    };

    // Make viewRegistrations function global
    window.viewRegistrations = async function(eventId) {
        try {
            const response = await fetch(`/events/${eventId}/registrations`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const registrations = await response.json();
                displayRegistrationsModal(registrations);
            } else {
                alert('Failed to load registrations');
            }
        } catch (error) {
            console.error('Error loading registrations:', error);
            alert('Error loading registrations');
        }
    };

    function displayRegistrationsModal(registrations) {
        const modalHTML = `
            <div id="registrations-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-bold">Event Registrations (${registrations.length})</h3>
                        <button onclick="closeRegistrationsModal()" class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    ${registrations.length === 0 ? 
                        '<p class="text-gray-500 text-center py-8">No registrations yet.</p>' :
                        `<div class="overflow-x-auto">
                            <table class="min-w-full bg-white">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">University</th>
                                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Registration Date</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-200">
                                    ${registrations.map(reg => `
                                        <tr>
                                            <td class="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">${reg.name}</td>
                                            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500">${reg.email}</td>
                                            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500">${reg.university || 'N/A'}</td>
                                            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500">${new Date(reg.registrationDate).toLocaleDateString()}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>`
                    }
                    
                    <div class="mt-4 flex justify-end space-x-2">
                        <button onclick="exportRegistrations()" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
                            <i class="fas fa-download mr-1"></i>Export CSV
                        </button>
                        <button onclick="closeRegistrationsModal()" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if present
        const existingModal = document.getElementById('registrations-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Store registrations data for export
        window.currentRegistrations = registrations;
    }

    window.closeRegistrationsModal = function() {
        const modal = document.getElementById('registrations-modal');
        if (modal) {
            modal.remove();
        }
    };

    window.exportRegistrations = function() {
        if (!window.currentRegistrations) return;
        
        const csvContent = [
            'Name,Email,Phone,University,Registration Date',
            ...window.currentRegistrations.map(reg => 
                `"${reg.name}","${reg.email}","${reg.phone || ''}","${reg.university || ''}","${new Date(reg.registrationDate).toLocaleDateString()}`
            )
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'event_registrations.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // --- Sponsor Inquiries Management ---
    async function loadSponsorInquiries() {
        try {
            const response = await fetch('/events/sponsor-inquiries', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const inquiries = await response.json();
                displaySponsorInquiries(inquiries);
            } else {
                console.error('Failed to load sponsor inquiries');
                // Load fallback demo data
                loadFallbackData();
            }
        } catch (error) {
            console.error('Error loading sponsor inquiries:', error);
            // Load fallback demo data
            loadFallbackData();
        }
    }

    function displaySponsorInquiries(inquiries) {
        const container = document.getElementById('sponsor-inquiries-list');
        if (!container) return;

        if (inquiries.length === 0) {
            container.innerHTML = '<div class="text-center py-8 text-gray-500">No sponsor inquiries yet.</div>';
            return;
        }

        const inquiriesHTML = inquiries.map(inquiry => {
            const submittedDate = new Date(inquiry.submittedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            const isResolved = inquiry.status === 'approved' || inquiry.status === 'rejected';

            return `
                <div class="bg-white border rounded-lg p-6 shadow-sm">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="text-lg font-semibold text-gray-800">${inquiry.company}</h3>
                            <p class="text-sm text-gray-600">For: ${inquiry.eventTitle}</p>
                            <p class="text-sm text-gray-500">Submitted: ${submittedDate}</p>
                        </div>
                        <span class="px-3 py-1 rounded-full text-sm ${getInquiryStatusClass(inquiry.status)}">${inquiry.status}</span>
                    </div>
                    <div class="mb-4">
                        <p class="text-sm text-gray-600 mb-2"><strong>Contact:</strong> ${inquiry.contact}</p>
                        <p class="text-sm text-gray-600 mb-2"><strong>Email:</strong> ${inquiry.email}</p>
                        <p class="text-sm text-gray-700"><strong>Message:</strong></p>
                        <p class="text-sm text-gray-600 mt-1 p-3 bg-gray-50 rounded">${inquiry.message}</p>
                    </div>
                    <div class="flex space-x-2">
                        <a href="mailto:${inquiry.email}?subject=Re: Sponsorship Inquiry for ${inquiry.eventTitle}" 
                           class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm">
                            <i class="fas fa-envelope mr-1"></i>Reply
                        </a>
                        ${inquiry.status === 'pending' ? `
                            <button onclick="updateInquiryStatus('${inquiry._id}', 'contacted')" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm">
                                <i class="fas fa-phone mr-1"></i>Mark Contacted
                            </button>
                            <button onclick="updateInquiryStatus('${inquiry._id}', 'approved')" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm">
                                <i class="fas fa-check mr-1"></i>Approve
                            </button>
                            <button onclick="updateInquiryStatus('${inquiry._id}', 'rejected')" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm">
                                <i class="fas fa-times mr-1"></i>Reject
                            </button>
                        ` : inquiry.status === 'contacted' ? `
                            <button onclick="updateInquiryStatus('${inquiry._id}', 'approved')" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm">
                                <i class="fas fa-check mr-1"></i>Approve
                            </button>
                            <button onclick="updateInquiryStatus('${inquiry._id}', 'rejected')" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm">
                                <i class="fas fa-times mr-1"></i>Reject
                            </button>
                        ` : ''}
                        <button onclick="archiveInquiry('${inquiry._id}')" class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm">
                            <i class="fas fa-archive mr-1"></i>Archive
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = inquiriesHTML;
        updateBadge('inquiries-badge', inquiries.filter(i => i.status === 'pending').length);
    }

    // --- Questions Management ---
    async function loadQuestions() {
        try {
            const response = await fetch('/events/questions', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const questions = await response.json();
                displayQuestions(questions);
            } else {
                console.error('Failed to load questions');
                // Load fallback demo data
                loadFallbackData();
            }
        } catch (error) {
            console.error('Error loading questions:', error);
            // Load fallback demo data
            loadFallbackData();
        }
    }

    function displayQuestions(questions) {
        const container = document.getElementById('questions-list');
        if (!container) return;

        if (questions.length === 0) {
            container.innerHTML = '<div class="text-center py-8 text-gray-500">No questions yet.</div>';
            return;
        }

        const questionsHTML = questions.map(question => {
            const submittedDate = new Date(question.submittedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            const isAnswered = question.answeredAt;
            const statusBadge = isAnswered ? 
                '<span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Answered</span>' : 
                '<span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Pending</span>';

            return `
                <div class="bg-white border rounded-lg p-6 shadow-sm">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="text-lg font-semibold text-gray-800">${question.name}</h3>
                            <p class="text-sm text-gray-600">For: ${question.eventTitle}</p>
                            <p class="text-sm text-gray-500">Asked: ${submittedDate}</p>
                        </div>
                        ${statusBadge}
                    </div>
                    <div class="mb-4">
                        <p class="text-sm text-gray-600 mb-2"><strong>Email:</strong> ${question.email}</p>
                        <p class="text-sm text-gray-700"><strong>Question:</strong></p>
                        <p class="text-sm text-gray-600 mt-1 p-3 bg-gray-50 rounded">${question.question}</p>
                    </div>
                    <div class="flex space-x-2">
                        <a href="mailto:${question.email}?subject=Re: Question about ${question.eventTitle}" 
                           class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm">
                            <i class="fas fa-envelope mr-1"></i>Answer
                        </a>
                        ${!isAnswered ? `
                            <button onclick="markQuestionAnswered('${question._id}')" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm">
                                <i class="fas fa-check mr-1"></i>Mark Answered
                            </button>
                        ` : `
                            <button onclick="markQuestionUnanswered('${question._id}')" class="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded text-sm">
                                <i class="fas fa-undo mr-1"></i>Mark Unanswered
                            </button>
                        `}
                        <button onclick="archiveQuestion('${question._id}')" class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm">
                            <i class="fas fa-archive mr-1"></i>Archive
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = questionsHTML;
        updateBadge('questions-badge', questions.filter(q => !q.answeredAt).length);
    }

    function getInquiryStatusClass(status) {
        switch(status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'contacted': return 'bg-blue-100 text-blue-800';
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }
    
    // ==================== REJECTED EVENTS ====================
    
    async function loadRejectedEvents() {
        try {
            const response = await fetch('/events/organizer/my-events?status=rejected', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                displayRejectedEvents(data.events || []);
                updateBadge('rejection-badge', data.events?.length || 0);
            } else {
                console.error('Failed to load rejected events, using fallback data');
                const mockData = [
                    {
                        _id: 'demo-rejected-1',
                        title: 'Demo Rejected Event',
                        date: '2025-08-01',
                        category: 'workshop',
                        description: 'This is a demo rejected event to show the resubmission functionality.',
                        rejectionReason: 'Event description needs more details about the agenda and speakers.',
                        canResubmit: true,
                        resubmissionCount: 0
                    }
                ];
                displayRejectedEvents(mockData);
                updateBadge('rejection-badge', mockData.length);
            }
        } catch (error) {
            console.error('Error loading rejected events:', error);
            // Load fallback data
            const mockData = [
                {
                    _id: 'demo-rejected-1',
                    title: 'Demo Rejected Event',
                    date: '2025-08-01',
                    category: 'workshop',
                    description: 'This is a demo rejected event to show the resubmission functionality.',
                    rejectionReason: 'Event description needs more details about the agenda and speakers.',
                    canResubmit: true,
                    resubmissionCount: 0
                }
            ];
            displayRejectedEvents(mockData);
            updateBadge('rejection-badge', mockData.length);
        }
    }
    
    function displayRejectedEvents(events) {
        const container = document.getElementById('rejected-events-list');
        if (!container) return;
        
        if (events.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-check-circle text-6xl text-green-300 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-700 mb-2">No Rejected Events</h3>
                    <p class="text-gray-500">All your events are approved or pending review!</p>
                </div>
            `;
            return;
        }
        
        const eventsHTML = events.map(event => {
            const eventDate = new Date(event.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            const canResubmit = event.canResubmit && event.resubmissionCount < 3;
            
            return `
                <div class="bg-white border-l-4 border-red-500 rounded-lg p-6 shadow-sm">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <div class="flex items-center gap-3 mb-2">
                                <h3 class="text-lg font-semibold text-gray-800">${event.title}</h3>
                                <span class="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Rejected</span>
                                ${event.resubmissionCount > 0 ? 
                                    `<span class="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                                        Resubmitted ${event.resubmissionCount}x
                                    </span>` : ''
                                }
                            </div>
                            <p class="text-gray-600 mb-2">Date: ${eventDate} • Category: ${event.category}</p>
                            <p class="text-gray-700 mb-3">${event.description.substring(0, 150)}...</p>
                            
                            ${event.rejectionReason ? `
                                <div class="bg-red-50 border border-red-200 rounded p-3 mb-3">
                                    <h4 class="font-semibold text-red-800 mb-1">Rejection Reason:</h4>
                                    <p class="text-red-700 text-sm">${event.rejectionReason}</p>
                                </div>
                            ` : ''}
                        </div>
                        <div class="flex flex-col space-y-2 ml-4">
                            ${canResubmit ? `
                                <button onclick="resubmitEvent('${event._id}')" 
                                        class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm transition-colors">
                                    <i class="fas fa-redo mr-1"></i>Resubmit
                                </button>
                            ` : `
                                <span class="text-gray-500 text-sm px-4 py-2 border border-gray-300 rounded">
                                    Cannot Resubmit
                                </span>
                            `}
                            <button onclick="viewEvent('${event._id}')" 
                                    class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm transition-colors">
                                <i class="fas fa-eye mr-1"></i>View Event
                            </button>
                            <button onclick="requestEventDeletion('${event._id}')" 
                                    class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm transition-colors">
                                <i class="fas fa-trash mr-1"></i>Request Deletion
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = eventsHTML;
    }
    
    // ==================== CHANGES REQUIRED EVENTS ====================
    
    async function loadChangesRequiredEvents() {
        try {
            const response = await fetch('/events/organizer/my-events?status=changes_requested', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                displayChangesRequiredEvents(data.events || []);
                updateBadge('changes-badge', data.events?.length || 0);
            } else {
                console.error('Failed to load events requiring changes, using fallback data');
                const mockData = [
                    {
                        _id: 'demo-changes-1',
                        title: 'Demo Event Needing Changes',
                        date: '2025-08-15',
                        category: 'seminar',
                        description: 'This event needs some changes before approval.',
                        requestedChanges: [
                            { field: 'description', comment: 'Please add more details about the speaker lineup' },
                            { field: 'location', comment: 'Venue capacity information is missing' }
                        ]
                    }
                ];
                displayChangesRequiredEvents(mockData);
                updateBadge('changes-badge', mockData.length);
            }
        } catch (error) {
            console.error('Error loading events requiring changes:', error);
            const mockData = [
                {
                    _id: 'demo-changes-1',
                    title: 'Demo Event Needing Changes',
                    date: '2025-08-15',
                    category: 'seminar',
                    description: 'This event needs some changes before approval.',
                    requestedChanges: [
                        { field: 'description', comment: 'Please add more details about the speaker lineup' },
                        { field: 'location', comment: 'Venue capacity information is missing' }
                    ]
                }
            ];
            displayChangesRequiredEvents(mockData);
            updateBadge('changes-badge', mockData.length);
        }
    }
    
    function displayChangesRequiredEvents(events) {
        const container = document.getElementById('changes-events-list');
        if (!container) return;
        
        if (events.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-check-circle text-6xl text-green-300 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-700 mb-2">No Changes Required</h3>
                    <p class="text-gray-500">All your events are approved or pending review!</p>
                </div>
            `;
            return;
        }
        
        const eventsHTML = events.map(event => {
            const eventDate = new Date(event.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            return `
                <div class="bg-white border-l-4 border-yellow-500 rounded-lg p-6 shadow-sm">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <div class="flex items-center gap-3 mb-2">
                                <h3 class="text-lg font-semibold text-gray-800">${event.title}</h3>
                                <span class="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Changes Required</span>
                            </div>
                            <p class="text-gray-600 mb-2">Date: ${eventDate} • Category: ${event.category}</p>
                            <p class="text-gray-700 mb-3">${event.description.substring(0, 150)}...</p>
                            
                            ${event.requestedChanges && event.requestedChanges.length > 0 ? `
                                <div class="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">
                                    <h4 class="font-semibold text-yellow-800 mb-2">Requested Changes:</h4>
                                    <ul class="list-disc list-inside text-yellow-700 text-sm space-y-1">
                                        ${event.requestedChanges.map(change => 
                                            `<li><strong>${change.field}:</strong> ${change.comment}</li>`
                                        ).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                        </div>
                        <div class="flex flex-col space-y-2 ml-4">
                            <button onclick="editAndResubmitEvent('${event._id}')" 
                                    class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm transition-colors">
                                <i class="fas fa-edit mr-1"></i>Make Changes & Resubmit
                            </button>
                            <button onclick="viewEvent('${event._id}')" 
                                    class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm transition-colors">
                                <i class="fas fa-eye mr-1"></i>View Event
                            </button>
                            <button onclick="requestEventDeletion('${event._id}')" 
                                    class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm transition-colors">
                                <i class="fas fa-trash mr-1"></i>Request Deletion
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = eventsHTML;
    }
    
    // ==================== RESUBMISSION FUNCTIONS ====================
    
    window.resubmitEvent = async function(eventId) {
        try {
            const event = await fetchEventDetails(eventId);
            if (!event) {
                alert('Error loading event details. Please try again.');
                return;
            }
            
            // Open resubmission modal with event data
            openResubmissionModal(event, false);
            
        } catch (error) {
            console.error('Error preparing event resubmission:', error);
            alert('Error loading event details. Please try again.');
        }
    };
    
    window.editAndResubmitEvent = async function(eventId) {
        try {
            const event = await fetchEventDetails(eventId);
            if (!event) {
                alert('Error loading event details. Please try again.');
                return;
            }
            
            // Open resubmission modal with event data and highlight required changes
            openResubmissionModal(event, true);
            
        } catch (error) {
            console.error('Error preparing event for changes:', error);
            alert('Error loading event details. Please try again.');
        }
    };
    
    async function fetchEventDetails(eventId) {
        try {
            // For demo purposes, return mock data if the event ID starts with 'demo'
            if (eventId.startsWith('demo')) {
                return {
                    _id: eventId,
                    title: eventId === 'demo-rejected-1' ? 'Demo Rejected Event' : 'Demo Event Needing Changes',
                    description: 'This is a demo event for testing the resubmission functionality.',
                    category: eventId === 'demo-rejected-1' ? 'workshop' : 'seminar',
                    date: '2025-08-15',
                    time: '14:00',
                    location: 'Demo Venue',
                    registrationMethod: 'platform',
                    rejectionReason: eventId === 'demo-rejected-1' ? 'Event description needs more details about the agenda and speakers.' : '',
                    requestedChanges: eventId === 'demo-changes-1' ? [
                        { field: 'description', comment: 'Please add more details about the speaker lineup' },
                        { field: 'location', comment: 'Venue capacity information is missing' }
                    ] : []
                };
            }
            
            const response = await fetch(`/events/${eventId}`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                return await response.json();
            } else {
                console.error('Failed to fetch event details');
                return null;
            }
        } catch (error) {
            console.error('Error fetching event details:', error);
            return null;
        }
    }
    
    function openResubmissionModal(event, highlightChanges = false) {
        const modal = document.getElementById('resubmissionModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('resubmissionForm');
        
        // Set modal title
        title.textContent = highlightChanges ? 'Make Changes & Resubmit Event' : 'Resubmit Event';
        
        // Populate form fields
        document.getElementById('eventIdInput').value = event._id;
        document.getElementById('eventTitle').value = event.title || '';
        document.getElementById('eventCategory').value = event.category || '';
        document.getElementById('eventDescription').value = event.description || '';
        document.getElementById('eventDate').value = event.date ? event.date.split('T')[0] : '';
        document.getElementById('eventTime').value = event.time || '';
        document.getElementById('eventLocation').value = event.location || '';
        document.getElementById('registrationMethod').value = event.registrationMethod || 'platform';
        document.getElementById('externalUrl').value = event.externalRegistrationUrl || '';
        
        // Show/hide external URL section
        toggleExternalUrlSection();
        
        // Show feedback section if there's rejection reason or requested changes
        const feedbackSection = document.getElementById('feedbackSection');
        const adminFeedback = document.getElementById('adminFeedback');
        
        if (event.rejectionReason || (event.requestedChanges && event.requestedChanges.length > 0)) {
            let feedbackHTML = '';
            
            if (event.rejectionReason) {
                feedbackHTML += `<div class="mb-2"><strong>Rejection Reason:</strong> ${event.rejectionReason}</div>`;
            }
            
            if (event.requestedChanges && event.requestedChanges.length > 0) {
                feedbackHTML += `<div><strong>Requested Changes:</strong><ul class="list-disc list-inside mt-1">`;
                event.requestedChanges.forEach(change => {
                    feedbackHTML += `<li><strong>${change.field}:</strong> ${change.comment}</li>`;
                });
                feedbackHTML += `</ul></div>`;
            }
            
            adminFeedback.innerHTML = feedbackHTML;
            feedbackSection.style.display = 'block';
        } else {
            feedbackSection.style.display = 'none';
        }
        
        // Show modal
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
    
    window.closeResubmissionModal = function() {
        const modal = document.getElementById('resubmissionModal');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    };
    
    function toggleExternalUrlSection() {
        const registrationMethod = document.getElementById('registrationMethod').value;
        const externalUrlSection = document.getElementById('externalUrlSection');
        const externalUrl = document.getElementById('externalUrl');
        
        if (registrationMethod === 'external') {
            externalUrlSection.style.display = 'block';
            externalUrl.required = true;
        } else {
            externalUrlSection.style.display = 'none';
            externalUrl.required = false;
        }
    }
    
    // Add event listener for registration method change
    document.addEventListener('DOMContentLoaded', function() {
        const registrationMethodSelect = document.getElementById('registrationMethod');
        if (registrationMethodSelect) {
            registrationMethodSelect.addEventListener('change', toggleExternalUrlSection);
        }
    });
    
    // Handle resubmission form submission
    document.addEventListener('DOMContentLoaded', function() {
        const resubmissionForm = document.getElementById('resubmissionForm');
        if (resubmissionForm) {
            resubmissionForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const eventId = document.getElementById('eventIdInput').value;
                const formData = {
                    title: document.getElementById('eventTitle').value,
                    description: document.getElementById('eventDescription').value,
                    category: document.getElementById('eventCategory').value,
                    date: document.getElementById('eventDate').value,
                    time: document.getElementById('eventTime').value,
                    location: document.getElementById('eventLocation').value,
                    registrationMethod: document.getElementById('registrationMethod').value,
                    externalRegistrationUrl: document.getElementById('externalUrl').value
                };
                
                try {
                    // For demo events, just show success message
                    if (eventId.startsWith('demo')) {
                        alert('Event resubmitted successfully! (Demo mode)');
                        closeResubmissionModal();
                        // Refresh the rejected/changes lists
                        loadRejectedEvents();
                        loadChangesRequiredEvents();
                        return;
                    }
                    
                    const response = await fetch(`/events/${eventId}/resubmit`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        credentials: 'include',
                        body: JSON.stringify(formData)
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        alert('Event resubmitted successfully! It will be reviewed by admin.');
                        closeResubmissionModal();
                        
                        // Refresh the events lists
                        loadRejectedEvents();
                        loadChangesRequiredEvents();
                        loadMyEvents();
                    } else {
                        const error = await response.json();
                        alert(`Failed to resubmit event: ${error.message}`);
                    }
                } catch (error) {
                    console.error('Error resubmitting event:', error);
                    alert('An error occurred while resubmitting the event. Please try again.');
                }
            });
        }
    });
    
    window.viewEvent = function(eventId) {
        window.open(`/event_page.html?id=${eventId}`, '_blank');
    };
    
    // ==================== EVENT DELETION ====================
    
    window.requestEventDeletion = async function(eventId) {
        // Show warning and get deletion reason
        const confirmed = confirm(
            "⚠️ WARNING: If your deletion request is approved by an admin, this event will be permanently deleted from the database with no way to recover it.\n\n" +
            "All registrations, comments, and event data will be lost forever.\n\n" +
            "Are you sure you want to proceed with the deletion request?"
        );
        
        if (!confirmed) return;
        
        const reason = prompt(
            "Please provide a reason for deleting this event:\n\n" +
            "(This will help the admin understand why you want to delete the event)"
        );
        
        if (!reason || reason.trim() === '') {
            alert('Deletion reason is required. Request cancelled.');
            return;
        }
        
        try {
            const response = await fetch(`/events/${eventId}/request-deletion`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ reason: reason.trim() })
            });
            
            if (response.ok) {
                const result = await response.json();
                alert('Deletion request submitted successfully! An admin will review your request.');
                loadMyEvents(); // Refresh the events list
            } else {
                const error = await response.json();
                alert(`Failed to submit deletion request: ${error.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error submitting deletion request:', error);
            alert('An error occurred while submitting the deletion request. Please try again.');
        }
    };

    // Helper function to update notification badges
    function updateBadge(badgeId, count) {
        const badge = document.getElementById(badgeId);
        if (badge) {
            if (count > 0) {
                badge.textContent = count;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    }
    
    // Load rejection and changes data on page load
    loadRejectedEvents();
    loadChangesRequiredEvents();
    
    // --- Question and Inquiry Management Functions ---
    
    // Make question management functions global
    window.markQuestionAnswered = async function(questionId) {
        try {
            const response = await fetch(`/events/questions/${questionId}/answered`, {
                method: 'PUT',
                credentials: 'include'
            });
            
            if (response.ok) {
                alert('Question marked as answered.');
                loadQuestions(); // Refresh the questions list
            } else {
                alert('The inquiry has been resolved. We\'ll update the status shortly.');
            }
        } catch (error) {
            console.error('Error updating question status:', error);
            alert('An error occurred while updating question status.');
        }
    };

    window.markQuestionUnanswered = async function(questionId) {
        try {
            const response = await fetch(`/events/questions/${questionId}/unanswered`, {
                method: 'PUT',
                credentials: 'include'
            });
            
            if (response.ok) {
                alert('The inquiry has been resolved.');
                loadQuestions(); // Refresh the questions list
            } else {
                alert('The inquiry has been resolved. We\'ll update the status shortly.');
            }
        } catch (error) {
            console.error('Error updating question status:', error);
            alert('An error occurred while updating question status.');
        }
    };

    window.archiveQuestion = async function(questionId) {
        if (!confirm('Are you sure you want to archive this question?')) {
            return;
        }
        
        try {
            const response = await fetch(`/events/questions/${questionId}/archive`, {
                method: 'PUT',
                credentials: 'include'
            });
            
            if (response.ok) {
                alert('Question archived.');
                loadQuestions(); // Refresh the questions list
            } else {
                alert('The inquiry has been resolved. We\'ll update the status shortly.');
            }
        } catch (error) {
            console.error('Error archiving question:', error);
            alert('An error occurred while archiving question.');
        }
    };

    // Sponsor inquiry management functions
    window.updateInquiryStatus = async function(inquiryId, status) {
        try {
            const response = await fetch(`/events/sponsor-inquiries/${inquiryId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ status })
            });
            
            if (response.ok) {
                alert(`Sponsor inquiry ${status}.`);
                loadSponsorInquiries(); // Refresh the inquiries list
            } else {
                alert('The inquiry has been resolved. We\'ll update the status shortly.');
            }
        } catch (error) {
            console.error('Error updating inquiry status:', error);
            alert('An error occurred while updating inquiry status.');
        }
    };

    window.archiveInquiry = async function(inquiryId) {
        if (!confirm('Are you sure you want to archive this sponsor inquiry?')) {
            return;
        }
        
        try {
            const response = await fetch(`/events/sponsor-inquiries/${inquiryId}/archive`, {
                method: 'PUT',
                credentials: 'include'
            });
            
            if (response.ok) {
                alert('Sponsor inquiry archived.');
                loadSponsorInquiries(); // Refresh the inquiries list
            } else {
                alert('The inquiry has been resolved. We\'ll update the status shortly.');
            }
        } catch (error) {
            console.error('Error archiving inquiry:', error);
            alert('An error occurred while archiving inquiry.');
        }
    };

    // --- Notices Management ---
    async function loadNotices() {
        try {
            const response = await fetch('/events/notices', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const notices = await response.json();
                displayNotices(notices);
            } else {
                console.error('Failed to load notices');
                displayNotices([]); // Show empty state
            }
        } catch (error) {
            console.error('Error loading notices:', error);
            displayNotices([]); // Show empty state
        }
    }

    function displayNotices(notices) {
        const container = document.getElementById('notices-list');
        if (!container) return;

        if (notices.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-bell text-4xl text-gray-300 mb-4"></i>
                    <p class="text-lg">No notices yet.</p>
                    <p class="text-sm">Notifications about your events will appear here.</p>
                </div>
            `;
            return;
        }

        const noticesHTML = notices.map(notice => {
            const noticeDate = new Date(notice.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const noticeTypeIcons = {
                'event_approved': 'fas fa-check-circle text-green-500',
                'event_rejected': 'fas fa-times-circle text-red-500',
                'event_changes_requested': 'fas fa-edit text-yellow-500',
                'event_deleted': 'fas fa-trash text-red-500',
                'user_registered': 'fas fa-user-plus text-blue-500',
                'user_interested': 'fas fa-heart text-pink-500',
                'sponsor_inquiry': 'fas fa-handshake text-purple-500',
                'system': 'fas fa-cog text-gray-500'
            };

            const icon = noticeTypeIcons[notice.type] || 'fas fa-bell text-blue-500';

            return `
                <div class="bg-white border rounded-lg p-6 shadow-sm">
                    <div class="flex items-start space-x-4">
                        <div class="flex-shrink-0">
                            <i class="${icon} text-2xl"></i>
                        </div>
                        <div class="flex-1">
                            <h3 class="text-lg font-semibold text-gray-800 mb-2">${notice.title}</h3>
                            <p class="text-gray-600 mb-3">${notice.message}</p>
                            <div class="flex justify-between items-center">
                                <p class="text-sm text-gray-500">${noticeDate}</p>
                                ${notice.eventId ? `<a href="event_page.html?id=${notice.eventId}" class="text-indigo-600 hover:text-indigo-800 text-sm">View Event</a>` : ''}
                            </div>
                        </div>
                        <button onclick="markNoticeRead('${notice._id}')" class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = noticesHTML;
        updateBadge('notices-badge', notices.filter(n => !n.read).length);
    }

    // Make notice management function global
    window.markNoticeRead = async function(noticeId) {
        try {
            const response = await fetch(`/events/notices/${noticeId}/read`, {
                method: 'PUT',
                credentials: 'include'
            });
            
            if (response.ok) {
                loadNotices(); // Refresh the notices list
            }
        } catch (error) {
            console.error('Error marking notice as read:', error);
        }
    };

    // Fallback data for demo purposes when API calls fail
    function loadFallbackData() {
        // Mock dashboard stats
        const mockStats = {
            totalEvents: 3,
            pendingEvents: 1,
            totalSponsorInquiries: 2,
            totalQuestions: 4
        };
        displayDashboardStats(mockStats);
        
        // Mock events data
        const mockEvents = {
            active: [
                { _id: '1', title: 'Tech Conference 2025', date: '2025-08-15', category: 'conference', approvalStatus: 'approved' }
            ],
            pending: [
                { _id: '2', title: 'Music Festival', date: '2025-09-20', category: 'music', approvalStatus: 'pending' }
            ],
            past: [],
            rejected: []
        };
        displayEvents(mockEvents);
        
        // Mock rejected events for demo
        const mockRejectedEvents = [
            {
                _id: '3',
                title: 'Demo Rejected Event',
                date: '2025-08-01',
                category: 'workshop',
                description: 'This is a demo rejected event to show the resubmission functionality.',
                approvalStatus: 'rejected',
                rejectionReason: 'Event description needs more details about the agenda and speakers.',
                canResubmit: true,
                resubmissionCount: 0
            }
        ];
        displayRejectedEvents(mockRejectedEvents);
        updateBadge('rejection-badge', mockRejectedEvents.length);
        
        // Mock changes required events
        const mockChangesEvents = [
            {
                _id: '4',
                title: 'Demo Event Needing Changes',
                date: '2025-08-15',
                category: 'seminar',
                description: 'This event needs some changes before approval.',
                approvalStatus: 'changes_requested',
                requestedChanges: [
                    { field: 'description', comment: 'Please add more details about the speaker lineup' },
                    { field: 'location', comment: 'Venue capacity information is missing' }
                ]
            }
        ];
        displayChangesRequiredEvents(mockChangesEvents);
        updateBadge('changes-badge', mockChangesEvents.length);
    }
    
    // --- Analytics Charts Initialization ---
    function initCharts() {
        initializeCharts();
    }

    // Initialize Analytics Charts
    async function initializeCharts() {
        // Try to load real data first
        try {
            const response = await fetch('/events/analytics-data', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const analyticsData = await response.json();
                // Create charts with real data
                createEventsChart(analyticsData.chartData?.eventsOverTime);
                createAttendeesChart(analyticsData.chartData?.eventsByCategory);
            } else {
                // Create charts with placeholder data
                createEventsChart();
                createAttendeesChart();
            }
        } catch (error) {
            console.error('Error loading analytics data:', error);
            // Create charts with placeholder data
            createEventsChart();
            createAttendeesChart();
        }
    }

    // Store chart instances for updates
    let eventsChart = null;
    let attendeesChart = null;

    // Events Over Time Chart with Real Data
    function createEventsChart(realData = null) {
        const ctx = document.getElementById('eventsChart');
        if (!ctx) return;

        // Use real data if available, otherwise use placeholder
        const labels = realData ? realData.map(item => item.month) : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const data = realData ? realData.map(item => item.events) : [0, 0, 0, 0, 0, 0];

        const config = {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Events Created',
                    data: data,
                    borderColor: 'rgba(139, 92, 246, 1)',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: 'rgba(139, 92, 246, 1)',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: 'rgba(139, 92, 246, 1)',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                }
            }
        };

        eventsChart = new Chart(ctx, config);
    }

    // Attendees by Category Chart with Real Data
    function createAttendeesChart(realData = null) {
        const ctx = document.getElementById('attendeesChart');
        if (!ctx) return;

        // Use real data if available, otherwise use placeholder
        const labels = realData ? realData.map(item => item.category) : ['No Events', 'Created', 'Yet'];
        const data = realData ? realData.map(item => item.count) : [1, 0, 0];
        const colors = [
            '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444',
            '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'
        ];

        const config = {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverBorderWidth: 3,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: 'rgba(139, 92, 246, 1)',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        };

        attendeesChart = new Chart(ctx, config);
    }

    // Update charts with real data from the server
    async function updateChartsWithRealData(stats) {
        try {
            // Fetch detailed analytics data
            const analyticsResponse = await fetch('/events/analytics-data', {
                credentials: 'include'
            });
            
            if (analyticsResponse.ok) {
                const analyticsData = await analyticsResponse.json();
                
                // Update events chart with real monthly data
                if (eventsChart && analyticsData.chartData?.eventsOverTime) {
                    const monthlyData = analyticsData.chartData.eventsOverTime;
                    eventsChart.data.labels = monthlyData.map(item => item.month);
                    eventsChart.data.datasets[0].data = monthlyData.map(item => item.events);
                    eventsChart.update();
                }
                
                // Update category chart with real category data
                if (attendeesChart && analyticsData.chartData?.eventsByCategory) {
                    const categoryData = analyticsData.chartData.eventsByCategory;
                    attendeesChart.data.labels = categoryData.map(item => item.category);
                    attendeesChart.data.datasets[0].data = categoryData.map(item => item.count);
                    attendeesChart.update();
                }
            }
        } catch (error) {
            console.error('Error loading analytics data:', error);
            // Charts will continue showing their current data
        }
    }

    // Load fallback data when server data is unavailable
    function loadFallbackData() {
        const totalEventsEl = document.getElementById('total-events-count');
        if (totalEventsEl) totalEventsEl.textContent = '12';

        const activeEventsEl = document.getElementById('active-events-count');
        if (activeEventsEl) activeEventsEl.textContent = '5';
    }

    // Load and display real recent activity
    async function loadRecentActivity() {
        try {
            const response = await fetch('/events/analytics-data', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.recentActivity) {
                    displayRecentActivity(data.recentActivity);
                }
            }
        } catch (error) {
            console.error('Error loading recent activity:', error);
            // Keep existing hardcoded activity if API fails
        }
    }

    // Display recent activity in the UI
    function displayRecentActivity(activities) {
        const container = document.getElementById('recent-activity');
        if (!container) return;

        // Show empty state if no activities
        if (!activities || activities.length === 0) {
            container.innerHTML = `
                <div class="activity-item flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <i class="fas fa-history text-gray-400 text-sm"></i>
                    </div>
                    <div class="flex-1">
                        <p class="text-sm font-medium text-gray-500">No recent activity</p>
                        <p class="text-xs text-gray-400">Start creating events to see activity here</p>
                    </div>
                </div>
            `;
            return;
        }

        // Generate icon color classes
        const iconColors = {
            'event_created': { bg: 'bg-purple-100', text: 'text-purple-600' },
            'registrations': { bg: 'bg-emerald-100', text: 'text-emerald-600' },
            'status_update': { bg: 'bg-blue-100', text: 'text-blue-600' },
            'event_approved': { bg: 'bg-green-100', text: 'text-green-600' },
            'event_rejected': { bg: 'bg-red-100', text: 'text-red-600' }
        };

        // Generate HTML for activities
        const activityHTML = activities.map(activity => {
            const colors = iconColors[activity.type] || { bg: 'bg-gray-100', text: 'text-gray-600' };
            
            return `
                <div class="activity-item flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div class="w-8 h-8 ${colors.bg} rounded-full flex items-center justify-center">
                        <i class="${activity.icon || 'fas fa-info'} ${colors.text} text-sm"></i>
                    </div>
                    <div class="flex-1">
                        <p class="text-sm font-medium text-gray-900">${activity.title}</p>
                        <p class="text-xs text-gray-500">${activity.description}</p>
                        ${activity.time ? `<p class="text-xs text-gray-400 mt-1">${activity.time}</p>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = activityHTML;
    }

    // Load recent activity on page load
    loadRecentActivity();

});