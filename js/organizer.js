// This script handles the interactive elements on the organizer dashboard.

document.addEventListener('DOMContentLoaded', function() {
    
    // --- Main Tab Switching (My Events, Analytics, etc.) ---
    const mainTabButtons = document.querySelectorAll('.org-tab-btn');
    const mainTabContents = document.querySelectorAll('.org-tab-content');

    mainTabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-org-tab');
            
            mainTabButtons.forEach(button => button.classList.remove('active-tab'));
            this.classList.add('active-tab');
            
            mainTabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
            
            // Initialize charts only when the analytics tab is active
            if (tabId === 'analytics') {
                initCharts();
            }
        });
    });

    // --- Nested Event Management Tab Switching (Active, Pending, etc.) ---
    const eventMgmtTabButtons = document.querySelectorAll('.event-mgmt-tab-btn');
    const eventMgmtTabContents = document.querySelectorAll('.event-mgmt-tab-content');

    eventMgmtTabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const eventTabId = this.getAttribute('data-event-mgmt-tab');
            
            eventMgmtTabButtons.forEach(button => {
                button.classList.remove('text-purple-600', 'border-purple-600');
                button.classList.add('text-gray-500', 'hover:text-purple-600');
            });
            this.classList.add('text-purple-600', 'border-purple-600');
            this.classList.remove('text-gray-500');
            
            eventMgmtTabContents.forEach(content => {
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
        logoutBtn.addEventListener('click', function() {
            alert('You have been logged out.');
        });
    }

    // --- Chart.js Initialization for Analytics ---
    let chartsInitialized = false;
    function initCharts() {
        if (chartsInitialized) return; // Prevent re-initialization
        chartsInitialized = true;

        // Chart 1: Registration Count (Doughnut)
        new Chart(document.getElementById('registrationChart'), {
            type: 'doughnut',
            data: {
                labels: ['Registered', 'Remaining Spots'],
                datasets: [{
                    data: [142, 358], // 142 registered, 500 total
                    backgroundColor: ['#8b5cf6', '#e5e7eb'],
                    borderColor: ['#fff', '#fff'],
                    borderWidth: 2
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, cutout: '70%' }
        });

        // Chart 2: University Demographics (Pie)
        new Chart(document.getElementById('universityChart'), {
            type: 'pie',
            data: {
                labels: ['State University', 'Tech Institute', 'City College', 'Other'],
                datasets: [{
                    data: [60, 45, 25, 12],
                    backgroundColor: ['#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'],
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        // Chart 3: Skills (Bar)
        new Chart(document.getElementById('skillsChart'), {
            type: 'bar',
            data: {
                labels: ['Python', 'JavaScript', 'UX/UI', 'Marketing', 'Data Science'],
                datasets: [{
                    label: 'Attendee Skills',
                    data: [80, 75, 50, 45, 65],
                    backgroundColor: '#8b5cf6',
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y' }
        });

        // Chart 4: Registration Timeline (Line)
        new Chart(document.getElementById('timelineChart'), {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Registrations per Week',
                    data: [20, 45, 78, 142],
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
});
