// This script handles the multi-step form logic for event creation.

// --- Organizer Authentication Check ---
async function checkOrganizerAuthentication() {
    try {
        // Check if we have a session with the backend
        const response = await fetch('/auth/check-session', {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            // No valid session found
            alert('You need to be logged in as an Organizer to create events.');
            window.location.href = 'login_signup.html';
            return;
        }

        const sessionData = await response.json();
        if (sessionData.role !== 'organizer') {
            alert('Only organizers can create events. Please log in with an organizer account.');
            window.location.href = 'login_signup.html';
            return;
        }

        // Valid organizer session found
        console.log('Organizer authenticated:', sessionData);
    } catch (error) {
        console.error('Authentication check failed:', error);
        // Fallback to localStorage check for now
        const hasOrganizerSession = localStorage.getItem('organizerSession');
        const currentPage = window.location.pathname.split('/').pop();
        const protectedPages = ['event_creation.html', 'organizer.html'];

        if (protectedPages.includes(currentPage) && !hasOrganizerSession) {
            alert('You need to be logged in as an Organizer to create events.');
            window.location.href = 'login_signup.html';
        }
    }
}

// Run authentication check when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', checkOrganizerAuthentication);

// --- Form State and Navigation ---
let currentStep = 1;
const totalSteps = 4;

/**
 * Updates the progress bar and step indicators based on the current step.
 */
function updateProgressBar() {
    const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
    document.getElementById('progress-bar').style.width = `${progressPercentage}%`;

    // Update step indicator styles
    document.querySelectorAll('.step-indicator').forEach((indicator) => {
        const step = parseInt(indicator.dataset.step, 10);
        if (step === currentStep) {
            indicator.classList.add('active', 'text-primary');
            indicator.classList.remove('text-gray-500');
        } else {
            indicator.classList.remove('active', 'text-primary');
            indicator.classList.add('text-gray-500');
        }
    });
}

/**
 * Shows a specific step in the form.
 * @param {number} stepNumber - The step to display.
 */
function showStep(stepNumber) {
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById(`step-${stepNumber}`).classList.add('active');
    currentStep = stepNumber;
    updateProgressBar();

    // If we're on the final review step, populate the review fields with current form data.
    if (stepNumber === 4) {
        populateReviewFields();
    }
}

/**
 * Moves to the next step in the form after validation.
 * @param {number} stepNumber - The step to move to.
 */
function nextStep(stepNumber) {
    if (validateCurrentStep()) {
        showStep(stepNumber);
    }
}

/**
 * Moves to the previous step in the form.
 * @param {number} stepNumber - The step to move to.
 */
function prevStep(stepNumber) {
    showStep(stepNumber);
}

/**
 * Validates the required fields for the current step.
 * @returns {boolean} - True if validation passes, false otherwise.
 */
function validateCurrentStep() {
    // A more robust validation would add specific error messages next to each field.
    // This implementation uses alerts for simplicity.
    if (currentStep === 1) {
        const title = document.getElementById('event-title').value;
        const description = document.getElementById('event-description').innerHTML;
        const category = document.getElementById('event-category').value;
        const image = document.getElementById('cover-image').files[0];

        if (!title.trim()) { alert('Please enter an event title.'); return false; }
        if (!description.trim() || description === '<br>' || description === '<div><br></div>') { alert('Please enter an event description.'); return false; }
        if (!category) { alert('Please select a category.'); return false; }
        if (category === 'other' && !document.getElementById('other-category').value.trim()) { alert('Please specify a category.'); return false; }
        if (!image) { alert('Please upload a cover image.'); return false; }

    } else if (currentStep === 2) {
        const date = document.getElementById('event-date').value;
        const time = document.getElementById('event-time').value;
        const location = document.getElementById('event-location').value;

        if (!date) { alert('Please select an event date.'); return false; }
        if (!time) { alert('Please select an event time.'); return false; }
        if (!location.trim()) { alert('Please enter a location.'); return false; }

    } else if (currentStep === 3) {
        const registrationMethod = document.querySelector('input[name="registration-method"]:checked');
        if (!registrationMethod) { alert('Please select a registration method.'); return false; }
        if (registrationMethod.value === 'external' && !document.getElementById('external-link').value.trim()) { alert('Please enter an external registration URL.'); return false; }
    }

    return true; // Validation passed
}

// --- Event Listeners and Field-Specific Logic ---

// Show/hide "Other Category" input based on selection.
document.getElementById('event-category').addEventListener('change', function() {
    const otherContainer = document.getElementById('other-category-container');
    otherContainer.classList.toggle('hidden', this.value !== 'other');
});

// Display a preview of the uploaded cover image.
document.getElementById('cover-image').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const previewContainer = document.getElementById('image-preview-container');
            const previewImage = document.getElementById('image-preview');

            previewImage.src = event.target.result;
            previewContainer.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
});

