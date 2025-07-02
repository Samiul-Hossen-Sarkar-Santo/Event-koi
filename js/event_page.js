document.addEventListener('DOMContentLoaded', function () {

    // Helper function to find elements by text content
    function findElementByText(tagName, textContent) {
        const elements = document.querySelectorAll(tagName);
        for (let element of elements) {
            if (element.textContent.includes(textContent)) {
                return element;
            }
        }
        return null;
    }

    // Helper function to find elements by text content
    function findElementByText(selector, text) {
        const elements = document.querySelectorAll(selector);
        for (let element of elements) {
            if (element.textContent.includes(text)) {
                return element;
            }
        }
        return null;
    }

    // --- Existing FAQ Toggle Functionality ---
    document.querySelectorAll('.faq-toggle').forEach(button => {
        button.addEventListener('click', () => {
            const content = button.nextElementSibling;
            const icon = button.querySelector('i');

            const isHidden = content.classList.contains('hidden');

            document.querySelectorAll('.faq-content').forEach(item => {
                if (item !== content) {
                    item.classList.add('hidden');
                    item.previousElementSibling.querySelector('i').classList.remove('rotate-180');
                }
            });

            if (isHidden) {
                content.classList.remove('hidden');
                icon.classList.add('rotate-180');
            } else {
                content.classList.add('hidden');
                icon.classList.remove('rotate-180');
            }
        });
    });

    // --- Countdown Timer (will be updated with fetched event date) ---
    let countdownInterval; // To store the interval ID

    function updateCountdown(eventDate) {
        const now = new Date().getTime();
        const distance = new Date(eventDate).getTime() - now;

        const countdownEl = document.getElementById('countdown');

        if (distance < 0) {
            if (countdownEl) {
                countdownEl.innerHTML = "<div class='text-2xl font-bold'>EVENT HAS STARTED!</div>";
            }
            clearInterval(countdownInterval); // Stop the countdown
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);


        if (countdownEl) {
            countdownEl.innerHTML = `
                <div class=\"text-center\">
                    <div class=\"text-3xl font-bold\">${String(days).padStart(2, '0')}</div>
                    <div class=\"text-sm\">DAYS</div>
                </div>
                <div class=\"text-center\">
                    <div class=\"text-3xl font-bold\">${String(hours).padStart(2, '0')}</div>
                    <div class=\"text-sm\">HOURS</div>
                </div>
                <div class=\"text-center\">
                    <div class=\"text-3xl font-bold\">${String(minutes).padStart(2, '0')}</div>
                    <div class=\"text-sm\">MINUTES</div>
                </div>
                 ${distance > 0 ? `
                <div class=\"text-center\">
                    <div class=\"text-3xl font-bold\">${String(seconds).padStart(2, '0')}</div>
                    <div class=\"text-sm\">SECONDS</div>
                </div>
                 ` : ''}
            `;
        }
    }


    // --- Fetch and Display Event Details ---
    async function fetchAndDisplayEvent() {
        // Get event ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('id');

        if (!eventId) {
            // Handle case where no event ID is provided
            const mainContent = document.querySelector('body'); // Or a specific content div
            if (mainContent) {
                mainContent.innerHTML = '<div class="container mx-auto px-4 py-16 text-center"><h1 class="text-3xl font-bold text-red-600 mb-4">Event ID Missing</h1><p class="text-gray-700">Please provide a valid event ID in the URL.</p></div>';
            }
            return; // Stop execution
        }

        try {
            const response = await fetch(`/events/${eventId}`); // Use the backend endpoint

            if (response.ok) {
                const event = await response.json();
                populateEventPage(event); // Populate the HTML with event data
                // Start the countdown with the actual event date
                if (event.date && event.time) {
                    // Combine date and time for countdown
                    const eventDate = new Date(event.date);
                    const [hours, minutes] = event.time.split(':');
                    eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                    
                    updateCountdown(eventDate.toISOString());
                    // Update countdown every second for real-time updates
                    clearInterval(countdownInterval); // Clear any existing interval
                    countdownInterval = setInterval(() => updateCountdown(eventDate.toISOString()), 1000);
                }


            } else if (response.status === 404) {
                // Handle event not found
                const mainContent = document.querySelector('body'); // Or a specific content div
                if (mainContent) {
                    mainContent.innerHTML = '<div class="container mx-auto px-4 py-16 text-center"><h1 class="text-3xl font-bold text-red-600 mb-4">Event Not Found</h1><p class="text-gray-700">The event you are looking for does not exist.</p></div>';
                }
            } else {
                // Handle other backend errors
                const errorData = await response.json();
                const mainContent = document.querySelector('body');
                if (mainContent) {
                    mainContent.innerHTML = `<div class="container mx-auto px-4 py-16 text-center"><h1 class="text-3xl font-bold text-red-600 mb-4">Error Loading Event</h1><p class="text-gray-700">${errorData.message || 'An error occurred while fetching event details.'}</p></div>`;
                }
            }
        } catch (error) {
            console.error('Error fetching event:', error);
            const mainContent = document.querySelector('body');
            if (mainContent) {
                mainContent.innerHTML = '<div class="container mx-auto px-4 py-16 text-center"><h1 class="text-3xl font-bold text-red-600 mb-4">Network Error</h1><p class="text-gray-700">Could not connect to the server to load event details. Please try again later.</p></div>';
            }
        }
    }

    /**
     * Populates the HTML elements on the event page with data from the event object.
     * @param {object} event - The event object received from the backend.
     */
    function populateEventPage(event) {
        // Update Title
        document.title = `${event.title} | Event Koi?!`;

        // Update Hero Section
        // Update Cover Image
        const heroSection = document.querySelector('.event-hero');
        
        if (heroSection && event.coverImage) {
            // Handle both old format (full path) and new format (filename only)
            let imageUrl;
            if (event.coverImage.startsWith('/uploads/')) {
                imageUrl = event.coverImage; // Already has the path
            } else {
                imageUrl = `/uploads/${event.coverImage}`; // Add the path
            }
            
            // Test if image is accessible before setting as background
            const testImage = new Image();
            testImage.onload = function() {
                // Use setProperty with important to override CSS
                heroSection.style.setProperty('background-image', `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('${imageUrl}')`, 'important');
                heroSection.style.setProperty('background-size', 'cover', 'important');
                heroSection.style.setProperty('background-position', 'center', 'important');
            };
            testImage.onerror = function() {
                console.error('Failed to load cover image:', imageUrl);
            };
            testImage.src = imageUrl;
        }

        const eventTitleEl = heroSection.querySelector('h1');
        if (eventTitleEl) eventTitleEl.textContent = event.title || 'Event Details';

        const eventDescriptionEl = heroSection.querySelector('p.text-xl'); // Targeting the description below the title
        if (eventDescriptionEl) eventDescriptionEl.textContent = event.description || 'Event description not available.';


        // Update About Section (using prose for description)
        const aboutSection = document.querySelector('.prose.max-w-none.text-gray-700');
        if (aboutSection) {
            aboutSection.innerHTML = event.description || '<p>No description available.</p>'; // Use innerHTML to render rich text
        }

        // Update Event Details Sidebar
        const detailsSidebar = document.querySelector('.bg-gray-50.p-6.rounded-xl');
        if (detailsSidebar) {
            // Date & Time
            const dateTimeEl = detailsSidebar.querySelector('.fa-calendar-alt').closest('.flex').querySelector('div:last-child');
            if (dateTimeEl && event.date && event.time) {
                try {
                    const eventDate = new Date(event.date);
                    const [hours, minutes] = event.time.split(':');
                    eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                    
                    const formattedDate = eventDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    const formattedTime = eventDate.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    
                    dateTimeEl.innerHTML = `<div class="font-semibold">Date & Time</div><div class="text-gray-600">${formattedDate}<br>${formattedTime}</div>`;
                } catch (e) {
                    console.error('Error parsing event date/time:', e);
                    dateTimeEl.innerHTML = `<div class="font-semibold">Date & Time</div><div class="text-gray-600">Date and time not available</div>`;
                }
            } else if (dateTimeEl) {
                dateTimeEl.innerHTML = `<div class="font-semibold">Date & Time</div><div class="text-gray-600">Date and time not available</div>`;
            }


            // Location
            const locationEl = detailsSidebar.querySelector('.fa-map-marker-alt').closest('.flex').querySelector('div:last-child');
            if (locationEl && event.location) {
                locationEl.innerHTML = `<div class="font-semibold">Location</div><div class="text-gray-600">${event.location}</div>`;
                // You might add logic here to include a map link if event.location provides address details
            } else if (locationEl) {
                locationEl.innerHTML = `<div class="font-semibold">Location</div><div class="text-gray-600">Location not specified</div>`;
            }

            // Ticket Price (Assuming event object has a price field or similar)
            const priceEl = detailsSidebar.querySelector('.fa-ticket-alt').closest('.flex').querySelector('div:last-child');
            if (priceEl && event.price) { // Assuming event.price exists
                priceEl.innerHTML = `<div class="font-semibold">Ticket Price</div><div class="text-gray-600">${event.price}</div>`;
            } else if (priceEl) {
                priceEl.innerHTML = `<div class="font-semibold">Ticket Price</div><div class="text-gray-600">Price not specified</div>`;
            }

            // Available Seats (Assuming event object has capacity and current registrations)
            const attendeesEl = detailsSidebar.querySelector('.fa-users').closest('.flex').querySelector('div:last-child');
            // This part needs actual backend data for capacity and registrations
            if (attendeesEl) {
                // Placeholder - replace with actual data
                const currentAttendees = event.registrations ? event.registrations.length : 0; // Assuming registrations is an array of participant IDs
                const totalCapacity = event.capacity || 'N/A'; // Assuming event.capacity field exists

                attendeesEl.innerHTML = `
                     <div class="font-semibold">Attendees</div>
                     <div class="text-gray-600">${currentAttendees}/${totalCapacity} going</div>
                      ${totalCapacity !== 'N/A' ? `
                     <div class="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                         <div class="bg-indigo-600 h-2.5 rounded-full" style="width: ${(currentAttendees / totalCapacity) * 100}%"></div>
                     </div>
                     ` : ''}
                  `;
            }


        }

        // Update Prize Information
        const prizesSection = findElementByText('h3', 'Prizes & Awards'); // Find the prizes section
        let prizesContainer = null;
        if (prizesSection) {
            prizesContainer = prizesSection.nextElementSibling;
        }
        if (!prizesContainer) {
            // Fallback: look for the grid container directly
            prizesContainer = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-3.gap-4');
        }
        
        if (prizesContainer && event.prizeInfo) {
            // Parse prize info and create attractive display
            const prizeLines = event.prizeInfo.split('\n').filter(line => line.trim());
            if (prizeLines.length > 0) {
                let prizeHTML = '';
                prizeLines.forEach((prize, index) => {
                    const position = index + 1;
                    const colors = ['indigo', 'purple', 'blue']; // Different colors for different prizes
                    const color = colors[index % colors.length];
                    prizeHTML += `
                        <div class="bg-${color}-50 p-4 rounded-lg border border-${color}-100">
                            <div class="text-${color}-600 font-bold text-xl mb-2">${position === 1 ? '🥇 ' : position === 2 ? '🥈 ' : position === 3 ? '🥉 ' : '🏆 '}Prize ${position}</div>
                            <div class="text-gray-800">${prize}</div>
                        </div>
                    `;
                });
                prizesContainer.innerHTML = prizeHTML;
            }
        } else if (prizesContainer) {
            prizesContainer.innerHTML = '<div class="col-span-full text-center text-gray-500">Prize information will be announced soon!</div>';
        }


        // Update Rules & Regulations
        const rulesSection = findElementByText('h3', 'Rules & Regulations');
        let rulesContainer = null;
        if (rulesSection) {
            rulesContainer = rulesSection.nextElementSibling.querySelector('ol.list-decimal');
        }
        if (!rulesContainer) {
            // Fallback: look for the ordered list directly
            rulesContainer = document.querySelector('.prose.max-w-none.text-gray-700 ol.list-decimal');
        }
        
        if (rulesContainer && event.rules) {
            const rulesLines = event.rules.split('\n').filter(line => line.trim());
            if (rulesLines.length > 0) {
                const rulesListItems = rulesLines.map(rule => `<li class="mb-2">${rule.trim()}</li>`).join('');
                rulesContainer.innerHTML = rulesListItems;
            }
        } else if (rulesContainer) {
            rulesContainer.innerHTML = '<li class="text-gray-500">Rules and regulations will be published soon.</li>';
        }


        // Note: You'd need similar logic to populate Schedule, Speakers, Gallery, FAQ, and Sponsors sections
        // based on how that data is structured in your Event schema and provided by the backend.
        // The current schema is basic, so these sections will require more complex data structures
        // and corresponding frontend logic to display them dynamically.

        // Update Registration Section (Link or Platform)
        const registerButton = document.querySelector('#register .bg-indigo-600'); // The old Register Now button (now hidden)
        const registrationFormContainer = document.querySelector('#register form'); // The registration form
        const mainRegisterBtn = document.getElementById('main-register-btn'); // The new big register button
        const registrationInfo = document.getElementById('registration-info');

        if (event.registrationMethod === 'external' && event.externalRegistrationUrl) {
            // If external link, set up buttons to redirect to external site
            if (registrationInfo) {
                registrationInfo.textContent = 'Registration handled externally';
            }
            
            // Set up the main register button for external registration
            if (mainRegisterBtn) {
                mainRegisterBtn.addEventListener('click', function (e) {
                    e.preventDefault();
                    showExternalLinkModal(event.externalRegistrationUrl);
                });
            }
            
            // Hide the old registration form completely
            if (registrationFormContainer) {
                registrationFormContainer.classList.add('hidden');
            }

        } else {
            // If platform-based registration, set up modal
            if (registrationInfo) {
                registrationInfo.textContent = 'Secure registration powered by Event Koi';
            }
            
            // Set up the main register button for platform registration
            if (mainRegisterBtn) {
                mainRegisterBtn.addEventListener('click', function (e) {
                    e.preventDefault();
                    showRegistrationModal();
                });
            }
            
            // Keep the form available but hidden
            if (registrationFormContainer) {
                registrationFormContainer.classList.add('hidden');
            }
        }

        // Update Register Now button's anchor
        const heroRegisterButton = document.querySelector('.event-hero a.animate-pulse');
        if (heroRegisterButton) {
            if (event.registrationMethod === 'external' && event.externalRegistrationUrl) {
                heroRegisterButton.addEventListener('click', function (e) {
                    e.preventDefault();
                    showExternalLinkModal(event.externalRegistrationUrl);
                });
                heroRegisterButton.textContent = 'Register Now';
            } else {
                heroRegisterButton.addEventListener('click', function (e) {
                    e.preventDefault();
                    showRegistrationModal();
                });
                heroRegisterButton.textContent = 'Register Now';
            }
        }

        // Initialize social sharing
        initializeSocialSharing(event);

        // Initialize sponsor and question buttons
        initializeButtons();
    }

    // Initialize social media sharing
    function initializeSocialSharing(event) {
        const currentUrl = window.location.href;
        const eventTitle = event.title || 'Check out this event';
        const eventDescription = event.description || 'An amazing event you should attend!';

        // Facebook share
        const facebookBtn = document.getElementById('share-facebook');
        if (facebookBtn) {
            facebookBtn.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
            facebookBtn.target = '_blank';
        }

        // Twitter share
        const twitterBtn = document.getElementById('share-twitter');
        if (twitterBtn) {
            twitterBtn.href = `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(eventTitle + ' - ' + eventDescription)}`;
            twitterBtn.target = '_blank';
        }

        // LinkedIn share
        const linkedinBtn = document.getElementById('share-linkedin');
        if (linkedinBtn) {
            linkedinBtn.href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`;
            linkedinBtn.target = '_blank';
        }

        // Email share
        const emailBtn = document.getElementById('share-email');
        if (emailBtn) {
            const subject = `Check out this event: ${eventTitle}`;
            const body = `Hi,\n\nI thought you might be interested in this event:\n\n${eventTitle}\n\n${eventDescription}\n\nCheck it out here: ${currentUrl}\n\nBest regards!`;
            emailBtn.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        }
    }

    // Initialize buttons and their event listeners
    function initializeButtons() {
        // Become a sponsor button
        const sponsorBtn = document.getElementById('become-sponsor-btn');
        if (sponsorBtn) {
            sponsorBtn.addEventListener('click', showSponsorModal);
        }

        // Ask question button
        const questionBtn = document.getElementById('ask-question-btn');
        if (questionBtn) {
            questionBtn.addEventListener('click', showQuestionModal);
        }

        // Sponsor form submission
        const sponsorForm = document.getElementById('sponsor-form');
        if (sponsorForm) {
            sponsorForm.addEventListener('submit', handleSponsorSubmission);
        }

        // Question form submission
        const questionForm = document.getElementById('question-form');
        if (questionForm) {
            questionForm.addEventListener('submit', handleQuestionSubmission);
        }

        // Registration form submission
        const registrationForm = document.getElementById('event-registration-form');
        if (registrationForm) {
            registrationForm.addEventListener('submit', handleRegistrationSubmission);
        }
    }

    // Sponsor modal functions
    function showSponsorModal() {
        const modal = document.getElementById('sponsor-modal');
        if (modal) modal.classList.remove('hidden');
    }

    function hideSponsorModal() {
        const modal = document.getElementById('sponsor-modal');
        if (modal) modal.classList.add('hidden');
    }

    function handleSponsorSubmission(e) {
        e.preventDefault();
        const eventId = new URLSearchParams(window.location.search).get('id');
        
        // Get form data
        const formData = {
            company: document.getElementById('sponsor-company').value,
            contact: document.getElementById('sponsor-contact').value,
            email: document.getElementById('sponsor-email').value,
            message: document.getElementById('sponsor-message').value
        };

        // Send to backend
        fetch(`/events/${eventId}/sponsor-inquiry`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            alert('Thank you for your interest in sponsoring! We will contact you soon.');
            hideSponsorModal();
            document.getElementById('sponsor-form').reset();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('There was an error submitting your inquiry. Please try again.');
        });
    }

    // Registration modal functions
    function showRegistrationModal() {
        const modal = document.getElementById('registration-modal');
        if (modal) modal.classList.remove('hidden');
    }

    function hideRegistrationModal() {
        const modal = document.getElementById('registration-modal');
        if (modal) modal.classList.add('hidden');
    }

    function handleRegistrationSubmission(e) {
        e.preventDefault();
        const eventId = new URLSearchParams(window.location.search).get('id');
        
        // Get form data
        const formData = new FormData(e.target);
        const registrationData = {
            name: `${formData.get('firstName')} ${formData.get('lastName')}`,
            email: formData.get('email'),
            phone: formData.get('phone'),
            university: formData.get('organization'),
            motivation: formData.get('comments'),
            agreeTerms: formData.get('agreeTerms') === 'on'
        };

        if (!registrationData.agreeTerms) {
            alert('Please agree to the terms and conditions to register.');
            return;
        }

        // Send registration to backend
        fetch(`/events/${eventId}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registrationData),
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Registration successful!') {
                alert('Thank you for registering! You will receive a confirmation email shortly.');
                hideRegistrationModal();
                e.target.reset();
                
                // Refresh the page to update registration count
                setTimeout(() => window.location.reload(), 1000);
            } else {
                alert(data.message || 'Registration failed. Please try again.');
            }
        })
        .catch(error => {
            console.error('Registration error:', error);
            alert('An error occurred during registration. Please try again.');
        });
    }

    // Question modal functions
    function showQuestionModal() {
        const modal = document.getElementById('question-modal');
        if (modal) modal.classList.remove('hidden');
    }

    function hideQuestionModal() {
        const modal = document.getElementById('question-modal');
        if (modal) modal.classList.add('hidden');
    }

    function handleQuestionSubmission(e) {
        e.preventDefault();
        const eventId = new URLSearchParams(window.location.search).get('id');
        
        // Get form data
        const formData = {
            name: document.getElementById('question-name').value,
            email: document.getElementById('question-email').value,
            question: document.getElementById('question-text').value
        };

        // Send to backend
        fetch(`/events/${eventId}/question`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            alert('Thank you for your question! The organizer will respond to you soon.');
            hideQuestionModal();
            document.getElementById('question-form').reset();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('There was an error submitting your question. Please try again.');
        });
    }

    // --- Modal Logic (for external link warning) ---
    // You might need to add this modal HTML to your event_page.html
    // and include the corresponding JavaScript functions here.

    let externalLinkToProceed = '';

    function showExternalLinkModal(url) {
        externalLinkToProceed = url;
        const modal = document.getElementById('external-link-modal'); // Assuming you add this modal HTML
        if (modal) modal.classList.remove('hidden');
    }

    function hideExternalLinkModal() {
        const modal = document.getElementById('external-link-modal');
        if (modal) modal.classList.add('hidden');
    }

    function proceedToExternalLink() {
        if (externalLinkToProceed) {
            window.open(externalLinkToProceed, '_blank');
        }
        hideExternalLinkModal();
    }

    // --- Report Event Functionality ---
    const reportEventBtn = document.getElementById('reportEventBtn');
    const reportEventModal = document.getElementById('reportEventModal');
    const reportEventForm = document.getElementById('reportEventForm');

    if (reportEventBtn) {
        reportEventBtn.addEventListener('click', function() {
            showReportModal();
        });
    }

    if (reportEventForm) {
        reportEventForm.addEventListener('submit', handleReportSubmission);
    }

    function showReportModal() {
        reportEventModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeReportModal() {
        reportEventModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        reportEventForm.reset();
    }

    async function handleReportSubmission(event) {
        event.preventDefault();
        
        const eventId = getEventIdFromUrl();
        const reason = document.getElementById('reportReason').value;
        const details = document.getElementById('reportDetails').value;
        const reporterEmail = document.getElementById('reporterEmail').value;

        if (!reason) {
            alert('Please select a reason for reporting.');
            return;
        }

        const reportData = {
            eventId: eventId,
            reason: reason,
            details: details,
            reporterEmail: reporterEmail
        };

        try {
            const response = await fetch('/events/report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(reportData)
            });

            if (response.ok) {
                alert('Thank you for your report. We will review it and take appropriate action if necessary.');
                closeReportModal();
            } else if (response.status === 401) {
                alert('You must be logged in to submit a report. Please log in and try again.');
                // Optionally redirect to login page
                window.location.href = '/login_signup.html';
            } else {
                const error = await response.json();
                alert(`Failed to submit report: ${error.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error submitting report:', error);
            alert('An error occurred while submitting your report. Please try again later.');
        }
    }

    function getEventIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id') || 'demo-event';
    }

    // --- Smooth Scrolling for Anchor Links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Initial Fetch of Event Data ---
    fetchAndDisplayEvent();

    // NOTE: The original setInterval for the countdown is no longer needed here
    // because updateCountdown is called after fetching the event and then set with setInterval there.

    // Make functions global for onclick handlers
    window.closeReportModal = closeReportModal;

});
