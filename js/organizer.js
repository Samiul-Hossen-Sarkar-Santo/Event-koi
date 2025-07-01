// This script handles the interactive elements on the organizer dashboard.

document.addEventListener('DOMContentLoaded', function() {
    
    // Load dashboard data on page load
    loadDashboardData();
    loadMyEvents();
    loadSponsorInquiries();
    loadQuestions();
    
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
            const response = await fetch('/events/dashboard-stats', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const stats = await response.json();
                updateDashboardStats(stats);
            } else {
                console.error('Failed to load dashboard stats');
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    function updateDashboardStats(stats) {
        // Update Total Events
        const totalEventsEl = document.querySelector('.from-blue-500 .text-3xl');
        if (totalEventsEl) totalEventsEl.textContent = stats.totalEvents || 0;

        // Update Total Attendees
        const totalAttendeesEl = document.querySelector('.from-green-500 .text-3xl');
        if (totalAttendeesEl) totalAttendeesEl.textContent = stats.totalAttendees || 0;

        // Update Revenue (placeholder for now)
        const revenueEl = document.querySelector('.from-purple-500 .text-3xl');
        if (revenueEl) revenueEl.textContent = `$${(stats.totalAttendees * 25).toFixed(0)}`; // Estimate $25 per attendee
    }

    async function loadMyEvents() {
        try {
            const response = await fetch('/events/my-events', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const eventGroups = await response.json();
                updateEventsDisplay(eventGroups);
            } else {
                console.error('Failed to load events');
            }
        } catch (error) {
            console.error('Error loading events:', error);
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

    // Make editEvent function global for onclick handlers
    window.editEvent = function(eventId) {
        // For now, redirect to event creation page with edit mode
        window.location.href = `event_creation.html?edit=${eventId}`;
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
            }
        } catch (error) {
            console.error('Error loading sponsor inquiries:', error);
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
                        <button class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm">
                            <i class="fas fa-archive mr-1"></i>Archive
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = inquiriesHTML;
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
            }
        } catch (error) {
            console.error('Error loading questions:', error);
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

            return `
                <div class="bg-white border rounded-lg p-6 shadow-sm">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="text-lg font-semibold text-gray-800">${question.name}</h3>
                            <p class="text-sm text-gray-600">For: ${question.eventTitle}</p>
                            <p class="text-sm text-gray-500">Asked: ${submittedDate}</p>
                        </div>
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
                        <button class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm">
                            <i class="fas fa-archive mr-1"></i>Archive
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = questionsHTML;
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
});
