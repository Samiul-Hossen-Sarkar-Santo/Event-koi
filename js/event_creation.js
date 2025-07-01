// This script handles the multi-step form logic for event creation.

// --- Organizer Authentication Check ---
function checkOrganizerAuthentication() {
    // For now, we'll check for a simple flag in localStorage.
    // In a real application, you'd verify a proper session token or cookie.
    const hasOrganizerSession = localStorage.getItem('organizerSession');

    // Define which pages require organizer authentication
    const protectedPages = ['event_creation.html', 'organizer.html']; // Add other organizer pages here

    const currentPage = window.location.pathname.split('/').pop();

    // Redirect if on a protected page and not authenticated
    if (protectedPages.includes(currentPage)) {
        if (!hasOrganizerSession) {
            // Redirect to login if no organizer session found
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
let reviewFormData = null; // Variable to store form data for review

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

    // If we're on the final review step, collect and populate the review fields with current form data.
    if (stepNumber === 4) {
        collectFormDataForReview(); // Collect data before populating
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
        const title = document.getElementById('event-title').value.trim();
        const description = document.getElementById('event-description').innerHTML.trim();
        const category = document.getElementById('event-category').value;
        const imageInput = document.getElementById('cover-image');

        if (!title) { alert('Please enter an event title.'); return false; }
        // Check if description is empty or contains only basic break tags from rich text editor
        if (!description || description === '<br>' || description === '<div><br></div>' || description === '<p><br></p>') { alert('Please enter an event description.'); return false; }
        if (!category) { alert('Please select a category.'); return false; }
        if (category === 'other' && !document.getElementById('other-category').value.trim()) { alert('Please specify a category.'); return false; }
        if (!imageInput.files || imageInput.files.length === 0) { alert('Please upload a cover image.'); return false; }


    } else if (currentStep === 2) {
        const date = document.getElementById('event-date').value;
        const time = document.getElementById('event-time').value;
        const location = document.getElementById('event-location').value.trim();

        if (!date) { alert('Please select an event date.'); return false; }
        if (!time) { alert('Please select an event time.'); return false; }
        if (!location) { alert('Please enter a location.'); return false; }


    } else if (currentStep === 3) {
        const registrationMethod = document.querySelector('input[name="registration-method"]:checked');
        if (!registrationMethod) { alert('Please select a registration method.'); return false; }
        if (registrationMethod.value === 'external' && !document.getElementById('external-link').value.trim()) { alert('Please enter an external registration URL.'); return false; }
    }

    return true; // Validation passed
}

// --- Event Listeners and Field-Specific Logic ---

// Show/hide "Other Category" input based on selection.
document.getElementById('event-category').addEventListener('change', function () {
    const otherContainer = document.getElementById('other-category-container');
    otherContainer.classList.toggle('hidden', this.value !== 'other');
    // Clear the other category input if the selected category is not 'other'
    if (this.value !== 'other') {
        document.getElementById('other-category').value = '';
    }
});

// Add event listeners for rich text editor buttons
document.addEventListener('DOMContentLoaded', () => {
    const formatButtons = document.querySelectorAll('.rich-text-editor + div.mt-1 button');
    formatButtons.forEach(button => {
        const command = button.onclick.toString().match(/formatText\('([^']+)'\)/)[1];
        if (command) {
            button.onclick = null; // Remove inline onclick
            button.addEventListener('click', () => formatText(command));
        }
    });

    // Add event listeners for navigation buttons
    const nextStepButtons = document.querySelectorAll('.step button[onclick^="nextStep"]');
    nextStepButtons.forEach(button => {
        const step = parseInt(button.onclick.toString().match(/nextStep\((\d+)\)/)[1], 10);
        if (!isNaN(step)) {
            button.onclick = null; // Remove inline onclick
            button.addEventListener('click', () => nextStep(step));
        }
    });

    const prevStepButtons = document.querySelectorAll('.step button[onclick^="prevStep"]');
    prevStepButtons.forEach(button => {
        const step = parseInt(button.onclick.toString().match(/prevStep\((\d+)\)/)[1], 10);
        if (!isNaN(step)) {
            button.onclick = null; // Remove inline onclick
            button.addEventListener('click', () => prevStep(step));
        }
    });

    // Add event listeners for registration option divs
    const registrationOptions = document.querySelectorAll('.registration-option');
    registrationOptions.forEach(option => {
        const method = option.onclick.toString().match(/selectRegistrationOption\('([^']+)'\)/)[1];
        if (method) {
            option.onclick = null; // Remove inline onclick
            option.addEventListener('click', () => selectRegistrationOption(method));
        }
    });
});



// Display a preview of the uploaded cover image.
document.getElementById('cover-image').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            const previewContainer = document.getElementById('image-preview-container');
            const previewImage = document.getElementById('image-preview');

            previewImage.src = event.target.result;
            previewContainer.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    } else {
        // Hide preview if no file is selected
        document.getElementById('image-preview-container').classList.add('hidden');
        document.getElementById('image-preview').src = '#'; // Clear the image source
    }
});

