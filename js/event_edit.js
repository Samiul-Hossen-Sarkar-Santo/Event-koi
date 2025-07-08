// Event Edit JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Get event ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');
    
    if (!eventId) {
        alert('No event ID provided');
        window.location.href = 'organizer.html';
        return;
    }

    // Set the event ID in the hidden field
    document.getElementById('eventId').value = eventId;
    
    // Tab management
    let currentTab = 0;
    const tabs = ['basic', 'details', 'content', 'sponsors', 'review'];
    
    // Load event data
    loadEventData(eventId);
    
    // Load categories
    loadEditCategories();
    
    // Initialize the first tab
    showTab(0);
    
    // Tab navigation
    document.querySelectorAll('.edit-tab-btn').forEach((btn, index) => {
        btn.addEventListener('click', () => showTab(index));
    });
    
    // Navigation buttons
    document.getElementById('nextBtn').addEventListener('click', nextTab);
    document.getElementById('prevBtn').addEventListener('click', prevTab);
    
    // Form submission
    document.getElementById('editEventForm').addEventListener('submit', submitChanges);
    
    // Dynamic content management
    setupDynamicContent();
    
    async function loadEventData(eventId) {
        try {
            const response = await fetch(`/events/${eventId}`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to load event data');
            }
            
            const event = await response.json();
            populateForm(event);
            
        } catch (error) {
            console.error('Error loading event:', error);
            alert('Failed to load event data. You will be redirected to the dashboard.');
            window.location.href = 'organizer.html';
        }
    }
    
    function populateForm(event) {
        // Basic Info
        document.getElementById('eventTitle').value = event.title || '';
        document.getElementById('eventCategory').value = event.category || '';
        document.getElementById('eventDate').value = event.date ? event.date.split('T')[0] : '';
        document.getElementById('eventTime').value = event.time || '';
        document.getElementById('eventLocation').value = event.location || '';
        document.getElementById('eventDescription').value = event.description || '';
        
        // Details
        document.getElementById('registrationMethod').value = event.registrationMethod || 'platform';
        document.getElementById('externalUrl').value = event.externalRegistrationUrl || '';
        document.getElementById('registrationDeadline').value = event.registrationDeadline ? event.registrationDeadline.split('T')[0] : '';
        document.getElementById('eventSchedule').value = event.schedule || '';
        document.getElementById('prizeInfo').value = event.prizeInfo || '';
        document.getElementById('eventRules').value = event.rules || '';
        
        // Contact Info
        if (event.contactInfo) {
            document.getElementById('contactEmail').value = event.contactInfo.email || '';
            document.getElementById('contactPhone').value = event.contactInfo.phone || '';
            document.getElementById('contactWebsite').value = event.contactInfo.website || '';
        }
        
        // Handle registration method change
        toggleExternalUrlSection();
        
        // Populate dynamic content
        populateSpeakers(event.speakers || []);
        populateGallery(event.gallery || []);
        populateFaqs(event.faqs || []);
        populateSponsors(event.sponsors || []);
        
        // Show cover image if exists
        if (event.coverImage) {
            showCoverImagePreview(event.coverImage);
        }
        
        // Update page title
        document.getElementById('pageTitle').textContent = `Edit: ${event.title}`;
    }
    
    function showTab(tabIndex) {
        // Hide all tabs
        document.querySelectorAll('.edit-tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        document.querySelectorAll('.edit-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show current tab
        document.getElementById(tabs[tabIndex]).classList.add('active');
        document.querySelectorAll('.edit-tab-btn')[tabIndex].classList.add('active');
        
        currentTab = tabIndex;
        updateProgressBar();
        updateNavigationButtons();
        
        // If review tab, populate review content
        if (tabs[tabIndex] === 'review') {
            populateReviewContent();
        }
    }
    
    function nextTab() {
        if (currentTab < tabs.length - 1) {
            showTab(currentTab + 1);
        }
    }
    
    function prevTab() {
        if (currentTab > 0) {
            showTab(currentTab - 1);
        }
    }
    
    function updateProgressBar() {
        const progress = ((currentTab + 1) / tabs.length) * 100;
        document.getElementById('progressBar').style.width = `${progress}%`;
    }
    
    function updateNavigationButtons() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const submitBtn = document.getElementById('submitBtn');
        
        prevBtn.style.display = currentTab > 0 ? 'block' : 'none';
        
        if (currentTab === tabs.length - 1) {
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'block';
        } else {
            nextBtn.style.display = 'block';
            submitBtn.style.display = 'none';
        }
    }
    
    function setupDynamicContent() {
        // Registration method change handler
        document.getElementById('registrationMethod').addEventListener('change', toggleExternalUrlSection);
        
        // Category change handler
        document.getElementById('eventCategory').addEventListener('change', toggleCustomCategory);
        
        // Cover image handler
        document.getElementById('coverImage').addEventListener('change', handleCoverImageUpload);
        
        // Dynamic content buttons
        document.getElementById('addSpeakerBtn').addEventListener('click', addSpeaker);
        document.getElementById('addGalleryBtn').addEventListener('click', () => {
            document.getElementById('galleryUpload').click();
        });
        document.getElementById('galleryUpload').addEventListener('change', handleGalleryUpload);
        document.getElementById('addFaqBtn').addEventListener('click', addFaq);
        document.getElementById('addSponsorBtn').addEventListener('click', addSponsor);
        
        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', async () => {
            try {
                await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
                localStorage.clear();
                window.location.href = 'login_signup.html';
            } catch (error) {
                console.error('Logout error:', error);
                localStorage.clear();
                window.location.href = 'login_signup.html';
            }
        });
    }
    
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
    
    function toggleCustomCategory() {
        const category = document.getElementById('eventCategory').value;
        const customCategory = document.getElementById('customCategory');
        
        if (category === 'other') {
            customCategory.style.display = 'block';
            customCategory.required = true;
        } else {
            customCategory.style.display = 'none';
            customCategory.required = false;
        }
    }
    
    function handleCoverImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                showCoverImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    }
    
    function showCoverImagePreview(src) {
        const preview = document.getElementById('coverImagePreview');
        preview.innerHTML = `
            <img src="${src}" alt="Cover Image Preview" class="max-w-full h-48 object-cover rounded-lg mx-auto">
        `;
    }
    
    // Speaker management
    function addSpeaker(speaker = {}) {
        const container = document.getElementById('speakersContainer');
        const speakerIndex = container.children.length;
        
        const speakerDiv = document.createElement('div');
        speakerDiv.className = 'border border-gray-300 rounded-lg p-4';
        speakerDiv.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <h4 class="font-medium">Speaker ${speakerIndex + 1}</h4>
                <button type="button" class="text-red-600 hover:text-red-800" onclick="removeSpeaker(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input type="text" name="speakers[${speakerIndex}][name]" value="${speaker.name || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input type="text" name="speakers[${speakerIndex}][title]" value="${speaker.title || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                </div>
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea name="speakers[${speakerIndex}][bio]" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">${speaker.bio || ''}</textarea>
                </div>
            </div>
        `;
        
        container.appendChild(speakerDiv);
    }
    
    function populateSpeakers(speakers) {
        speakers.forEach(speaker => addSpeaker(speaker));
    }
    
    // FAQ management
    function addFaq(faq = {}) {
        const container = document.getElementById('faqsContainer');
        const faqIndex = container.children.length;
        
        const faqDiv = document.createElement('div');
        faqDiv.className = 'border border-gray-300 rounded-lg p-4';
        faqDiv.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <h4 class="font-medium">FAQ ${faqIndex + 1}</h4>
                <button type="button" class="text-red-600 hover:text-red-800" onclick="removeFaq(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Question</label>
                    <input type="text" name="faqs[${faqIndex}][question]" value="${faq.question || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Answer</label>
                    <textarea name="faqs[${faqIndex}][answer]" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">${faq.answer || ''}</textarea>
                </div>
            </div>
        `;
        
        container.appendChild(faqDiv);
    }
    
    function populateFaqs(faqs) {
        faqs.forEach(faq => addFaq(faq));
    }
    
    // Sponsor management
    function addSponsor(sponsor = {}) {
        const container = document.getElementById('sponsorsContainer');
        const sponsorIndex = container.children.length;
        
        const sponsorDiv = document.createElement('div');
        sponsorDiv.className = 'border border-gray-300 rounded-lg p-4';
        sponsorDiv.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <h4 class="font-medium">Sponsor ${sponsorIndex + 1}</h4>
                <button type="button" class="text-red-600 hover:text-red-800" onclick="removeSponsor(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input type="text" name="sponsors[${sponsorIndex}][name]" value="${sponsor.name || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input type="url" name="sponsors[${sponsorIndex}][website]" value="${sponsor.website || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tier</label>
                    <select name="sponsors[${sponsorIndex}][tier]" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="partner" ${sponsor.tier === 'partner' ? 'selected' : ''}>Partner</option>
                        <option value="bronze" ${sponsor.tier === 'bronze' ? 'selected' : ''}>Bronze</option>
                        <option value="silver" ${sponsor.tier === 'silver' ? 'selected' : ''}>Silver</option>
                        <option value="gold" ${sponsor.tier === 'gold' ? 'selected' : ''}>Gold</option>
                    </select>
                </div>
            </div>
        `;
        
        container.appendChild(sponsorDiv);
    }
    
    function populateSponsors(sponsors) {
        sponsors.forEach(sponsor => addSponsor(sponsor));
    }
    
    // Gallery management
    function handleGalleryUpload(event) {
        const files = Array.from(event.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = function(e) {
                addGalleryImage(e.target.result);
            };
            reader.readAsDataURL(file);
        });
    }
    
    function addGalleryImage(src) {
        const container = document.getElementById('galleryContainer');
        const imageDiv = document.createElement('div');
        imageDiv.className = 'relative';
        imageDiv.innerHTML = `
            <img src="${src}" alt="Gallery Image" class="w-full h-24 object-cover rounded-lg">
            <button type="button" class="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs" onclick="removeGalleryImage(this)">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(imageDiv);
    }
    
    function populateGallery(gallery) {
        gallery.forEach(image => {
            addGalleryImage(`/uploads/${image}`);
        });
    }
    
    function populateReviewContent() {
        const form = document.getElementById('editEventForm');
        const formData = new FormData(form);
        const reviewContent = document.getElementById('reviewContent');
        
        reviewContent.innerHTML = `
            <div class="bg-white border rounded-lg p-6">
                <h4 class="text-lg font-semibold mb-4">Event Summary</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div><strong>Title:</strong> ${formData.get('title') || 'Not specified'}</div>
                    <div><strong>Category:</strong> ${formData.get('category') || 'Not specified'}</div>
                    <div><strong>Date:</strong> ${formData.get('date') || 'Not specified'}</div>
                    <div><strong>Time:</strong> ${formData.get('time') || 'Not specified'}</div>
                    <div><strong>Location:</strong> ${formData.get('location') || 'Not specified'}</div>
                    <div><strong>Registration Method:</strong> ${formData.get('registrationMethod') || 'Not specified'}</div>
                </div>
                <div class="mt-4">
                    <strong>Description:</strong>
                    <p class="mt-1 text-gray-700">${formData.get('description') || 'Not specified'}</p>
                </div>
            </div>
        `;
    }
    
    async function submitChanges(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        
        // Collect dynamic fields and add them to FormData
        const speakers = collectSpeakers();
        const faqs = collectFaqs();
        const sponsors = collectSponsors();
        
        console.log('Collected data:');
        console.log('speakers:', speakers);
        console.log('faqs:', faqs);
        console.log('sponsors:', sponsors);
        
        // Add complex fields as JSON strings to FormData
        const speakersJSON = JSON.stringify(speakers);
        const faqsJSON = JSON.stringify(faqs);
        const sponsorsJSON = JSON.stringify(sponsors);
        
        console.log('JSON strings:');
        console.log('speakersJSON:', speakersJSON);
        console.log('faqsJSON:', faqsJSON);
        console.log('sponsorsJSON:', sponsorsJSON);
        
        formData.append('speakers_json', speakersJSON);
        formData.append('faqs_json', faqsJSON);
        formData.append('sponsors_json', sponsorsJSON);
        
        // Handle contact info properly
        const contactInfo = {
            email: formData.get('contactEmail'),
            phone: formData.get('contactPhone'),
            website: formData.get('contactWebsite')
        };
        formData.append('contactInfo', JSON.stringify(contactInfo));
        
        // Handle category selection
        const category = formData.get('category') === 'other' ? formData.get('customCategory') : formData.get('category');
        formData.set('category', category);
        
        try {
            const response = await fetch(`/events/${formData.get('eventId')}`, {
                method: 'PUT',
                credentials: 'include',
                body: formData // Send FormData directly, no Content-Type header needed
            });
            
            if (response.ok) {
                alert('Event changes submitted successfully! Your changes will be reviewed by an admin.');
                window.location.href = 'organizer.html';
            } else {
                const error = await response.json();
                alert(`Failed to save changes: ${error.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error saving changes:', error);
            alert('An error occurred while saving changes. Please try again.');
        }
    }
    
    function collectSpeakers() {
        const speakersMap = {};
        const speakerInputs = document.querySelectorAll('[name^="speakers["]');
        
        console.log('Found speaker inputs:', speakerInputs.length);
        
        speakerInputs.forEach((input) => {
            const match = input.name.match(/speakers\[(\d+)\]\[(\w+)\]/);
            if (match) {
                const [, speakerIndex, field] = match;
                if (!speakersMap[speakerIndex]) speakersMap[speakerIndex] = {};
                speakersMap[speakerIndex][field] = input.value;
                console.log(`Speaker ${speakerIndex}.${field}:`, input.value);
            }
        });
        
        // Convert to array and filter
        const result = Object.values(speakersMap).filter(speaker => speaker && speaker.name);
        console.log('Final speakers result:', result);
        return result;
    }
    
    function collectFaqs() {
        const faqsMap = {};
        const faqInputs = document.querySelectorAll('[name^="faqs["]');
        
        console.log('Found FAQ inputs:', faqInputs.length);
        
        faqInputs.forEach((input) => {
            const match = input.name.match(/faqs\[(\d+)\]\[(\w+)\]/);
            if (match) {
                const [, faqIndex, field] = match;
                if (!faqsMap[faqIndex]) faqsMap[faqIndex] = {};
                faqsMap[faqIndex][field] = input.value;
                console.log(`FAQ ${faqIndex}.${field}:`, input.value);
            }
        });
        
        // Convert to array and filter
        const result = Object.values(faqsMap).filter(faq => faq && faq.question);
        console.log('Final FAQs result:', result);
        return result;
    }
    
    function collectSponsors() {
        const sponsorsMap = {};
        const sponsorInputs = document.querySelectorAll('[name^="sponsors["]');
        
        console.log('Found sponsor inputs:', sponsorInputs.length);
        
        sponsorInputs.forEach((input) => {
            const match = input.name.match(/sponsors\[(\d+)\]\[(\w+)\]/);
            if (match) {
                const [, sponsorIndex, field] = match;
                if (!sponsorsMap[sponsorIndex]) sponsorsMap[sponsorIndex] = {};
                sponsorsMap[sponsorIndex][field] = input.value;
                console.log(`Sponsor ${sponsorIndex}.${field}:`, input.value);
            }
        });
        
        // Convert to array and filter
        const result = Object.values(sponsorsMap).filter(sponsor => sponsor && sponsor.name);
        console.log('Final sponsors result:', result);
        return result;
    }
    
    // Load categories dynamically for edit form
    async function loadEditCategories() {
        const categorySelect = document.getElementById('eventCategory');
        if (categorySelect && typeof CategoryManager !== 'undefined') {
            // Get the "Other" option to preserve it
            const otherOption = categorySelect.querySelector('option[value="other"]');
            
            // Populate with categories but don't add "All Categories" option
            await CategoryManager.populateSelect(categorySelect, '', false);
            
            // Re-add the "Other" option at the end
            if (otherOption) {
                categorySelect.appendChild(otherOption);
            }
        }
    }
});

// Global functions for removing dynamic content
function removeSpeaker(button) {
    button.closest('.border').remove();
}

function removeFaq(button) {
    button.closest('.border').remove();
}

function removeSponsor(button) {
    button.closest('.border').remove();
}

function removeGalleryImage(button) {
    button.closest('.relative').remove();
}
