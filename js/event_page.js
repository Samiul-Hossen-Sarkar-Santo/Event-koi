document.addEventListener('DOMContentLoaded', function() {

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
         // Add seconds for more precise initial display, though updating every minute is fine for the interval
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
                    const eventDateTimeString = `${event.date}T${event.time}`; // Assuming date and time are in compatible formats
                    updateCountdown(eventDateTimeString);
                    // Update countdown every minute
                     clearInterval(countdownInterval); // Clear any existing interval
                    countdownInterval = setInterval(() => updateCountdown(eventDateTimeString), 60000);
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
                 if(mainContent) {
                    mainContent.innerHTML = `<div class="container mx-auto px-4 py-16 text-center"><h1 class="text-3xl font-bold text-red-600 mb-4">Error Loading Event</h1><p class="text-gray-700">${errorData.message || 'An error occurred while fetching event details.'}</p></div>`;
                 }
            }
        } catch (error) {
            console.error('Error fetching event:', error);
            const mainContent = document.querySelector('body');
             if(mainContent) {
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
        const heroSection = document.querySelector('.event-hero');
         if (heroSection && event.coverImage) {
            // Assuming coverImage is a URL
            heroSection.style.backgroundImage = `url('${event.coverImage}')`;
            heroSection.style.backgroundSize = 'cover';
            heroSection.style.backgroundPosition = 'center';
         }
         const eventTitleEl = heroSection.querySelector('h1');
         if(eventTitleEl) eventTitleEl.textContent = event.title || 'Event Details';

         const eventDescriptionEl = heroSection.querySelector('p.text-xl'); // Targeting the description below the title
         if(eventDescriptionEl) eventDescriptionEl.textContent = event.description || '';


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
                    const eventDateTime = new Date(`${event.date}T${event.time}`);
                     dateTimeEl.innerHTML = `<div class="font-semibold">Date & Time</div><div class="text-gray-600">${eventDateTime.toLocaleString()}</div>`;
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
                         <div class="bg-indigo-600 h-2.5 rounded-full" style="width: ${ (currentAttendees / totalCapacity) * 100}%"></div>
                     </div>
                     ` : ''}
                  `;
              }


        }

        // Update Prize Information
        const prizesSection = document.querySelector('.py-16.bg-white .grid.grid-cols-1.md\\:grid-cols-3.gap-4'); // Targeting the prize cards container
         if (prizesSection && event.prizeInfo) { // Assuming event.prizeInfo is a string with prize details
            prizesSection.innerHTML = `<div class="bg-indigo-50 p-4 rounded-lg border border-indigo-100"><div class="text-gray-800">${event.prizeInfo.replace(/\n/g, '<br>')}</div></div>`; // Simple display
            // For more structured prizes, you'd loop through a prizes array if your schema supported it
         } else if (prizesSection) {
             prizesSection.innerHTML = ''; // Clear dummy content if no prize info
         }


        // Update Rules & Regulations (Assuming event.rules is a string with rules separated by newlines)
        const rulesSection = document.querySelector('.prose.max-w-none.text-gray-700 ol.list-decimal'); // Targeting the ordered list for rules
         if (rulesSection && event.rules) { // Assuming event.rules is a string with rules
            const rulesListItems = event.rules.split('\n').map(rule => `<li>${rule}</li>`).join('');
             rulesSection.innerHTML = rulesListItems;
         } else if (rulesSection) {
             rulesSection.innerHTML = ''; // Clear dummy content if no rules
         }


        // Note: You'd need similar logic to populate Schedule, Speakers, Gallery, FAQ, and Sponsors sections
        // based on how that data is structured in your Event schema and provided by the backend.
        // The current schema is basic, so these sections will require more complex data structures
        // and corresponding frontend logic to display them dynamically.

        // Update Registration Section (Link or Platform)
        const registerButton = document.querySelector('#register .bg-indigo-600'); // The Register Now button
        const registrationFormContainer = document.querySelector('#register form'); // The registration form

         if (event.registrationMethod === 'external' && event.externalLink) {
            // If external link, change the button to a link and potentially hide the form
            if (registerButton) {
                registerButton.textContent = 'Register on External Site';
                registerButton.href = event.externalLink;
                 // Add the external link warning modal logic here if you want to use it for this button too
                 registerButton.addEventListener('click', function(e) {
                    e.preventDefault(); // Prevent default link behavior
                    showExternalLinkModal(event.externalLink); // Show the warning modal
                 });
            }
             if (registrationFormContainer) {
                 registrationFormContainer.classList.add('hidden'); // Hide the internal form
             }

         } else {
            // If platform-based registration, ensure the button is a submit button and form is visible
            if (registerButton) {
                 registerButton.textContent = 'Register Now';
                 registerButton.href = '#'; // Or a link to the platform registration form/modal
                 // Remove any click listeners for external links
                 const newRegisterButton = registerButton.cloneNode(true); // Clone to remove event listeners
                 registerButton.parentNode.replaceChild(newRegisterButton, registerButton);
            }
             if (registrationFormContainer) {
                 registrationFormContainer.classList.remove('hidden'); // Show the internal form
             }
            // You'd need to implement the platform-based registration form submission here
         }

         // Update Register Now button's anchor
         const heroRegisterButton = document.querySelector('.event-hero a.animate-pulse');
         if (heroRegisterButton) {
            heroRegisterButton.href = '#register'; // Link to the registration section
         }


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

});