// Add event listener for the Facebook event import button
document.addEventListener('DOMContentLoaded', () => {
    const facebookButton = document.querySelector('.p-4.bg-blue-50 button[onclick^="openFacebookEvent"]');
    if (facebookButton) facebookButton.addEventListener('click', openFacebookEvent);
});


/**
 * Applies formatting to the rich text editor.
 * @param {string} command - The document.execCommand command to run.
 */
function formatText(command) {
    const descriptionEditor = document.getElementById('event-description');
    if (!descriptionEditor) return; // Exit if editor not found

    if (command === 'createLink') {
        const url = prompt('Enter the URL:');
        if (url) {
            document.execCommand('createLink', false, url);
        }
    } else {
        document.execCommand(command, false, null);
    }
    descriptionEditor.focus();
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

    // Clear external link input if switching to platform registration
    if (isPlatform) {
        document.getElementById('external-link').value = '';
        document.getElementById('link-validation-message').classList.add('hidden');
    }
}


/**
 * Performs a basic validation on the external link URL.
 */
function validateExternalLink() {
    const urlInput = document.getElementById('external-link');
    const url = urlInput.value.trim();
    const message = document.getElementById('link-validation-message');

    message.classList.remove('hidden', 'text-green-600', 'text-yellow-600', 'text-red-600');
    message.textContent = ''; // Clear previous message

    if (!url) {
        message.textContent = 'Please enter a URL';
        message.classList.add('text-red-600');
        message.classList.remove('hidden');
        return false;
    }

    try {
        const urlObject = new URL(url);
        if (urlObject.protocol !== 'https:') {
            message.textContent = 'Warning: URL should use HTTPS for security.';
            message.classList.add('text-yellow-600');
            message.classList.remove('hidden');
        } else {
            message.textContent = 'Valid URL format.';
            message.classList.add('text-green-600');
            message.classList.remove('hidden');
        }
        return true;
    } catch (_) {
        message.textContent = 'Invalid URL format.';
        message.classList.add('text-red-600');
        message.classList.remove('hidden');
        return false;
    }
}

// Add event listener for the external link validation button
document.addEventListener('DOMContentLoaded', () => {
    const validateButton = document.querySelector('#external-link-container button[onclick^="validateExternalLink"]');
    if (validateButton) validateButton.addEventListener('click', validateExternalLink);
});


/**
 * Opens the provided Facebook event URL in a new tab.
 */
function openFacebookEvent() {
    const url = document.getElementById('facebook-event-url').value.trim();
    if (url) {
        // In a real scenario, you'd show a warning modal before opening an external link.
        window.open(url, '_blank');
    } else {
        alert('Please enter a Facebook event URL first.');
    }
}

// --- Data Collection for Review and Submission ---

/**
 * Collects form data and stores it in reviewFormData for the review step.
 */