/**
 * Applies formatting to the rich text editor.
 * @param {string} command - The document.execCommand command to run.
 */
function formatText(command) {
    if (command === 'createLink') {
        const url = prompt('Enter the URL:');
        if (url) {
            document.execCommand('createLink', false, url);
        }
    } else {
        document.execCommand(command, false, null);
    }
    document.getElementById('event-description').focus();
}

/**
 * Handles the UI selection for registration methods.
 * @param {'platform' | 'external'} option - The selected registration option.
 */
function selectRegistrationOption(option) {
    const platformOption = document.getElementById('platform-option');
    const externalOption = document.getElementById('external-option');
    const externalLinkContainer = document.getElementById('external-link-container');

    const isPlatform = option === 'platform';

    platformOption.classList.toggle('selected', isPlatform);
    externalOption.classList.toggle('selected', !isPlatform);

    document.getElementById('platform-registration').checked = isPlatform;
    document.getElementById('external-registration').checked = !isPlatform;

    externalLinkContainer.classList.toggle('hidden', isPlatform);
}

/**
 * Performs a basic validation on the external link URL.
 */
function validateExternalLink() {
    const urlInput = document.getElementById('external-link');
    const url = urlInput.value;
    const message = document.getElementById('link-validation-message');

    message.classList.remove('hidden', 'text-green-600', 'text-yellow-600', 'text-red-600');

    if (!url) {
        message.textContent = 'Please enter a URL';
        message.classList.add('text-red-600');
        return;
    }

    try {
        const urlObject = new URL(url);
        if (urlObject.protocol !== 'https:') {
            message.textContent = 'Warning: URL should use HTTPS for security.';
            message.classList.add('text-yellow-600');
        } else {
            message.textContent = 'Valid URL format.';
            message.classList.add('text-green-600');
        }
    } catch (_) {
        message.textContent = 'Invalid URL format.';
        message.classList.add('text-red-600');
    }
}

/**
 * Opens the provided Facebook event URL in a new tab.
 */
function openFacebookEvent() {
    const url = document.getElementById('facebook-event-url').value;
    if (url) {
        // In a real scenario, you'd show a warning modal before opening an external link.
        window.open(url, '_blank');
    } else {
        alert('Please enter a Facebook event URL first.');
    }
}

// --- Review Step Population ---

/**
 * Populates all fields in the review step with data from the form.
 */
function populateReviewFields() {
    // Basic info
    document.getElementById('review-title').textContent = document.getElementById('event-title').value || '-';

    const categorySelect = document.getElementById('event-category');
    const categoryValue = categorySelect.value;
    if (categoryValue === 'other') {
        document.getElementById('review-category').textContent = document.getElementById('other-category').value || 'Other';
    }
    else {
        document.getElementById('review-category').textContent = categorySelect.options[categorySelect.selectedIndex].text || '-';
    }

    //Registration methods
    const regMethodElement = document.querySelector('input[name="registration-method"]:checked');
    if (regMethodElement) {
        document.getElementById('review-registration').textContent = regMethodElement.value === 'platform'
            ? 'Platform-Based Registration'
            : `External Link: ${document.getElementById('external-link').value}`;
    } else {
        document.getElementById('review-registration').textContent = '-';
    }


    // Date and time
    const date = document.getElementById('event-date').value;
    const time = document.getElementById('event-time').value;
    document.getElementById('review-datetime').textContent = (date && time) ? new Date(`${date}T${time}`).toLocaleString() : '-';

    // Location
    const location = document.getElementById('event-location').value;
    const isOnline = document.getElementById('is-online').checked;
    formData.set('isOnline', isOnline);
    document.getElementById('review-location').textContent = isOnline ? `Online: ${location}` : location || '-';

    // Registration
    const regMethod = document.querySelector('input[name="registration-method"]:checked');
    if (regMethod) {
        document.getElementById('review-registration').textContent = regMethod.value === 'platform'
            ? 'Platform-Based Registration'
            : `External Link: ${document.getElementById('external-link').value}`;
    } else {
        document.getElementById('review-registration').textContent = '-';
    }

    const deadline = document.getElementById('registration-deadline').value;
    document.getElementById('review-deadline').textContent = deadline ? new Date(deadline).toLocaleString() : 'Open until event starts';

    // Description and other text areas
    document.getElementById('review-description').innerHTML = document.getElementById('event-description').innerHTML || '<p class="text-gray-500">No description</p>';
    const prizeInfo = document.getElementById('prize-info').value;
    document.getElementById('review-prizes').innerHTML = prizeInfo ? `<p>${prizeInfo.replace(/\n/g, '<br>')}</p>` : '<p class="text-gray-500">No prize info</p>';
    const rules = document.getElementById('event-rules').value;
    document.getElementById('review-rules').innerHTML = rules ? `<p>${rules.replace(/\n/g, '<br>')}</p>` : '<p class="text-gray-500">No rules</p>';

    // Cover image
    const fileInput = document.getElementById('cover-image');
    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('review-image').innerHTML = `<img src="${e.target.result}" class="h-20 w-20 object-cover rounded-md">`;
        };
        reader.readAsDataURL(fileInput.files[0]);
    }
}

