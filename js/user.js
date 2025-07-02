// This script handles the interactive elements on the user profile page.

document.addEventListener('DOMContentLoaded', function() {
    
    // --- Main Tab Switching (Profile, My Events, etc.) ---
    const mainTabButtons = document.querySelectorAll('.tab-btn');
    const mainTabContents = document.querySelectorAll('.tab-content');

    // Load user data on page load
    loadUserProfile();
    loadUserRegistrations();
    loadUserNotices();

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

            // Load data based on active tab
            if (tabId === 'events') {
                loadUserRegistrations();
            } else if (tabId === 'profile') {
                loadUserProfile();
            }
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
                    // Fallback: still redirect even if API call fails
                    localStorage.clear();
                    window.location.href = 'login_signup.html';
                }
            } catch (error) {
                console.error('Logout error:', error);
                // Fallback: still redirect even if API call fails
                localStorage.clear();
                window.location.href = 'login_signup.html';
            }
        });
    }

    // --- User Data Loading Functions ---
    async function loadUserProfile() {
        try {
            const response = await fetch('/users/profile', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const user = await response.json();
                updateProfileDisplay(user);
            } else {
                console.error('Failed to load user profile');
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    }

    function updateProfileDisplay(user) {
        // Update header info
        const welcomeSpan = document.querySelector('header span.font-semibold');
        if (welcomeSpan) {
            welcomeSpan.textContent = `Welcome, ${user.name || user.username}!`;
        }

        // Update sidebar profile
        const profileName = document.querySelector('aside h2');
        const profileEmail = document.querySelector('aside p.text-gray-600');
        if (profileName) profileName.textContent = user.name || user.username;
        if (profileEmail) profileEmail.textContent = user.email;

        // Update profile avatar initial
        const avatarSpan = document.querySelector('.bg-indigo-200 span');
        if (avatarSpan) {
            avatarSpan.textContent = (user.name || user.username).charAt(0).toUpperCase();
        }

        // Update profile form if exists
        updateProfileForm(user);
    }

    function updateProfileForm(user) {
        const profileForm = document.getElementById('profile-form');
        if (!profileForm) return;

        const fields = {
            'profile-name': user.name || '',
            'profile-username': user.username || '',
            'profile-email': user.email || '',
            'profile-bio': user.bio || '',
            'profile-university': user.university || '',
            'profile-year': user.yearOfStudy || '',
            'profile-skills': user.skills ? user.skills.join(', ') : '',
            'profile-interests': user.interests ? user.interests.join(', ') : ''
        };

        Object.keys(fields).forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) field.value = fields[fieldId];
        });
    }

    async function loadUserRegistrations() {
        try {
            const response = await fetch('/users/my-registrations', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const registrations = await response.json();
                updateRegistrationsDisplay(registrations);
            } else {
                console.error('Failed to load user registrations');
            }
        } catch (error) {
            console.error('Error loading user registrations:', error);
        }
    }

    function updateRegistrationsDisplay(registrations) {
        // Update upcoming events
        updateEventList('interested', registrations.upcoming);
        updateEventList('registered', registrations.upcoming);
        updateEventList('attended', registrations.past);
    }

    function updateEventList(containerId, events) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (events.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">No events found.</p>';
            return;
        }

        const eventsHTML = events.map(registration => {
            const event = registration.event;
            if (!event) return '';

            const eventDate = new Date(event.date);
            const formattedDate = eventDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            return `
                <div class="bg-white p-4 rounded-lg border shadow-sm">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h3 class="text-lg font-semibold text-gray-800">${event.title}</h3>
                            <p class="text-gray-600 mt-1">${formattedDate} • ${event.location}</p>
                            <span class="inline-block px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded mt-2">${event.category}</span>
                        </div>
                        <div class="flex space-x-2 ml-4">
                            <a href="event_page.html?id=${event._id}" class="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded text-sm">
                                <i class="fas fa-eye mr-1"></i>View
                            </a>
                            <button onclick="toggleFavorite('${event._id}')" class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded text-sm">
                                <i class="fas fa-heart"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = eventsHTML;
    }

    // Make toggleFavorite function global
    window.toggleFavorite = async function(eventId) {
        try {
            const response = await fetch(`/users/favorite/${eventId}`, {
                method: 'POST',
                credentials: 'include'
            });
            
            if (response.ok) {
                const result = await response.json();
                // Update UI to reflect favorite status
                console.log(result.message);
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    };

    // Profile form submission
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(profileForm);
            const profileData = {
                name: formData.get('name'),
                username: formData.get('username'),
                email: formData.get('email'),
                bio: formData.get('bio'),
                university: formData.get('university'),
                yearOfStudy: formData.get('yearOfStudy'),
                skills: formData.get('skills'),
                interests: formData.get('interests')
            };

            try {
                const response = await fetch('/users/profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(profileData),
                    credentials: 'include'
                });

                if (response.ok) {
                    const result = await response.json();
                    alert('Profile updated successfully!');
                    updateProfileDisplay(result.user);
                } else {
                    const error = await response.json();
                    alert(error.message || 'Failed to update profile');
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                alert('Error updating profile');
            }
        });
    }

    // ==================== NOTICES & NOTIFICATIONS ====================
    
    async function loadUserNotices() {
        try {
            const response = await fetch('/users/notices', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                displayUserNotices(data.notices || []);
                updateNoticesBadge(data.unreadCount || 0);
            } else {
                console.error('Failed to load user notices');
                displayUserNotices([]);
            }
        } catch (error) {
            console.error('Error loading user notices:', error);
            displayUserNotices([]);
        }
    }

    function displayUserNotices(notices) {
        const container = document.getElementById('notices-container');
        if (!container) return;

        if (notices.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <i class="fas fa-bell-slash text-6xl text-gray-300 mb-4"></i>
                    <h3 class="text-xl font-medium mb-2">No Notifications</h3>
                    <p>You're all caught up! New notifications will appear here.</p>
                </div>
            `;
            return;
        }

        const noticesHTML = notices.map(notice => {
            const isRead = notice.isRead;
            const typeColors = {
                'event_status': { border: 'border-blue-500', bg: 'bg-blue-50', icon: 'calendar-alt', iconColor: 'text-blue-600' },
                'admin_action': { border: 'border-red-500', bg: 'bg-red-50', icon: 'user-shield', iconColor: 'text-red-600' },
                'system': { border: 'border-green-500', bg: 'bg-green-50', icon: 'cog', iconColor: 'text-green-600' },
                'warning': { border: 'border-yellow-500', bg: 'bg-yellow-50', icon: 'exclamation-triangle', iconColor: 'text-yellow-600' },
                'general': { border: 'border-gray-500', bg: 'bg-gray-50', icon: 'info-circle', iconColor: 'text-gray-600' }
            };

            const typeStyle = typeColors[notice.type] || typeColors['general'];
            const timeAgo = formatTimeAgo(new Date(notice.createdAt));

            return `
                <div class="border-l-4 ${typeStyle.border} ${typeStyle.bg} p-4 rounded-r-lg ${isRead ? 'opacity-75' : ''} relative">
                    <div class="flex justify-between items-start">
                        <div class="flex items-start">
                            <i class="fas fa-${typeStyle.icon} ${typeStyle.iconColor} mt-1 mr-3"></i>
                            <div class="flex-1">
                                <div class="flex items-center gap-2">
                                    <h3 class="font-bold text-lg text-gray-800">${notice.title}</h3>
                                    ${!isRead ? '<span class="w-2 h-2 bg-red-500 rounded-full"></span>' : ''}
                                </div>
                                <p class="mt-2 text-gray-700">${notice.message}</p>
                                ${notice.actionUrl ? `
                                    <a href="${notice.actionUrl}" class="inline-block mt-2 text-indigo-600 hover:text-indigo-800 font-medium">
                                        <i class="fas fa-external-link-alt mr-1"></i>View Details
                                    </a>
                                ` : ''}
                            </div>
                        </div>
                        <div class="flex flex-col items-end">
                            <span class="text-gray-500 text-sm">${timeAgo}</span>
                            ${!isRead ? `
                                <button onclick="markNoticeRead('${notice._id}')" class="mt-2 text-sm text-indigo-600 hover:text-indigo-800">
                                    Mark as read
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = noticesHTML;
    }

    function updateNoticesBadge(count) {
        const badge = document.getElementById('notices-badge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'block' : 'none';
        }
    }

    function formatTimeAgo(date) {
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
        const diffMinutes = Math.ceil(diffTime / (1000 * 60));

        if (diffMinutes < 60) {
            return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
        } else if (diffHours < 24) {
            return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        } else if (diffDays < 7) {
            return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    // Global functions for notice management
    window.filterNotices = function(type) {
        // Update filter button styles
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.classList.remove('bg-indigo-500', 'text-white', 'active');
            btn.classList.add('bg-gray-200', 'text-gray-700');
        });
        
        const activeBtn = document.querySelector(`[data-filter="${type}"]`);
        if (activeBtn) {
            activeBtn.classList.remove('bg-gray-200', 'text-gray-700');
            activeBtn.classList.add('bg-indigo-500', 'text-white', 'active');
        }

        // Filter notices
        const notices = document.querySelectorAll('#notices-container > div');
        notices.forEach(notice => {
            if (type === 'all') {
                notice.style.display = 'block';
            } else {
                // This is a simplified filter - in a real implementation, 
                // you'd store the notice type in a data attribute
                notice.style.display = 'block';
            }
        });
    };

    window.markNoticeRead = async function(noticeId) {
        try {
            const response = await fetch(`/users/notices/${noticeId}/read`, {
                method: 'PUT',
                credentials: 'include'
            });

            if (response.ok) {
                loadUserNotices(); // Reload to update display
            } else {
                console.error('Failed to mark notice as read');
            }
        } catch (error) {
            console.error('Error marking notice as read:', error);
        }
    };

    window.markAllNoticesRead = async function() {
        try {
            const response = await fetch('/users/notices/read-all', {
                method: 'PUT',
                credentials: 'include'
            });

            if (response.ok) {
                loadUserNotices(); // Reload to update display
            } else {
                console.error('Failed to mark all notices as read');
            }
        } catch (error) {
            console.error('Error marking all notices as read:', error);
        }
    };

    // Load notices when the notices tab is clicked
    const originalTabSwitching = mainTabButtons.forEach;
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

            // Load data based on active tab
            if (tabId === 'events') {
                loadUserRegistrations();
            } else if (tabId === 'profile') {
                loadUserProfile();
            } else if (tabId === 'notices') {
                loadUserNotices();
            }
        });
    });
});