function collectFormDataForReview() {
    const form = document.getElementById('event-form');
    if (!form) return;

    reviewFormData = new FormData(form);

    // Manually add rich text editor content
    const eventDescription = document.getElementById('event-description').innerHTML;
    reviewFormData.set('eventDescription', eventDescription); // Use a consistent key

    // Handle category 'other'
    const categorySelect = document.getElementById('event-category');
    const categoryValue = categorySelect.value;
    if (categoryValue === 'other') {
        reviewFormData.set('eventCategory', document.getElementById('other-category').value.trim()); // Use a consistent key
    } else {
        reviewFormData.set('eventCategory', categoryValue); // Use a consistent key
    }

    // Get the registration method and external link if applicable
    const regMethodElement = document.querySelector('input[name="registration-method"]:checked');
    if (regMethodElement) {
        reviewFormData.set('registrationMethod', regMethodElement.value); // Use a consistent key
        if (regMethodElement.value === 'external') {
            reviewFormData.set('externalLink', document.getElementById('external-link').value.trim()); // Use a consistent key
        }
    }
    // Handle isOnline checkbox
    reviewFormData.set('isOnline', document.getElementById('is-online').checked);

    // Add other fields explicitly for review data if needed
    reviewFormData.set('eventTitle', document.getElementById('event-title').value.trim());
    reviewFormData.set('eventDate', document.getElementById('event-date').value);
    reviewFormData.set('eventTime', document.getElementById('event-time').value);
    reviewFormData.set('eventLocation', document.getElementById('event-location').value.trim());
    reviewFormData.set('registrationDeadline', document.getElementById('registration-deadline').value);
    reviewFormData.set('prizeInfo', document.getElementById('prize-info').value.trim());
    reviewFormData.set('rules', document.getElementById('event-rules').value.trim());

    // Store the file object itself if needed for review preview (optional, can also use data URL)
    const coverImageInput = document.getElementById('cover-image');
    if (coverImageInput.files && coverImageInput.files.length > 0) {
        reviewFormData.set('coverImageFile', coverImageInput.files[0]);
    } else {
        reviewFormData.delete('coverImageFile'); // Remove if no file selected
    }

}


/**
 * Populates all fields in the review step with data from the collected form data.
 */
function populateReviewFields() {
    if (!reviewFormData) {
        console.error('Review form data not available.');
        return;
    }

    // Basic info
    document.getElementById('review-title').textContent = reviewFormData.get('eventTitle') || '-';
    document.getElementById('review-category').textContent = reviewFormData.get('eventCategory') || '-';

    // Date and time
    const date = reviewFormData.get('eventDate');
    const time = reviewFormData.get('eventTime');
    document.getElementById('review-datetime').textContent = (date && time) ? new Date(`${date}T${time}`).toLocaleString() : '-';

    // Location
    const location = reviewFormData.get('eventLocation');
    const isOnline = reviewFormData.get('isOnline');
    document.getElementById('review-location').textContent = isOnline ? `Online: ${location}` : location || '-';

    // Registration
    const regMethod = reviewFormData.get('registrationMethod');
    if (regMethod) {
        document.getElementById('review-registration').textContent = regMethod === 'platform'
            ? 'Platform-Based Registration'
            : `External Link: ${reviewFormData.get('externalLink') || '-'}`;
    } else {
        document.getElementById('review-registration').textContent = '-';
    }

    const deadline = reviewFormData.get('registrationDeadline');
    document.getElementById('review-deadline').textContent = deadline ? new Date(deadline).toLocaleString() : 'Open until event starts';

    // Description and other text areas (using innerHTML for rich text)
    document.getElementById('review-description').innerHTML = reviewFormData.get('eventDescription') || '<p class="text-gray-500">No description</p>';
    const prizeInfo = reviewFormData.get('prizeInfo');
    document.getElementById('review-prizes').innerHTML = prizeInfo ? `<p>${prizeInfo.replace(/\n/g, '<br>')}</p>` : '<p class="text-gray-500">No prize info</p>';
    const rules = reviewFormData.get('rules');
    document.getElementById('review-rules').innerHTML = rules ? `<p>${rules.replace(/\n/g, '<br>')}</p>` : '<p class="text-gray-500">No rules</p>';

    // Cover image preview
    const coverImageFile = reviewFormData.get('coverImageFile');
    const reviewImageContainer = document.getElementById('review-image');
    if (reviewImageContainer) {
        if (coverImageFile) {
            const reader = new FileReader();
            reader.onload = (e) => {
                reviewImageContainer.innerHTML = `<img src="${e.target.result}" class="h-20 w-20 object-cover rounded-md">`;
            };
            reader.readAsDataURL(coverImageFile);
        } else {
            // Display a placeholder if no image is uploaded
            reviewImageContainer.innerHTML = `
                 <div class="h-20 w-20 bg-gray-200 rounded-md flex items-center justify-center text-gray-400">
                     <i class="fas fa-image"></i>
                 </div>
             `;
        }
    }
}