// --- Form Submission ---

document.getElementById('event-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    if (!document.getElementById('terms').checked) {
        alert('Please agree to the Terms of Service and Event Guidelines.');
        return;
    }

    // Collect form data and map to backend schema fields
    const eventData = {};

    // Required fields - map form names to schema field names
    eventData.title = document.getElementById('event-title').value;
    eventData.description = document.getElementById('event-description').innerHTML;
    
    // Handle category
    const categorySelect = document.getElementById('event-category');
    if (categorySelect.value === 'other') {
        eventData.category = document.getElementById('other-category').value;
    } else {
        eventData.category = categorySelect.value;
    }
    
    eventData.date = document.getElementById('event-date').value;
    eventData.time = document.getElementById('event-time').value;
    eventData.location = document.getElementById('event-location').value;
    eventData.registrationDeadline = document.getElementById('registration-deadline').value;
    
    // Registration method (required)
    const regMethod = document.querySelector('input[name="registration-method"]:checked');
    if (regMethod) {
        eventData.registrationMethod = regMethod.value;
        if (regMethod.value === 'external') {
            eventData.externalRegistrationUrl = document.getElementById('external-link').value;
        }
    } else {
        alert('Please select a registration method.');
        return;
    }

    // Optional fields
    eventData.prizeInfo = document.getElementById('prize-info').value;
    eventData.rules = document.getElementById('event-rules').value;

    // Validate required fields
    const requiredFields = ['title', 'description', 'category', 'date', 'time', 'location', 'registrationDeadline', 'registrationMethod'];
    for (const field of requiredFields) {
        if (!eventData[field] || eventData[field].trim() === '') {
            alert(`Please fill in the ${field} field.`);
            return;
        }
    }

    try {
        const response = await fetch('/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData),
            credentials: 'include'
        });

        if (response.ok) {
            const result = await response.json();
            alert('Event submitted successfully! It will be reviewed by our team.');

            // Reset the form and return to the first step
            this.reset();
            document.getElementById('event-description').innerHTML = '';
            document.getElementById('image-preview-container').classList.add('hidden');
            document.getElementById('external-link-container').classList.add('hidden');
            document.querySelectorAll('.registration-option').forEach(option => option.classList.remove('selected'));
            showStep(1);

        } else if (response.status === 401) {
            // Authentication failed
            alert('You need to be logged in as an organizer to create events. Please log in first.');
            window.location.href = 'login_signup.html';
        } else {
            const errorData = await response.json();
            alert(`Error creating event: ${errorData.message || response.statusText}`);
        }
    } catch (error) {
        console.error('Error submitting event:', error);
        alert('An error occurred while submitting the event. Please try again.');
    }
});

// --- Modal Logic ---
// This is an example of how you might handle a warning modal for external links.
let externalLinkToProceed = '';

function showExternalLinkModal(url) {
    externalLinkToProceed = url;
    document.getElementById('external-link-modal').classList.remove('hidden');
}

function hideExternalLinkModal() {
    document.getElementById('external-link-modal').classList.add('hidden');
}

function proceedToExternalLink() {
    if (externalLinkToProceed) {
        window.open(externalLinkToProceed, '_blank');
    }
    hideExternalLinkModal();
}

// --- Initializer ---
// Set the initial state of the progress bar when the page loads.
updateProgressBar();
