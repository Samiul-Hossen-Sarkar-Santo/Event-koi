// This script handles the interactive elements on the user profile page.

// Utility function to show loading state
function showLoadingState(elementId, text = 'Loading...') {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `<span class="loading-spinner"></span> ${text}`;
    }
}

// Utility function to hide loading state
function hideLoadingState(elementId, content) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = content;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Check user session first
    checkUserSession();
    
    // Initialize dashboard after session check
    
    async function checkUserSession() {
        try {
            const response = await fetch('/auth/check-session', {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const userData = await response.json();
                // Only proceed if this is a regular user
                if (userData.role !== 'user') {
                    // Redirect to appropriate dashboard
                    const dashboardUrl = userData.role === 'admin' ? 'admin.html' : 'organizer.html';
                    window.location.href = dashboardUrl;
                    return;
                }
                // Continue with user dashboard initialization
                initializeDashboard();
            } else {
                // No valid session, redirect to login
                window.location.href = 'login_signup.html';
            }
        } catch (error) {
            console.error('Session check failed:', error);
            window.location.href = 'login_signup.html';
        }
    }

    function initializeDashboard() {
        // --- Main Tab Switching (Profile, My Events, etc.) ---
        const mainTabButtons = document.querySelectorAll('.tab-btn');
        const mainTabContents = document.querySelectorAll('.tab-content');

        // Load user data on page load
        loadUserDashboard();
        loadUserProfile();
        loadUserRegistrations();
        loadUserFavorites();
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
                    loadUserFavorites();
                } else if (tabId === 'profile') {
                    loadUserProfile();
                } else if (tabId === 'dashboard') {
                    loadUserDashboard();
                } else if (tabId === 'notices') {
                    loadUserNotices();
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
        
        // User Events Search and Filter Variables
        let allUserRegistrations = { upcoming: [], past: [] };
        let filteredUserRegistrations = { upcoming: [], past: [] };
        
        // Initialize User Events Search and Filter
        function initializeUserEventsSearch() {
            const searchInput = document.getElementById('user-events-search');
            const categoryFilter = document.getElementById('user-events-category-filter');
            const dateFilter = document.getElementById('user-events-date-filter');
            const clearButton = document.getElementById('user-events-clear-filter');
            
            if (searchInput) {
                searchInput.addEventListener('input', debounce(filterUserEvents, 300));
            }
            
            if (categoryFilter) {
                categoryFilter.addEventListener('change', filterUserEvents);
            }
            
            if (dateFilter) {
                dateFilter.addEventListener('change', filterUserEvents);
            }
            
            if (clearButton) {
                clearButton.addEventListener('click', clearUserEventsFilters);
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
        
        function filterUserEvents() {
            const searchQuery = document.getElementById('user-events-search')?.value.toLowerCase() || '';
            const categoryFilter = document.getElementById('user-events-category-filter')?.value || 'all';
            const dateFilter = document.getElementById('user-events-date-filter')?.value || 'all';
            
            // Filter upcoming events
            filteredUserRegistrations.upcoming = allUserRegistrations.upcoming.filter(registration => {
                const event = registration.event;
                if (!event) return false;
                
                // Search filter
                const matchesSearch = searchQuery === '' || 
                    event.title.toLowerCase().includes(searchQuery) ||
                    event.category.toLowerCase().includes(searchQuery) ||
                    event.location.toLowerCase().includes(searchQuery) ||
                    (event.description && event.description.toLowerCase().includes(searchQuery));
                
                // Category filter
                const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter;
                
                // Date filter for upcoming events
                let matchesDate = true;
                if (dateFilter === 'this-month') {
                    const eventDate = new Date(event.date);
                    const now = new Date();
                    const currentMonth = now.getMonth();
                    const currentYear = now.getFullYear();
                    matchesDate = eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
                }
                
                return matchesSearch && matchesCategory && matchesDate;
            });
            
            // Filter past events
            filteredUserRegistrations.past = allUserRegistrations.past.filter(registration => {
                const event = registration.event;
                if (!event) return false;
                
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
            
            // Apply date filter to determine which events to show
            let eventsToShow;
            if (dateFilter === 'upcoming') {
                eventsToShow = { upcoming: filteredUserRegistrations.upcoming, past: [] };
            } else if (dateFilter === 'past') {
                eventsToShow = { upcoming: [], past: filteredUserRegistrations.past };
            } else {
                eventsToShow = filteredUserRegistrations;
            }
            
            // Update the display
            updateRegistrationsDisplay(eventsToShow);
        }
        
        function clearUserEventsFilters() {
            document.getElementById('user-events-search').value = '';
            document.getElementById('user-events-category-filter').value = 'all';
            document.getElementById('user-events-date-filter').value = 'all';
            
            // Reset to show all events
            filteredUserRegistrations = { ...allUserRegistrations };
            updateRegistrationsDisplay(filteredUserRegistrations);
        }

        async function loadUserProfile() {
            try {
                const response = await fetch('/users/user-profile', {
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

            // Update both view and form
            updateProfileView(user);
            updateProfileForm(user);
        }

        function updateProfileView(user) {
            // Update read-only view elements
            const viewElements = {
                'view-name': user.name || 'Not provided',
                'view-username': user.username || 'Not provided',
                'view-email': user.email || 'Not provided',
                'view-phone': user.personalInfo?.contactDetails?.phone || 'Not provided',
                'view-university': user.university || user.personalInfo?.universityOrganization || 'Not provided',
                'view-year': user.yearOfStudy || 'Not provided',
                'view-address': user.personalInfo?.contactDetails?.address || 'Not provided',
                'view-bio': user.bio || 'Not provided',
                'view-tshirt': user.personalInfo?.tShirtSize || 'Not provided'
            };

            Object.keys(viewElements).forEach(elementId => {
                const element = document.getElementById(elementId);
                if (element) element.textContent = viewElements[elementId];
            });

            // Update skills and interests display
            updateViewTags('view-skills-tags', user.skills || user.personalInfo?.skills || [], 'No skills added');
            updateViewTags('view-interests-tags', user.interests || [], 'No interests added');

            // Update profile picture in view
            updateViewProfilePicture(user.profilePicture, user.name || user.username);

            // Update notification preferences display
            const notificationViews = {
                'view-notifications-email': user.notifications?.email !== false ? 'Enabled' : 'Disabled',
                'view-notifications-reminders': user.notifications?.eventReminders !== false ? 'Enabled' : 'Disabled',
                'view-notifications-digest': user.notifications?.weeklyDigest === true ? 'Enabled' : 'Disabled'
            };

            Object.keys(notificationViews).forEach(elementId => {
                const element = document.getElementById(elementId);
                if (element) {
                    element.textContent = notificationViews[elementId];
                    element.className = notificationViews[elementId] === 'Enabled' 
                        ? 'text-sm font-medium text-green-600' 
                        : 'text-sm font-medium text-gray-500';
                }
            });
        }

        function updateViewTags(containerId, tags, emptyMessage) {
            const container = document.getElementById(containerId);
            if (!container) return;

            if (tags.length === 0) {
                container.innerHTML = `<span class="text-gray-500">${emptyMessage}</span>`;
            } else {
                container.innerHTML = tags.map(tag => `
                    <span class="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full mr-2 mb-2">
                        ${tag}
                    </span>
                `).join('');
            }
        }

        function updateViewProfilePicture(pictureUrl, name) {
            const viewImg = document.getElementById('view-profile-picture-img');
            const viewInitial = document.getElementById('view-profile-initial');
            const statusText = document.getElementById('profile-picture-status');

            if (pictureUrl) {
                viewImg.src = pictureUrl;
                viewImg.classList.remove('hidden');
                viewInitial.parentElement.classList.add('hidden');
                if (statusText) statusText.textContent = 'Profile picture uploaded';
            } else {
                viewImg.classList.add('hidden');
                viewInitial.parentElement.classList.remove('hidden');
                viewInitial.textContent = (name || 'U').charAt(0).toUpperCase();
                if (statusText) statusText.textContent = 'No profile picture uploaded';
            }
        }

        function updateProfileForm(user) {
            const profileForm = document.getElementById('profile-form');
            if (!profileForm) return;

            // Update basic fields
            const fields = {
                'profile-name': user.name || '',
                'profile-username': user.username || '',
                'profile-email': user.email || '',
                'profile-bio': user.bio || '',
                'profile-university': user.university || user.personalInfo?.universityOrganization || '',
                'profile-year': user.yearOfStudy || '',
                'profile-phone': user.personalInfo?.contactDetails?.phone || '',
                'profile-address': user.personalInfo?.contactDetails?.address || '',
                'profile-tshirt': user.personalInfo?.tShirtSize || ''
            };

            Object.keys(fields).forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) field.value = fields[fieldId];
            });

            // Handle skills and interests as tags
            initializeTagInput('skills', user.skills || user.personalInfo?.skills || []);
            initializeTagInput('interests', user.interests || []);

            // Handle profile picture
            updateProfilePicture(user.profilePicture, user.name || user.username);

            // Handle notification preferences
            const notificationFields = {
                'notifications-email': user.notifications?.email !== false,
                'notifications-reminders': user.notifications?.eventReminders !== false,
                'notifications-digest': user.notifications?.weeklyDigest === true
            };

            Object.keys(notificationFields).forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) field.checked = notificationFields[fieldId];
            });

            // Update bio counter
            updateBioCounter();
        }

        function updateProfilePicture(pictureUrl, name) {
            const profileImg = document.getElementById('profile-picture-img');
            const profileInitial = document.getElementById('profile-initial');
            const removeBtn = document.getElementById('remove-picture-btn');

            if (pictureUrl) {
                profileImg.src = pictureUrl;
                profileImg.classList.remove('hidden');
                profileInitial.parentElement.classList.add('hidden');
                removeBtn.classList.remove('hidden');
            } else {
                profileImg.classList.add('hidden');
                profileInitial.parentElement.classList.remove('hidden');
                profileInitial.textContent = (name || 'U').charAt(0).toUpperCase();
                removeBtn.classList.add('hidden');
            }
        }

        function initializeTagInput(type, initialTags = []) {
            const input = document.getElementById(`profile-${type}-input`);
            const hiddenInput = document.getElementById(`profile-${type}`);
            const tagsContainer = document.getElementById(`${type}-tags`);
            const suggestionsContainer = document.getElementById(`${type}-suggestions`);
            
            let tags = [...initialTags];
            
            // Common suggestions
            const suggestions = {
                skills: ['JavaScript', 'Python', 'React', 'Node.js', 'HTML/CSS', 'Java', 'C++', 'UI/UX Design', 
                        'Project Management', 'Data Analysis', 'Machine Learning', 'Mobile Development', 
                        'Digital Marketing', 'Public Speaking', 'Team Leadership', 'Problem Solving'],
                interests: ['Technology', 'Entrepreneurship', 'Design', 'Artificial Intelligence', 'Sustainability',
                          'Innovation', 'Startups', 'Networking', 'Education', 'Research', 'Social Impact',
                          'Finance', 'Healthcare', 'Gaming', 'Music', 'Art', 'Sports', 'Travel']
            };

            function renderTags() {
                tagsContainer.innerHTML = tags.map(tag => `
                    <span class="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full">
                        ${tag}
                        <button type="button" onclick="removeTag('${type}', '${tag}')" class="ml-2 text-indigo-600 hover:text-indigo-800">
                            <i class="fas fa-times text-xs"></i>
                        </button>
                    </span>
                `).join('');
                hiddenInput.value = tags.join(',');
            }

            function addTag(tag) {
                tag = tag.trim();
                if (tag && !tags.includes(tag) && tags.length < 10) {
                    tags.push(tag);
                    renderTags();
                    input.value = '';
                    hideSuggestions();
                }
            }

            function showSuggestions(query) {
                if (!query) {
                    hideSuggestions();
                    return;
                }

                const filtered = suggestions[type].filter(item => 
                    item.toLowerCase().includes(query.toLowerCase()) && !tags.includes(item)
                ).slice(0, 6);

                if (filtered.length > 0) {
                    suggestionsContainer.innerHTML = filtered.map(item => `
                        <div class="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0" onclick="selectSuggestion('${type}', '${item}')">
                            ${item}
                        </div>
                    `).join('');
                    suggestionsContainer.classList.remove('hidden');
                } else {
                    hideSuggestions();
                }
            }

            function hideSuggestions() {
                suggestionsContainer.classList.add('hidden');
            }

            // Event listeners
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(input.value);
                }
            });

            input.addEventListener('input', (e) => {
                showSuggestions(e.target.value);
            });

            input.addEventListener('blur', () => {
                // Delay hiding to allow click on suggestions
                setTimeout(hideSuggestions, 200);
            });

            // Global functions for tag management
            window.removeTag = function(tagType, tag) {
                if (tagType === type) {
                    tags = tags.filter(t => t !== tag);
                    renderTags();
                }
            };

            window.selectSuggestion = function(tagType, suggestion) {
                if (tagType === type) {
                    addTag(suggestion);
                }
            };

            // Initial render
            renderTags();
        }

        function updateBioCounter() {
            const bioTextarea = document.getElementById('profile-bio');
            const counter = document.getElementById('bio-counter');
            
            if (bioTextarea && counter) {
                bioTextarea.addEventListener('input', () => {
                    const length = bioTextarea.value.length;
                    counter.textContent = `${length}/500`;
                    
                    if (length > 450) {
                        counter.classList.add('text-yellow-600');
                        counter.classList.remove('text-gray-400');
                    } else if (length > 480) {
                        counter.classList.add('text-red-600');
                        counter.classList.remove('text-yellow-600', 'text-gray-400');
                    } else {
                        counter.classList.add('text-gray-400');
                        counter.classList.remove('text-yellow-600', 'text-red-600');
                    }
                });
                
                // Initial count
                bioTextarea.dispatchEvent(new Event('input'));
            }
        }

        // Initialize profile picture upload
        function initializeProfilePictureUpload() {
            const fileInput = document.getElementById('profile-picture-input');
            const removeBtn = document.getElementById('remove-picture-btn');

            if (fileInput) {
                fileInput.addEventListener('change', handleProfilePictureUpload);
            }

            if (removeBtn) {
                removeBtn.addEventListener('click', removeProfilePicture);
            }
        }

        async function handleProfilePictureUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            // Validate file
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }

            if (file.size > 2 * 1024 * 1024) { // 2MB
                alert('Image must be smaller than 2MB');
                return;
            }

            // Show preview
            const reader = new FileReader();
            reader.onload = (e) => {
                updateProfilePicture(e.target.result, '');
            };
            reader.readAsDataURL(file);

            // Upload file
            const formData = new FormData();
            formData.append('profilePicture', file);

            try {
                const response = await fetch('/users/profile-picture', {
                    method: 'POST',
                    body: formData,
                    credentials: 'include'
                });

                if (response.ok) {
                    const result = await response.json();
                    updateProfilePicture(result.profilePictureUrl, '');
                } else {
                    alert('Failed to upload profile picture');
                    // Revert preview
                    loadUserProfile();
                }
            } catch (error) {
                console.error('Error uploading profile picture:', error);
                alert('Error uploading profile picture');
                loadUserProfile();
            }
        }

        async function removeProfilePicture() {
            try {
                const response = await fetch('/users/profile-picture', {
                    method: 'DELETE',
                    credentials: 'include'
                });

                if (response.ok) {
                    updateProfilePicture(null, document.getElementById('profile-name').value);
                } else {
                    alert('Failed to remove profile picture');
                }
            } catch (error) {
                console.error('Error removing profile picture:', error);
                alert('Error removing profile picture');
            }
        }

        async function loadUserRegistrations() {
            try {
                const response = await fetch('/users/my-registrations', {
                    credentials: 'include'
                });
                
                if (response.ok) {
                    const registrations = await response.json();
                    updateRegistrationsDisplay(registrations);
                    
                    // Store all registrations for filtering
                    allUserRegistrations = registrations;
                    filteredUserRegistrations = registrations;
                    
                    // Initialize search functionality if not already done
                    if (!window.userEventsSearchInitialized) {
                        initializeUserEventsSearch();
                        window.userEventsSearchInitialized = true;
                    }
                } else {
                    console.error('Failed to load user registrations');
                }
            } catch (error) {
                console.error('Error loading user registrations:', error);
            }
        }

        function updateRegistrationsDisplay(registrations) {
            // Update different event lists
            updateEventList('registered', registrations.upcoming);
            updateEventList('interested', registrations.upcoming); // For now, treating as same
            updateEventList('attended', registrations.past);
            
            // Update counts
            document.getElementById('interested-tab-count').textContent = registrations.upcoming.length;
            document.getElementById('registered-tab-count').textContent = registrations.upcoming.length;
            document.getElementById('attended-tab-count').textContent = registrations.past.length;
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
                
                // Show loading state
                const saveBtn = document.getElementById('save-profile-btn');
                const originalText = saveBtn.innerHTML;
                saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
                saveBtn.disabled = true;

                const formData = new FormData(profileForm);
                
                // Parse skills and interests from hidden inputs
                const skillsStr = document.getElementById('profile-skills').value;
                const interestsStr = document.getElementById('profile-interests').value;
                
                const profileData = {
                    name: formData.get('name'),
                    username: formData.get('username'),
                    email: formData.get('email'),
                    bio: formData.get('bio'),
                    university: formData.get('university'),
                    yearOfStudy: formData.get('yearOfStudy'),
                    skills: skillsStr ? skillsStr.split(',').map(s => s.trim()).filter(s => s) : [],
                    interests: interestsStr ? interestsStr.split(',').map(s => s.trim()).filter(s => s) : [],
                    personalInfo: {
                        contactDetails: {
                            phone: formData.get('phone'),
                            address: formData.get('address')
                        },
                        tShirtSize: formData.get('tShirtSize')
                    },
                    notifications: {
                        email: document.getElementById('notifications-email').checked,
                        eventReminders: document.getElementById('notifications-reminders').checked,
                        weeklyDigest: document.getElementById('notifications-digest').checked
                    }
                };

                try {
                    const response = await fetch('/users/user-profile', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(profileData),
                        credentials: 'include'
                    });

                    if (response.ok) {
                        const result = await response.json();
                        
                        // Show success message
                        showNotification('Profile updated successfully!', 'success');
                        
                        // Update profile display
                        updateProfileDisplay(result.user);
                        
                        // Switch back to view mode
                        const profileView = document.getElementById('profile-view');
                        const profileEdit = document.getElementById('profile-edit');
                        const editProfileBtn = document.getElementById('edit-profile-btn');
                        const cancelEditBtn = document.getElementById('cancel-edit-btn');
                        
                        if (profileView && profileEdit && editProfileBtn && cancelEditBtn) {
                            profileEdit.classList.add('hidden');
                            profileView.classList.remove('hidden');
                            cancelEditBtn.classList.add('hidden');
                            editProfileBtn.classList.remove('hidden');
                        }
                        
                        // Refresh dashboard data
                        loadUserDashboard();
                    } else {
                        const error = await response.json();
                        showNotification(error.message || 'Failed to update profile', 'error');
                    }
                } catch (error) {
                    console.error('Error updating profile:', error);
                    showNotification('Error updating profile. Please try again.', 'error');
                } finally {
                    // Reset button state
                    saveBtn.innerHTML = originalText;
                    saveBtn.disabled = false;
                }
            });
        }

        // Reset profile form
        const resetBtn = document.getElementById('reset-profile-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', function() {
                if (confirm('Are you sure you want to reset all changes? This will reload your current profile data.')) {
                    loadUserProfile();
                }
            });
        }

        // Profile edit mode toggle
        const editProfileBtn = document.getElementById('edit-profile-btn');
        const cancelEditBtn = document.getElementById('cancel-edit-btn');
        const profileView = document.getElementById('profile-view');
        const profileEdit = document.getElementById('profile-edit');

        if (editProfileBtn && cancelEditBtn && profileView && profileEdit) {
            editProfileBtn.addEventListener('click', function() {
                // Switch to edit mode
                profileView.classList.add('hidden');
                profileEdit.classList.remove('hidden');
                editProfileBtn.classList.add('hidden');
                cancelEditBtn.classList.remove('hidden');
            });

            cancelEditBtn.addEventListener('click', function() {
                // Switch back to view mode
                profileEdit.classList.add('hidden');
                profileView.classList.remove('hidden');
                cancelEditBtn.classList.add('hidden');
                editProfileBtn.classList.remove('hidden');
                
                // Reset form to original values
                loadUserProfile();
            });
        }

        // Initialize enhanced profile features
        initializeProfilePictureUpload();
        updateBioCounter();
        initializeUserEventsSearch();

        function showNotification(message, type = 'info') {
            // Create notification element
            const notification = document.createElement('div');
            notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 transform translate-x-full`;
            
            const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
            notification.classList.add(bgColor, 'text-white');
            
            const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';
            
            notification.innerHTML = `
                <div class="flex items-center">
                    <i class="fas fa-${icon} mr-3"></i>
                    <span>${message}</span>
                    <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            
            document.body.appendChild(notification);
            
            // Animate in
            setTimeout(() => {
                notification.classList.remove('translate-x-full');
            }, 100);
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                notification.classList.add('translate-x-full');
                setTimeout(() => notification.remove(), 300);
            }, 5000);
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
        // The tab switching logic is already handled above

        // --- Dashboard Functions ---
        async function loadUserDashboard() {
            try {
                // Show loading states
                document.getElementById('dashboard-favorites').innerHTML = '<span class="loading-spinner"></span>';
                document.getElementById('dashboard-registered').innerHTML = '<span class="loading-spinner"></span>';
                document.getElementById('dashboard-attended').innerHTML = '<span class="loading-spinner"></span>';
                document.getElementById('dashboard-notifications').innerHTML = '<span class="loading-spinner"></span>';
                
                // Load dashboard statistics
                const [favoritesResponse, registrationsResponse, noticesResponse] = await Promise.all([
                    fetch('/users/favorites', { credentials: 'include' }),
                    fetch('/users/my-registrations', { credentials: 'include' }),
                    fetch('/users/notices', { credentials: 'include' })
                ]);

                const favorites = favoritesResponse.ok ? await favoritesResponse.json() : [];
                const registrations = registrationsResponse.ok ? await registrationsResponse.json() : { upcoming: [], past: [] };
                const noticesData = noticesResponse.ok ? await noticesResponse.json() : { notices: [], unreadCount: 0 };

                // Update dashboard stats
                updateDashboardStats(favorites, registrations, noticesData);
                
                // Load recent activity
                loadRecentActivity();
                
                // Load upcoming events preview
                loadUpcomingEventsPreview(registrations.upcoming);

            } catch (error) {
                console.error('Error loading dashboard:', error);
                // Show error state
                document.getElementById('dashboard-favorites').textContent = '0';
                document.getElementById('dashboard-registered').textContent = '0';
                document.getElementById('dashboard-attended').textContent = '0';
                document.getElementById('dashboard-notifications').textContent = '0';
            }
        }

        function updateDashboardStats(favorites, registrations, noticesData) {
            // Update dashboard cards
            document.getElementById('dashboard-favorites').textContent = favorites.length;
            document.getElementById('dashboard-registered').textContent = registrations.upcoming.length;
            document.getElementById('dashboard-attended').textContent = registrations.past.length;
            document.getElementById('dashboard-notifications').textContent = noticesData.unreadCount;

            // Update event tab counts
            document.getElementById('favorites-count').textContent = favorites.length;
            document.getElementById('registered-count').textContent = registrations.upcoming.length;
            document.getElementById('attended-count').textContent = registrations.past.length;
            
            // Update tab badges
            document.getElementById('favorites-tab-count').textContent = favorites.length;
            document.getElementById('registered-tab-count').textContent = registrations.upcoming.length;
            document.getElementById('attended-tab-count').textContent = registrations.past.length;
        }

        async function loadRecentActivity() {
            try {
                const response = await fetch('/users/recent-activity', {
                    credentials: 'include'
                });
                
                if (response.ok) {
                    const activities = await response.json();
                    displayRecentActivity(activities);
                } else {
                    displayRecentActivity([]);
                }
            } catch (error) {
                console.error('Error loading recent activity:', error);
                displayRecentActivity([]);
            }
        }

        function displayRecentActivity(activities) {
            const container = document.getElementById('recent-activity');
            if (!container) return;

            if (activities.length === 0) {
                container.innerHTML = '<div class="text-gray-500 text-center py-4">No recent activity</div>';
                return;
            }

            const activitiesHTML = activities.map(activity => {
                const timeAgo = formatTimeAgo(new Date(activity.date));
                const icons = {
                    'registered': 'fa-ticket-alt text-green-600',
                    'favorited': 'fa-heart text-red-600',
                    'attended': 'fa-calendar-check text-blue-600',
                    'profile_updated': 'fa-user-edit text-purple-600'
                };

                return `
                    <div class="flex items-center p-3 bg-gray-50 rounded-lg">
                        <i class="fas ${icons[activity.type] || 'fa-info-circle text-gray-600'} mr-3"></i>
                        <div class="flex-1">
                            <span class="text-sm text-gray-800">${activity.description}</span>
                            <div class="text-xs text-gray-500">${timeAgo}</div>
                        </div>
                    </div>
                `;
            }).join('');

            container.innerHTML = activitiesHTML;
        }

        function loadUpcomingEventsPreview(upcomingEvents) {
            const container = document.getElementById('upcoming-events');
            if (!container) return;

            if (upcomingEvents.length === 0) {
                container.innerHTML = '<div class="text-gray-500 text-center py-4">No upcoming events</div>';
                return;
            }

            // Show only first 3 upcoming events
            const preview = upcomingEvents.slice(0, 3);
            const eventsHTML = preview.map(registration => {
                const event = registration.event;
                if (!event) return '';

                const eventDate = new Date(event.date);
                const formattedDate = eventDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                });

                return `
                    <div class="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div class="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                            <i class="fas fa-calendar-alt text-indigo-600"></i>
                        </div>
                        <div class="flex-1">
                            <h4 class="font-medium text-gray-800">${event.title}</h4>
                            <div class="text-sm text-gray-500">${formattedDate} • ${event.location}</div>
                        </div>
                        <a href="event_page.html?id=${event._id}" class="text-indigo-600 hover:text-indigo-800">
                            <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                `;
            }).join('');

            container.innerHTML = eventsHTML;
        }

        // --- Enhanced Favorites Functions ---
        async function loadUserFavorites() {
            try {
                const response = await fetch('/users/favorites', {
                    credentials: 'include'
                });
                
                if (response.ok) {
                    const favorites = await response.json();
                    displayFavoriteEvents(favorites);
                } else {
                    displayFavoriteEvents([]);
                }
            } catch (error) {
                console.error('Error loading favorites:', error);
                displayFavoriteEvents([]);
            }
        }

        function displayFavoriteEvents(favorites) {
            const container = document.getElementById('favorites-list');
            if (!container) return;

            if (favorites.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-12 text-gray-500">
                        <i class="fas fa-heart text-6xl text-gray-300 mb-4"></i>
                        <h3 class="text-xl font-medium mb-2">No Favorite Events</h3>
                        <p class="mb-4">Start adding events to your favorites to see them here.</p>
                        <a href="index.html" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg">
                            <i class="fas fa-search mr-2"></i>Discover Events
                        </a>
                    </div>
                `;
                return;
            }

            const eventsHTML = favorites.map(event => {
                const eventDate = new Date(event.date);
                const formattedDate = eventDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                const formattedTime = event.time || 'Time TBA';

                return `
                    <div class="bg-white p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <div class="flex items-start mb-3">
                                    ${event.coverImage ? `
                                        <img src="/uploads/${event.coverImage}" alt="${event.title}" class="w-16 h-16 object-cover rounded-lg mr-4">
                                    ` : `
                                        <div class="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center mr-4">
                                            <i class="fas fa-calendar text-white text-xl"></i>
                                        </div>
                                    `}
                                    <div class="flex-1">
                                        <h3 class="text-xl font-semibold text-gray-800 mb-1">${event.title}</h3>
                                        <p class="text-gray-600 mb-2">${event.description ? event.description.substring(0, 100) + '...' : ''}</p>
                                        <div class="flex flex-wrap gap-2">
                                            <span class="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                                                <i class="fas fa-tag mr-1"></i>${event.category}
                                            </span>
                                            <span class="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                                <i class="fas fa-calendar mr-1"></i>${formattedDate}
                                            </span>
                                            <span class="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                                <i class="fas fa-clock mr-1"></i>${formattedTime}
                                            </span>
                                            <span class="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                                <i class="fas fa-map-marker-alt mr-1"></i>${event.location}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="flex flex-col space-y-2 ml-4">
                                <a href="event_page.html?id=${event._id}" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm text-center">
                                    <i class="fas fa-eye mr-1"></i>View Details
                                </a>
                                <button onclick="removeFavorite('${event._id}')" class="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                                    <i class="fas fa-heart-broken mr-1"></i>Remove
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            container.innerHTML = eventsHTML;
        }

        // Enhanced event list display function
        function updateEventList(containerId, events) {
            const container = document.getElementById(containerId + '-list');
            if (!container) return;

            if (events.length === 0) {
                const emptyMessages = {
                    'registered': {
                        icon: 'fa-ticket-alt',
                        title: 'No Registered Events',
                        message: 'You haven\'t registered for any events yet.',
                        action: 'Browse Events'
                    },
                    'interested': {
                        icon: 'fa-star',
                        title: 'No Interested Events',
                        message: 'Mark events as interesting to keep track of them.',
                        action: 'Discover Events'
                    },
                    'attended': {
                        icon: 'fa-calendar-check',
                        title: 'No Attended Events',
                        message: 'Your attended events will appear here after completion.',
                        action: 'Browse Events'
                    }
                };

                const config = emptyMessages[containerId] || emptyMessages['registered'];
                
                container.innerHTML = `
                    <div class="text-center py-12 text-gray-500">
                        <i class="fas ${config.icon} text-6xl text-gray-300 mb-4"></i>
                        <h3 class="text-xl font-medium mb-2">${config.title}</h3>
                        <p class="mb-4">${config.message}</p>
                        <a href="index.html" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg">
                            <i class="fas fa-search mr-2"></i>${config.action}
                        </a>
                    </div>
                `;
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

                const isPastEvent = eventDate < new Date();
                const statusColors = {
                    'confirmed': 'bg-green-100 text-green-800',
                    'cancelled': 'bg-red-100 text-red-800',
                    'waitlist': 'bg-yellow-100 text-yellow-800'
                };

                return `
                    <div class="bg-white p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <div class="flex items-start mb-3">
                                    ${event.coverImage ? `
                                        <img src="${event.coverImage}" alt="${event.title}" class="w-16 h-16 object-cover rounded-lg mr-4">
                                    ` : `
                                        <div class="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center mr-4">
                                            <i class="fas fa-calendar text-white text-xl"></i>
                                        </div>
                                    `}
                                    <div class="flex-1">
                                        <h3 class="text-xl font-semibold text-gray-800 mb-1">${event.title}</h3>
                                        <p class="text-gray-600 mb-2">${formattedDate} • ${event.location}</p>
                                        <div class="flex flex-wrap gap-2">
                                            <span class="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                                                <i class="fas fa-tag mr-1"></i>${event.category}
                                            </span>
                                            <span class="inline-flex items-center px-2 py-1 ${statusColors[registration.status] || 'bg-gray-100 text-gray-600'} text-xs rounded-full">
                                                ${registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
                                            </span>
                                            ${isPastEvent ? '<span class="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Past Event</span>' : ''}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="flex flex-col space-y-2 ml-4">
                                <a href="event_page.html?id=${event._id}" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm text-center">
                                    <i class="fas fa-eye mr-1"></i>View
                                </a>
                                <button onclick="toggleFavorite('${event._id}')" class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm">
                                    <i class="fas fa-heart mr-1"></i>Favorite
                                </button>
                                ${isPastEvent && containerId === 'attended' ? `
                                    <button onclick="rateEvent('${event._id}')" class="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-4 py-2 rounded-lg text-sm">
                                        <i class="fas fa-star mr-1"></i>Rate
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            container.innerHTML = eventsHTML;
        }

        // Global function for tab switching
        window.switchToTab = function(tabId) {
            const tabButton = document.querySelector(`[data-tab="${tabId}"]`);
            if (tabButton) {
                tabButton.click();
            }
        };

        // Global function for refreshing event data
        window.refreshEventData = function() {
            loadUserDashboard();
            loadUserRegistrations();
            loadUserFavorites();
        };

        // Enhanced remove favorite function
        window.removeFavorite = async function(eventId) {
            try {
                const response = await fetch(`/users/favorite/${eventId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                
                if (response.ok) {
                    // Refresh favorites and dashboard
                    loadUserFavorites();
                    loadUserDashboard();
                }
            } catch (error) {
                console.error('Error removing favorite:', error);
            }
        };

        // Rate event function
        window.rateEvent = function(eventId) {
            // Event rating feature placeholder
            alert('Event rating feature coming soon!');
        };
    }
});