// --- Form Submission ---\n\ndocument.getElementById(\'event-form\').addEventListener(\'submit\', async function(e) {
e.preventDefault();

if (!document.getElementById('terms').checked) {
    alert('Please agree to the Terms of Service and Event Guidelines.');
}

// Collect form data for submission (create a new FormData object)
const submissionFormData = new FormData(this);

// Manually add rich text editor content
const eventDescription = document.getElementById('event-description').innerHTML;
submissionFormData.set('description', eventDescription); // Use schema field name 'description'

// Handle category 'other'
const categorySelect = document.getElementById('event-category');
const categoryValue = categorySelect.value;
if (categoryValue === 'other') {
    submissionFormData.set('category', document.getElementById('other-category').value.trim()); // Use schema field name 'category'
} else {
    submissionFormData.set('category', categoryValue); // Use schema field name 'category'
}

// Get the registration method and external link if applicable
const regMethodElement = document.querySelector('input[name="registration-method"]:checked');
if (regMethodElement) {
    submissionFormData.set('registrationMethod', regMethodElement.value); // Use schema field name 'registrationMethod'
    if (regMethodElement.value === 'external') {
        submissionFormData.set('externalLink', document.getElementById('external-link').value.trim()); // Use schema field name 'externalLink'
    } else {
        submissionFormData.delete('externalLink'); // Remove if not external
    }
} else {
    // If no registration method is selected, handle as validation error or set a default
    submissionFormData.delete('registrationMethod');
    submissionFormData.delete('externalLink');
}

// Ensure correct schema field names are used for other fields
submissionFormData.set('title', document.getElementById('event-title').value.trim());
submissionFormData.set('date', document.getElementById('event-date').value);
submissionFormData.set('time', document.getElementById('event-time').value);
submissionFormData.set('location', document.getElementById('event-location').value.trim());
submissionFormData.set('registrationDeadline', document.getElementById('registration-deadline').value); // Schema requires this, frontend can send empty string if not provided
submissionFormData.set('prizeInfo', document.getElementById('prize-info').value.trim());
submissionFormData.set('rules', document.getElementById('event-rules').value.trim());

// Add the cover image file to the submission FormData
const coverImageInput = document.getElementById('cover-image');
if (coverImageInput.files && coverImageInput.files.length > 0) {
    submissionFormData.set('coverImage', coverImageInput.files[0]); // Use schema field name 'coverImage'
} else {
    submissionFormData.delete('coverImage'); // Remove if no file selected
}


try {
    const response = await fetch('/events', {
        method: 'POST',
        body: submissionFormData, // Send the submission FormData
        // Include credentials (cookies) with the request for session authentication
        credentials: 'include'
    });

    if (response.ok) {
        // Event created successfully
        const result = await response.json();
        alert('Event submitted successfully! It will be reviewed by our team.');

        // Reset the form and return to the first step upon success
        this.reset();
        document.getElementById('event-description').innerHTML = ''; // Reset rich text editor
        document.getElementById('image-preview-container').classList.add('hidden');
        document.getElementById('external-link-container').classList.add('hidden');
        document.querySelectorAll('.registration-option').forEach(option => option.classList.remove('selected'));
        showStep(1); // Go back to the first step

    } else {
        // Handle errors (e.g., display error message from the backend)
        const errorData = await response.json();
        alert(`Error creating event: ${errorData.message || response.statusText}`);
    }
} catch (error) {
    console.error('Error submitting event:', error);
    alert('An error occurred while submitting the event. Please try again.');
}



// --- Modal Logic (for external link warning) ---
// This is an example of how you might handle a warning modal for external links.
// Ensure you have the modal HTML in your event_creation.html
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


// --- Initializer ---
// Set the initial state of the progress bar when the page loads.
updateProgressBar();
