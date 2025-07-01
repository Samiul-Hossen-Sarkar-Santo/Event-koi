document.addEventListener('DOMContentLoaded', function() {
    // --- Main Form Toggle Elements ---
    const loginToggle = document.getElementById('login-toggle');
    const signupToggle = document.getElementById('signup-toggle');
    const loginFormContainer = document.getElementById('login-form');
    const signupContainer = document.getElementById('signup-container');
    const switchToLogin = document.getElementById('switch-to-login');

    // --- Signup Multi-step Elements ---
    const signupForm = document.getElementById('signupForm');
    const steps = document.querySelectorAll('.signup-step');
    const progressBar = document.getElementById('progress-bar');
    const nextButtons = document.querySelectorAll('.next-btn');
    const backButtons = document.querySelectorAll('.back-btn');
    
    // --- Role Selection Elements ---
    const roleButtons = document.querySelectorAll('.role-btn');
    const participantFields = document.getElementById('participant-fields');
    const organizerFields = document.getElementById('organizer-fields');

    // --- Password Visibility Toggle Elements ---
    const toggleLoginPassword = document.getElementById('toggle-login-password');
    const loginPassword = document.getElementById('login-password');
    const toggleSignupPassword = document.getElementById('toggle-signup-password');
    const signupPassword = document.getElementById('password');

    let currentStep = 1;
    let selectedRole = 'participant'; // Default role

    /**
     * Updates the UI to show the correct step in the signup form.
     * @param {number} stepNumber - The step to display.
     */
    function showStep(stepNumber) {
        steps.forEach(step => step.classList.remove('active'));
        document.getElementById(`step-${stepNumber}`).classList.add('active');
        
        // Update progress bar
        const progress = (stepNumber / steps.length) * 100;
        progressBar.style.width = `${progress}%`;
    }

    /**
     * Toggles between the main Login and Signup views.
     * @param {'login' | 'signup'} viewToShow - The view to display.
     */
    function toggleMainView(viewToShow) {
        const isLogin = viewToShow === 'login';
        
        loginFormContainer.classList.toggle('active', isLogin);
        signupContainer.classList.toggle('active', !isLogin);
        
        loginToggle.classList.toggle('active', isLogin);
        signupToggle.classList.toggle('active', !isLogin);

        // Reset signup form to step 1 if switching away
        if (isLogin) {
            currentStep = 1;
            showStep(currentStep);
        }
    }

    // --- Event Listeners ---

    loginToggle.addEventListener('click', () => toggleMainView('login'));
    signupToggle.addEventListener('click', () => toggleMainView('signup'));
    switchToLogin.addEventListener('click', () => toggleMainView('login'));

    // Handle "Next" button clicks in the signup form
    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (validateStep(currentStep) && currentStep < steps.length) {
                currentStep++;
                showStep(currentStep);
            }
        });
    });

    // Handle "Back" button clicks in the signup form
    backButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (currentStep > 1) {
                currentStep--;
                showStep(currentStep);
            }
        });
    });

    // Handle Role Selection
    roleButtons.forEach(button => {
        button.addEventListener('click', () => {
            selectedRole = button.dataset.role;
            
            roleButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Show/hide role-specific fields for Step 3
            const isParticipant = selectedRole === 'participant';
            participantFields.classList.toggle('hidden', !isParticipant);
            organizerFields.classList.toggle('hidden', isParticipant);
        });
    });

    // --- Password Visibility Toggle Logic ---
    function setupPasswordToggle(toggleElement, passwordElement) {
        if (toggleElement && passwordElement) {
            toggleElement.addEventListener('click', function() {
                const type = passwordElement.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordElement.setAttribute('type', type);
                this.classList.toggle('fa-eye');
                this.classList.toggle('fa-eye-slash');
            });
        }
    }
    setupPasswordToggle(toggleLoginPassword, loginPassword);
    setupPasswordToggle(toggleSignupPassword, signupPassword);

    // --- Form Submission Handlers ---
    const loginForm = document.getElementById('loginForm');
    if(loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Simulate login validation
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            if(email && password) {
                // Simulate different user types based on email
                if(email.includes('admin')) {
                    localStorage.setItem('adminSession', 'true');
                    window.location.href = 'admin.html';
                } else if(email.includes('organizer')) {
                    localStorage.setItem('organizerSession', 'true');
                    window.location.href = 'organizer.html';
                } else {
                    localStorage.setItem('userSession', 'true');
                    window.location.href = 'user.html';
                }
            }
        });
    }

    const signupFormElement = document.getElementById('signupForm');
    if(signupFormElement) {
        signupFormElement.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get the selected role
            const selectedRole = document.querySelector('input[name="role"]:checked');
            
            if(selectedRole) {
                const role = selectedRole.value;
                
                // Redirect based on role after successful signup
                if(role === 'organizer') {
                    localStorage.setItem('organizerSession', 'true');
                    window.location.href = 'organizer.html';
                } else {
                    localStorage.setItem('userSession', 'true');
                    window.location.href = 'user.html';
                }
            }
        });
    }

    /**
     * Validates the inputs for the current step of the signup form.
     * @param {number} step - The step number to validate.
     * @returns {boolean} - True if validation passes, false otherwise.
     */
    function validateStep(step) {
        if (step === 2) {
            const fullName = document.getElementById('full-name').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();
            if (!fullName || !email || !password) {
                alert('Please fill in all account information fields.');
                return false;
            }
            if (password.length < 8) {
                alert('Password must be at least 8 characters long.');
                return false;
            }
        }
        if (step === 3) {
            if (selectedRole === 'organizer' && !document.getElementById('organization-name').value.trim()) {
                alert('Please enter your organization name.');
                return false;
            }
            if (!document.getElementById('terms').checked) {
                alert('You must agree to the Terms & Policy.');
                return false;
            }
        }
        return true;
    }
});
