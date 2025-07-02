// This script handles the interactive elements on the user profile page.

document.addEventListener('DOMContentLoaded', function() {
    
    // --- Main Tab Switching (Profile, My Events, etc.) ---
    const mainTabButtons = document.querySelectorAll('.tab-btn');
    const mainTabContents = document.querySelectorAll('.tab-content');

    // Load user data on page load
    loadUserProfile();
    loadUserRegistrations();

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
});
