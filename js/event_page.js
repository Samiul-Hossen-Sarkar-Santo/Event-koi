document.addEventListener('DOMContentLoaded', function () {

    // Check user session and update navigation
    checkUserSession();

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
                <div class="text-center">
                    <div class="text-3xl font-bold">${String(days).padStart(2, '0')}</div>
                    <div class="text-sm">DAYS</div>
                </div>
                <div class="text-center">
                    <div class="text-3xl font-bold">${String(hours).padStart(2, '0')}</div>
                    <div class="text-sm">HOURS</div>
                </div>
                <div class="text-center">
                    <div class="text-3xl font-bold">${String(minutes).padStart(2, '0')}</div>
                    <div class="text-sm">MINUTES</div>
                </div>
                 ${distance > 0 ? `
                <div class="text-center">
                    <div class="text-3xl font-bold">${String(seconds).padStart(2, '0')}</div>
                    <div class="text-sm">SECONDS</div>
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
            } else if (locationEl) {
                locationEl.innerHTML = `<div class="font-semibold">Location</div><div class="text-gray-600">Location not specified</div>`;
            }

            // Ticket Price
            const priceEl = detailsSidebar.querySelector('.fa-ticket-alt').closest('.flex').querySelector('div:last-child');
            if (priceEl && event.price) {
                priceEl.innerHTML = `<div class="font-semibold">Ticket Price</div><div class="text-gray-600">${event.price}</div>`;
            } else if (priceEl) {
                priceEl.innerHTML = `<div class="font-semibold">Ticket Price</div><div class="text-gray-600">Price not specified</div>`;
            }

            // Available Seats
            const attendeesEl = detailsSidebar.querySelector('.fa-users').closest('.flex').querySelector('div:last-child');
            if (attendeesEl) {
                const currentAttendees = event.registrations ? event.registrations.length : 0;
                const totalCapacity = event.capacity || 'N/A';

                attendeesEl.innerHTML = `
                     <div class="font-semibold">Attendees</div>
                     <div class="text-gray-600">${currentAttendees}/${totalCapacity} going</div>
                      ${totalCapacity !== 'N/A' ? `
                     <div class="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                         <div class="bg-gray-600 h-2.5 rounded-full" style="width: ${(currentAttendees / totalCapacity) * 100}%"></div>
                     </div>
                     ` : ''}
                  `;
            }
        }

        // Update Prize Information
        const prizesSection = findElementByText('h3', 'Prizes & Awards');
        let prizesContainer = null;
        if (prizesSection) {
            prizesContainer = prizesSection.nextElementSibling;
        }
        if (!prizesContainer) {
            prizesContainer = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-3.gap-4');
        }
        
        if (prizesContainer && event.prizeInfo) {
            const prizeLines = event.prizeInfo.split('\n').filter(line => line.trim());
            if (prizeLines.length > 0) {
                let prizeHTML = '';
                prizeLines.forEach((prize, index) => {
                    const position = index + 1;
                    const colors = ['gray', 'steel', 'slate'];
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

        // Update Registration Section
        const registerButton = document.querySelector('#register .bg-gray-700');
        const registrationFormContainer = document.querySelector('#register form');
        const mainRegisterBtn = document.getElementById('main-register-btn');
        const registrationInfo = document.getElementById('registration-info');

        if (event.registrationMethod === 'external' && event.externalRegistrationUrl) {
            if (registrationInfo) {
                registrationInfo.textContent = 'Registration handled externally';
            }
            
            if (mainRegisterBtn) {
                mainRegisterBtn.addEventListener('click', function (e) {
                    e.preventDefault();
                    showExternalLinkModal(event.externalRegistrationUrl);
                });
            }
            
            if (registrationFormContainer) {
                registrationFormContainer.classList.add('hidden');
            }

        } else {
            if (registrationInfo) {
                registrationInfo.textContent = 'Secure registration powered by Event Koi';
            }
            
            if (mainRegisterBtn) {
                mainRegisterBtn.addEventListener('click', function (e) {
                    e.preventDefault();
                    showRegistrationModal();
                });
            }
            
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

        // Populate dynamic sections with database data
        populateSpeakersSection(event.speakers);
        populateGallerySection(event.gallery);
        populateFAQSection(event.faqs);
        populateSponsorsSection(event.sponsors);
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

    // Registration variables
    let currentRegistrationStep = 1;
    let maxRegistrationSteps = 3;
    let currentUser = null;

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

        // Favorite button setup
        setupFavoriteButton();
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

    // Check if user is logged in and prefill form
    async function checkUserAndPrefillForm() {
        try {
            const response = await fetch('/auth/check-session', {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                currentUser = await response.json();
                prefillRegistrationForm(currentUser);
            }
        } catch (error) {
            console.log('User not logged in, form will not be prefilled');
        }
    }

    function prefillRegistrationForm(user) {
        // Split name if available
        if (user.name) {
            const nameParts = user.name.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            
            document.getElementById('reg-firstName').value = firstName;
            document.getElementById('reg-lastName').value = lastName;
        }

        // Fill other fields
        if (user.email) document.getElementById('reg-email').value = user.email;
        if (user.personalInfo?.contactDetails?.phone) document.getElementById('reg-phone').value = user.personalInfo.contactDetails.phone;
        if (user.university) document.getElementById('reg-university').value = user.university;
        if (user.yearOfStudy) document.getElementById('reg-yearOfStudy').value = user.yearOfStudy;
    }

    // Registration modal functions
    function showRegistrationModal() {
        // Reset form to first step
        currentRegistrationStep = 1;
        updateRegistrationStep();
        
        // Check user session and prefill form
        checkUserAndPrefillForm();
        
        const modal = document.getElementById('registration-modal');
        if (modal) modal.classList.remove('hidden');
    }

    function hideRegistrationModal() {
        const modal = document.getElementById('registration-modal');
        if (modal) modal.classList.add('hidden');
        
        // Reset form state
        currentRegistrationStep = 1;
        updateRegistrationStep();
        
        // Clear form validation errors
        document.querySelectorAll('.error-message').forEach(msg => msg.remove());
        document.querySelectorAll('.form-error').forEach(field => field.classList.remove('form-error'));
    }

    function updateRegistrationStep() {
        // Update step indicators
        document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
            const stepNum = index + 1;
            indicator.classList.remove('active', 'completed');
            
            if (stepNum < currentRegistrationStep) {
                indicator.classList.add('completed');
            } else if (stepNum === currentRegistrationStep) {
                indicator.classList.add('active');
            }
        });

        // Update step lines
        document.querySelectorAll('.step-line').forEach((line, index) => {
            line.classList.toggle('completed', index + 1 < currentRegistrationStep);
        });

        // Show/hide appropriate step content
        document.querySelectorAll('.registration-step').forEach((step, index) => {
            step.classList.toggle('active', index + 1 === currentRegistrationStep);
        });

        // Update navigation buttons
        const prevBtn = document.getElementById('prev-step-btn');
        const nextBtn = document.getElementById('next-step-btn');
        const submitBtn = document.getElementById('submit-registration-btn');

        prevBtn.classList.toggle('hidden', currentRegistrationStep === 1);
        nextBtn.classList.toggle('hidden', currentRegistrationStep === maxRegistrationSteps);
        submitBtn.classList.toggle('hidden', currentRegistrationStep !== maxRegistrationSteps);

        // Update summary on last step
        if (currentRegistrationStep === maxRegistrationSteps) {
            updateRegistrationSummary();
        }
    }

    function nextRegistrationStep() {
        if (validateCurrentStep() && currentRegistrationStep < maxRegistrationSteps) {
            currentRegistrationStep++;
            updateRegistrationStep();
        }
    }

    function prevRegistrationStep() {
        if (currentRegistrationStep > 1) {
            currentRegistrationStep--;
            updateRegistrationStep();
        }
    }

    function validateCurrentStep() {
        const currentStepElement = document.querySelector(`.registration-step[data-step="${currentRegistrationStep}"]`);
        const requiredFields = currentStepElement.querySelectorAll('input[required], select[required]');
        let isValid = true;

        // Clear previous error messages
        document.querySelectorAll('.error-message').forEach(msg => msg.remove());
        document.querySelectorAll('.form-error').forEach(field => field.classList.remove('form-error'));

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                field.classList.add('form-error');
                
                const errorMsg = document.createElement('div');
                errorMsg.className = 'error-message';
                errorMsg.textContent = 'This field is required';
                field.parentNode.appendChild(errorMsg);
            } else {
                field.classList.remove('form-error');
            }
        });

        // Email validation
        const emailField = document.getElementById('reg-email');
        if (emailField && emailField.value && !isValidEmail(emailField.value)) {
            isValid = false;
            emailField.classList.add('form-error');
            
            const errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.textContent = 'Please enter a valid email address';
            emailField.parentNode.appendChild(errorMsg);
        }

        return isValid;
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function updateRegistrationSummary() {
        const summary = document.getElementById('registration-summary');
        const formData = new FormData(document.getElementById('event-registration-form'));
        
        let summaryHTML = '';
        const firstName = formData.get('firstName');
        const lastName = formData.get('lastName');
        const email = formData.get('email');
        const phone = formData.get('phone');
        const university = formData.get('university');
        const yearOfStudy = formData.get('yearOfStudy');
        const referralSource = formData.get('referralSource');

        if (firstName || lastName) {
            summaryHTML += `<div class="summary-item"><span><strong>Name:</strong></span><span>${firstName} ${lastName}</span></div>`;
        }
        if (email) {
            summaryHTML += `<div class="summary-item"><span><strong>Email:</strong></span><span>${email}</span></div>`;
        }
        if (phone) {
            summaryHTML += `<div class="summary-item"><span><strong>Phone:</strong></span><span>${phone}</span></div>`;
        }
        if (university) {
            summaryHTML += `<div class="summary-item"><span><strong>University:</strong></span><span>${university}</span></div>`;
        }
        if (yearOfStudy) {
            summaryHTML += `<div class="summary-item"><span><strong>Year of Study:</strong></span><span>${yearOfStudy}</span></div>`;
        }
        if (referralSource) {
            const referralText = document.querySelector(`option[value="${referralSource}"]`)?.textContent || referralSource;
            summaryHTML += `<div class="summary-item"><span><strong>Referral Source:</strong></span><span>${referralText}</span></div>`;
        }

        summary.innerHTML = summaryHTML || '<p class="text-gray-500">No information provided</p>';
    }

    function handleRegistrationSubmission(e) {
        e.preventDefault();
        
        // Final validation
        if (!validateCurrentStep()) {
            return;
        }
        
        const eventId = new URLSearchParams(window.location.search).get('id');
        
        // Get form data
        const formData = new FormData(e.target);
        const registrationData = {
            name: `${formData.get('firstName')} ${formData.get('lastName')}`,
            email: formData.get('email'),
            phone: formData.get('phone'),
            university: formData.get('university'),
            yearOfStudy: formData.get('yearOfStudy'),
            expectations: formData.get('expectations'),
            specialRequirements: formData.get('specialRequirements'),
            tshirtSize: formData.get('tshirtSize'),
            referralSource: formData.get('referralSource'),
            marketingConsent: formData.get('marketingConsent') === 'on',
            agreeTerms: formData.get('agreeTerms') === 'on'
        };

        if (!registrationData.agreeTerms) {
            alert('Please agree to the terms and conditions to register.');
            return;
        }

        // Show loading state
        const submitBtn = document.getElementById('submit-registration-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...';
        submitBtn.disabled = true;

        // Send registration to backend
        fetch(`/events/${eventId}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registrationData),
            credentials: 'include'
        })
        .then(response => {
            if (response.status === 401) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                alert('You must be logged in to register for events. Please log in and try again.');
                window.location.href = '/login_signup.html';
                return;
            }
            return response.json();
        })
        .then(data => {
            if (!data) return; // Handle 401 case
            
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            
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
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            alert('An error occurred during registration. Please try again.');
        });
    }

    // External link modal variables
    let externalLinkToProceed = '';

    function showExternalLinkModal(url) {
        externalLinkToProceed = url;
        const modal = document.getElementById('external-link-modal');
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

    // Favorite button functionality
    function setupFavoriteButton() {
        const favoriteBtn = document.getElementById('favorite-btn');
        const favoriteIcon = document.getElementById('favorite-icon');
        const favoriteText = document.getElementById('favorite-text');
        
        if (!favoriteBtn) return;
        
        // Check if event is already favorited
        checkFavoriteStatus();
        
        favoriteBtn.addEventListener('click', toggleFavorite);
        
        async function checkFavoriteStatus() {
            const eventId = new URLSearchParams(window.location.search).get('id');
            
            try {
                const response = await fetch('/users/favorites', {
                    credentials: 'include'
                });
                
                if (response.ok) {
                    const favorites = await response.json();
                    const isFavorited = favorites.some(fav => fav._id === eventId);
                    updateFavoriteButton(isFavorited);
                } else if (response.status === 401) {
                    // User not logged in - keep default state
                    updateFavoriteButton(false);
                }
            } catch (error) {
                console.error('Error checking favorite status:', error);
            }
        }
        
        async function toggleFavorite() {
            const eventId = new URLSearchParams(window.location.search).get('id');
            const isCurrentlyFavorited = favoriteIcon.classList.contains('fas');
            
            // Show loading state
            favoriteBtn.disabled = true;
            const originalText = favoriteText.textContent;
            favoriteText.textContent = 'Processing...';
            
            try {
                const method = isCurrentlyFavorited ? 'DELETE' : 'POST';
                const response = await fetch(`/users/favorite/${eventId}`, {
                    method: method,
                    credentials: 'include'
                });
                
                if (response.ok) {
                    updateFavoriteButton(!isCurrentlyFavorited);
                    const message = isCurrentlyFavorited ? 'Removed from favorites' : 'Added to favorites';
                    showNotification(message, 'success');
                } else if (response.status === 401) {
                    alert('You must be logged in to add events to favorites. Please log in and try again.');
                    window.location.href = '/login_signup.html';
                } else {
                    const error = await response.json();
                    showNotification(error.message || 'Failed to update favorites', 'error');
                }
            } catch (error) {
                console.error('Error toggling favorite:', error);
                showNotification('An error occurred. Please try again.', 'error');
            } finally {
                favoriteBtn.disabled = false;
                if (favoriteText.textContent === 'Processing...') {
                    favoriteText.textContent = originalText;
                }
            }
        }
        
        function updateFavoriteButton(isFavorited) {
            if (isFavorited) {
                favoriteIcon.classList.remove('far');
                favoriteIcon.classList.add('fas');
                favoriteText.textContent = 'Remove from Favorites';
                favoriteBtn.classList.add('favorited');
            } else {
                favoriteIcon.classList.remove('fas');
                favoriteIcon.classList.add('far');
                favoriteText.textContent = 'Add to Favorites';
                favoriteBtn.classList.remove('favorited');
            }
        }
        
        function showNotification(message, type) {
            // Create notification element
            const notification = document.createElement('div');
            notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 transform translate-x-full`;
            
            const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
            notification.classList.add(bgColor, 'text-white');
            
            const icon = type === 'success' ? 'check-circle' : 'exclamation-circle';
            
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
            
            // Auto remove after 3 seconds
            setTimeout(() => {
                notification.classList.add('translate-x-full');
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }
    }

    function setupModalListeners() {
        // Registration modal backdrop click
        const registrationModal = document.getElementById('registration-modal');
        if (registrationModal) {
            registrationModal.addEventListener('click', function(e) {
                if (e.target === registrationModal) {
                    hideRegistrationModal();
                }
            });
        }

        // Question modal backdrop click
        const questionModal = document.getElementById('question-modal');
        if (questionModal) {
            questionModal.addEventListener('click', function(e) {
                if (e.target === questionModal) {
                    hideQuestionModal();
                }
            });
        }

        // Report modal backdrop click
        const reportModal = document.getElementById('report-modal');
        if (reportModal) {
            reportModal.addEventListener('click', function(e) {
                if (e.target === reportModal) {
                    closeReportModal();
                }
            });
        }

        // ESC key to close modals
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                hideRegistrationModal();
                hideQuestionModal();
                closeReportModal();
            }
        });

        // Registration step navigation
        const nextStepBtn = document.getElementById('next-step-btn');
        const prevStepBtn = document.getElementById('prev-step-btn');
        
        if (nextStepBtn) {
            nextStepBtn.addEventListener('click', nextRegistrationStep);
        }
        if (prevStepBtn) {
            prevStepBtn.addEventListener('click', prevRegistrationStep);
        }
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

    // Set up modal event listeners
    setupModalListeners();

    // Make functions global for onclick handlers
    window.closeReportModal = closeReportModal;
    window.showRegistrationModal = showRegistrationModal;
    window.hideRegistrationModal = hideRegistrationModal;
    window.showQuestionModal = showQuestionModal;
    window.hideQuestionModal = hideQuestionModal;
    window.proceedToExternalLink = proceedToExternalLink;
    window.hideExternalLinkModal = hideExternalLinkModal;

    // Check user session and update navigation
    async function checkUserSession() {
        try {
            const response = await fetch('/auth/check-session', {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const userData = await response.json();
                updateNavigationForUser(userData);
            } else {
                updateNavigationForGuest();
            }
        } catch (error) {
            console.error('Session check failed:', error);
            updateNavigationForGuest();
        }
    }

    function updateNavigationForUser(userData) {
        const navLinks = document.querySelector('.hidden.md\\:flex.items-center.space-x-8');
        const userSection = document.querySelector('.flex.items-center.space-x-4');
        const mobileMenu = document.getElementById('mobile-menu');

        if (!navLinks || !userSection || !mobileMenu) return;

        // Update main navigation
        let navHTML = `
            <a href="index.html" class="text-gray-600 hover:text-gray-900 font-medium transition-colors">Home</a>
            <a href="events.html" class="text-gray-600 hover:text-gray-900 font-medium transition-colors">Events</a>
        `;

        if (userData.role === 'organizer' || userData.role === 'admin') {
            navHTML += `<a href="event_creation.html" class="text-gray-600 hover:text-gray-900 font-medium transition-colors">Create Event</a>`;
        }

        navLinks.innerHTML = navHTML;

        // Insert user menu between report button and mobile menu button
        const reportBtn = document.getElementById('reportEventBtn');
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        
        // Remove existing user menu if present
        const existingUserMenu = userSection.querySelector('.relative');
        if (existingUserMenu) {
            existingUserMenu.remove();
        }

        // Create user menu element
        const userMenuHTML = `
            <div class="relative">
                <button id="user-menu-button" class="flex items-center space-x-2 focus:outline-none bg-gray-100 hover:bg-gray-200 py-2 px-3 rounded-lg transition-colors">
                    <div class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold text-sm">
                        <span>${userData.username ? userData.username.charAt(0).toUpperCase() : 'U'}</span>
                    </div>
                    <span class="hidden md:inline text-gray-700 font-medium">${userData.username || 'User'}</span>
                    <i class="fas fa-chevron-down text-sm text-gray-500"></i>
                </button>
                
                <div id="user-menu" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-200">
                    <a href="${getUserDashboardUrl(userData.role)}" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Dashboard</a>
                    <a href="${getUserDashboardUrl(userData.role)}" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">My Events</a>
                    <a href="${getUserDashboardUrl(userData.role)}" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Profile</a>
                    <div class="border-t border-gray-200 my-1"></div>
                    <button id="logout-btn" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Sign out</button>
                </div>
            </div>
        `;

        // Insert the user menu before the mobile menu button
        mobileMenuButton.insertAdjacentHTML('beforebegin', userMenuHTML);

        // Update mobile menu
        let mobileHTML = `
            <a href="index.html" class="block py-2 px-4 hover:bg-gray-100 rounded">Home</a>
            <a href="events.html" class="block py-2 px-4 hover:bg-gray-100 rounded">Events</a>
        `;

        if (userData.role === 'organizer' || userData.role === 'admin') {
            mobileHTML += `<a href="event_creation.html" class="block py-2 px-4 hover:bg-gray-100 rounded">Create Event</a>`;
        }

        mobileHTML += `
            <div class="border-t border-gray-200 mt-2 pt-2">
                <a href="${getUserDashboardUrl(userData.role)}" class="block py-2 px-4 hover:bg-gray-100 rounded">Dashboard</a>
                <a href="${getUserDashboardUrl(userData.role)}" class="block py-2 px-4 hover:bg-gray-100 rounded">My Events</a>
                <button id="mobile-logout-btn" class="block w-full text-left py-2 px-4 hover:bg-gray-100 rounded">Sign out</button>
            </div>
        `;

        mobileMenu.innerHTML = mobileHTML;

        // Set up user menu and logout functionality
        setupUserMenu();
    }

    function updateNavigationForGuest() {
        // For guests, the navigation is static in the HTML
        // Just ensure mobile menu is set up correctly
        const mobileMenu = document.getElementById('mobile-menu');
        
        if (mobileMenu) {
            // Update mobile menu for guests
            mobileMenu.innerHTML = `
                <a href="index.html" class="block py-2 px-4 hover:bg-gray-100 rounded">Home</a>
                <a href="events.html" class="block py-2 px-4 hover:bg-gray-100 rounded">Events</a>
                <a href="event_creation.html" class="block py-2 px-4 hover:bg-gray-100 rounded">Create Event</a>
                <a href="login_signup.html" class="block py-2 px-4 hover:bg-gray-100 rounded">Join Now</a>
            `;
        }
    }

    function getUserDashboardUrl(role) {
        switch (role) {
            case 'admin':
                return 'admin.html';
            case 'organizer':
                return 'organizer.html';
            default:
                return 'user.html';
        }
    }

    function setupUserMenu() {
        const userMenuButton = document.getElementById('user-menu-button');
        const userMenu = document.getElementById('user-menu');
        const logoutBtn = document.getElementById('logout-btn');

        if (userMenuButton && userMenu) {
            userMenuButton.addEventListener('click', () => {
                userMenu.classList.toggle('hidden');
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!userMenuButton.contains(e.target) && !userMenu.contains(e.target)) {
                    userMenu.classList.add('hidden');
                }
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                try {
                    await fetch('/auth/logout', {
                        method: 'POST',
                        credentials: 'include'
                    });
                    window.location.href = 'index.html';
                } catch (error) {
                    console.error('Logout failed:', error);
                    window.location.href = 'index.html';
                }
            });
        }
    }

    // Function to populate speakers section
    function populateSpeakersSection(speakers) {
        const speakersSection = findElementByText('h2', 'Featured Speakers')?.closest('section');
        
        if (!speakers || speakers.length === 0) {
            // Hide the entire speakers section if no speakers
            if (speakersSection) {
                speakersSection.style.display = 'none';
            }
            return;
        }

        // Show the section
        if (speakersSection) {
            speakersSection.style.display = 'block';
        }

        const speakersGrid = speakersSection.querySelector('.grid');
        if (speakersGrid) {
            speakersGrid.innerHTML = ''; // Clear existing content
            
            speakers.forEach(speaker => {
                const speakerCard = document.createElement('div');
                speakerCard.className = 'speaker-card bg-white rounded-xl overflow-hidden shadow-md transition-all duration-300';
                speakerCard.innerHTML = `
                    <div class="h-64 overflow-hidden bg-gray-200 flex items-center justify-center">
                        <i class="fas fa-user text-gray-400 text-6xl"></i>
                    </div>
                    <div class="p-6">
                        <h3 class="text-xl font-bold mb-1">${speaker.name || 'Speaker Name'}</h3>
                        <p class="text-gray-600 mb-3">${speaker.title || 'Speaker Title'}</p>
                        <p class="text-gray-600 text-sm">${speaker.bio || 'Speaker biography not available.'}</p>
                    </div>
                `;
                speakersGrid.appendChild(speakerCard);
            });
        }
    }

    // Function to populate gallery section
    function populateGallerySection(gallery) {
        const gallerySection = findElementByText('h2', 'Event Gallery')?.closest('section');
        
        if (!gallery || gallery.length === 0) {
            // Hide the entire gallery section if no images
            if (gallerySection) {
                gallerySection.style.display = 'none';
            }
            return;
        }

        // Show the section
        if (gallerySection) {
            gallerySection.style.display = 'block';
        }

        const galleryGrid = gallerySection.querySelector('.grid');
        if (galleryGrid) {
            galleryGrid.innerHTML = ''; // Clear existing content
            
            gallery.forEach(image => {
                const galleryItem = document.createElement('div');
                galleryItem.className = 'h-48 overflow-hidden rounded-lg';
                galleryItem.innerHTML = `
                    <img src="/uploads/${image}" 
                         alt="Event Gallery" 
                         class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                         onerror="this.parentElement.style.display='none'">
                `;
                galleryGrid.appendChild(galleryItem);
            });
        }
    }

    // Function to populate FAQ section
    function populateFAQSection(faqs) {
        const faqSection = findElementByText('h2', 'Frequently Asked Questions')?.closest('section');
        
        if (!faqs || faqs.length === 0) {
            // Hide the entire FAQ section if no FAQs
            if (faqSection) {
                faqSection.style.display = 'none';
            }
            return;
        }

        // Show the section
        if (faqSection) {
            faqSection.style.display = 'block';
        }

        const faqContainer = faqSection.querySelector('.space-y-4');
        if (faqContainer) {
            faqContainer.innerHTML = ''; // Clear existing content
            
            faqs.forEach(faq => {
                const faqItem = document.createElement('div');
                faqItem.className = 'border border-gray-200 rounded-lg overflow-hidden';
                faqItem.innerHTML = `
                    <button class="faq-toggle w-full px-6 py-4 text-left font-semibold bg-white hover:bg-gray-50 flex justify-between items-center">
                        <span>${faq.question || 'Question'}</span>
                        <i class="fas fa-chevron-down transition-transform duration-300"></i>
                    </button>
                    <div class="faq-content px-6 py-4 bg-gray-50 hidden">
                        <p class="text-gray-700">${faq.answer || 'Answer not provided.'}</p>
                    </div>
                `;
                faqContainer.appendChild(faqItem);
                
                // Add event listener for the new FAQ toggle
                const toggleBtn = faqItem.querySelector('.faq-toggle');
                toggleBtn.addEventListener('click', () => {
                    const content = toggleBtn.nextElementSibling;
                    const icon = toggleBtn.querySelector('i');

                    const isHidden = content.classList.contains('hidden');

                    // Close other FAQs
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
        }
    }

    // Function to populate sponsors section
    function populateSponsorsSection(sponsors) {
        const sponsorsSection = findElementByText('h2', 'Our Sponsors')?.closest('section');
        
        if (!sponsors || sponsors.length === 0) {
            // Hide the entire sponsors section if no sponsors
            if (sponsorsSection) {
                sponsorsSection.style.display = 'none';
            }
            return;
        }

        // Show the section
        if (sponsorsSection) {
            sponsorsSection.style.display = 'block';
        }

        const sponsorsContainer = sponsorsSection.querySelector('.flex.flex-wrap');
        if (sponsorsContainer) {
            sponsorsContainer.innerHTML = ''; // Clear existing content
            
            sponsors.forEach(sponsor => {
                const sponsorItem = document.createElement('div');
                sponsorItem.className = 'sponsor-item text-center';
                
                if (sponsor.website) {
                    sponsorItem.innerHTML = `
                        <a href="${sponsor.website}" target="_blank" rel="noopener noreferrer" 
                           class="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                            <div class="text-lg font-semibold text-gray-800 mb-1">${sponsor.name || 'Sponsor'}</div>
                            <div class="text-sm text-gray-500">${sponsor.tier || 'Sponsor'}</div>
                        </a>
                    `;
                } else {
                    sponsorItem.innerHTML = `
                        <div class="block p-4 bg-white rounded-lg shadow-sm">
                            <div class="text-lg font-semibold text-gray-800 mb-1">${sponsor.name || 'Sponsor'}</div>
                            <div class="text-sm text-gray-500">${sponsor.tier || 'Sponsor'}</div>
                        </div>
                    `;
                }
                
                sponsorsContainer.appendChild(sponsorItem);
            });
        }
    }

});
