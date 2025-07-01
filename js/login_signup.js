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
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) { // Added async
            e.preventDefault();

            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            try {
                const response = await fetch('/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password }),
                    credentials: 'include' // Include cookies for session
                });

                if (response.ok) {
                    const user = await response.json();
                    // Store user info and role in localStorage (or a more secure method)
                    localStorage.setItem('user', JSON.stringify(user)); // Store user object
                    if (user.role === 'admin') {
                        localStorage.setItem('adminSession', 'true');
                        window.location.href = 'admin.html';
                    } else if (user.role === 'organizer') {
                        localStorage.setItem('organizerSession', 'true');
                        window.location.href = 'organizer.html';
                    } else { // Default to user
                        localStorage.setItem('userSession', 'true');
                        window.location.href = 'user.html';
                    }
                } else {
                    const errorData = await response.json();
                    alert(`Login failed: ${errorData.message || response.statusText}`);
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('An error occurred during login. Please try again.');
            }
        });
    }

    const signupFormElement = document.getElementById('signupForm');
    if (signupFormElement) {
        signupFormElement.addEventListener('submit', async function(e) { // Added async
            e.preventDefault();

            // Basic validation for the current step before collecting data
             if (!validateStep(currentStep)) {
                 return; // Stop if validation fails
             }

            const fullName = document.getElementById('full-name').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();
            const institution = document.getElementById('institution').value.trim();
            const organizationName = document.getElementById('organization-name').value.trim();
            const termsChecked = document.getElementById('terms').checked;

            // Determine the role based on the selected role button
            // We need to find the currently active role button
             let role = 'participant'; // Default role
             const activeRoleButton = document.querySelector('.role-btn.active');
             if(activeRoleButton) {
                 role = activeRoleButton.dataset.role;
             }


            if (!termsChecked) {
                 alert('You must agree to the Terms & Policy.');
                 return;
             }

            const userData = {
                username: fullName, // Assuming username is full name for now
                email: email,
                password: password,
                role: role,
                // Add role-specific fields
                ...(role === 'participant' && { institution: institution }),
                ...(role === 'organizer' && { organizationName: organizationName }) // Backend schema needs organizationName
            };


            try {
                const response = await fetch('/auth/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData),
                    credentials: 'include' // Include cookies if session is established after signup
                });

                if (response.ok) {
                    const newUser = await response.json();
                    alert('Signup successful! You can now log in.');
                    // Optionally, automatically log in the user and redirect
                    // For now, we'll just redirect to the login page
                    toggleMainView('login'); // Switch back to login form
                    signupFormElement.reset(); // Reset the signup form
                    currentStep = 1; // Reset signup steps
                    showStep(currentStep);


                } else {
                    const errorData = await response.json();
                    alert(`Signup failed: ${errorData.message || response.statusText}`);
                }
            } catch (error) {
                console.error('Signup error:', error);
                alert('An error occurred during signup. Please try again.');
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
             const activeRoleButton = document.querySelector('.role-btn.active');
             const role = activeRoleButton ? activeRoleButton.dataset.role : 'participant'; // Default to participant if somehow no button is active

            if (role === 'organizer' && !document.getElementById('organization-name').value.trim()) {
                alert('Please enter your organization name.');
                return false;
            }
            // The terms agreement is checked in the form submission handler before sending data
            // but you could add a check here for immediate feedback if needed.
        }
        return true;
    }

     // Initialize the first step on page load
    showStep(currentStep);
});
