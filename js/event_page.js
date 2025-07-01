// This script contains the interactive logic for the event details page.

// --- FAQ Toggle Functionality ---
// Handles the accordion-style opening and closing of FAQ items.
document.querySelectorAll('.faq-toggle').forEach(button => {
    button.addEventListener('click', () => {
        const content = button.nextElementSibling;
        const icon = button.querySelector('i');
        
        // Check if the content is currently hidden
        const isHidden = content.classList.contains('hidden');

        // Close all other FAQ items first for a cleaner accordion effect
        document.querySelectorAll('.faq-content').forEach(item => {
            if (item !== content) {
                item.classList.add('hidden');
                item.previousElementSibling.querySelector('i').classList.remove('rotate-180');
            }
        });

        // Toggle the clicked FAQ item
        if (isHidden) {
            content.classList.remove('hidden');
            icon.classList.add('rotate-180');
        } else {
            content.classList.add('hidden');
            icon.classList.remove('rotate-180');
        }
    });
});

// --- Countdown Timer ---
// Calculates and displays the time remaining until the event starts.
function updateCountdown() {
    // NOTE: The event date is in the past. This will show that the event has started.
    // To test with a future date, change the string below.
    const eventDate = new Date('October 12, 2023 09:00:00').getTime();
    const now = new Date().getTime();
    const distance = eventDate - now;
    
    const countdownEl = document.getElementById('countdown');

    // If the countdown is finished, display a message.
    if (distance < 0) {
        if (countdownEl) {
            countdownEl.innerHTML = "<div class='text-2xl font-bold'>EVENT HAS STARTED!</div>";
        }
        return; // Stop the function here
    }

    // Calculate days, hours, minutes, and seconds
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    
    // Update the countdown display with the calculated values
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
        `;
    }
}

// Initial call to display the countdown immediately on page load.
updateCountdown();
// Set the countdown to update every minute (60000 milliseconds).
setInterval(updateCountdown, 60000);

// --- Smooth Scrolling for Anchor Links ---
// Enables smooth navigation to page sections (e.g., the registration form).
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        // Do nothing if the link is just a placeholder '#'
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});
