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
    let selectedRole = 'user'; // Default role - changed from 'participant' to 'user'

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
            const isUser = selectedRole === 'user';
            participantFields.classList.toggle('hidden', !isUser);
            organizerFields.classList.toggle('hidden', isUser);
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
                    
                    // Handle banned users specially
                    if (response.status === 403 && errorData.accountStatus === 'banned') {
                        showBanAppealForm(email, errorData);
                    } else {
                        alert(`Login failed: ${errorData.message || response.statusText}`);
                    }
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
             let role = 'user'; // Default role - changed from 'participant' to 'user'
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
                ...(role === 'user' && { institution: institution }),
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
             const role = activeRoleButton ? activeRoleButton.dataset.role : 'user'; // Default to user if somehow no button is active

            if (role === 'organizer' && !document.getElementById('organization-name').value.trim()) {
                alert('Please enter your organization name.');
                return false;
            }
            // The terms agreement is checked in the form submission handler before sending data
            // but you could add a check here for immediate feedback if needed.
        }
        return true;
    }
    
    /**
     * Shows ban appeal form for banned users
     * @param {string} email - User's email
     * @param {object} banData - Ban information from server
     */
    function showBanAppealForm(email, banData) {
        // Create modal backdrop
        const modalBackdrop = document.createElement('div');
        modalBackdrop.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modalBackdrop.id = 'banAppealModal';
        
        // Create modal content
        modalBackdrop.innerHTML = `
            <div class="bg-white rounded-lg p-8 max-w-md mx-4 w-full">
                <div class="text-center mb-6">
                    <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                        <i class="fas fa-ban text-red-600 text-xl"></i>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900">Account Banned</h3>
                    <p class="mt-2 text-sm text-gray-500">
                        Your account has been banned for: ${banData.reason}
                    </p>
                    ${banData.bannedAt ? `<p class="text-xs text-gray-400 mt-1">Banned on: ${new Date(banData.bannedAt).toLocaleDateString()}</p>` : ''}
                </div>
                
                <form id="banAppealForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Why should your ban be lifted? *
                        </label>
                        <select id="appealReason" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="">Select a reason</option>
                            <option value="misunderstanding">This was a misunderstanding</option>
                            <option value="learned_lesson">I've learned from my mistake</option>
                            <option value="false_accusation">I believe this was a false accusation</option>
                            <option value="account_compromised">My account was compromised</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Please explain your situation *
                        </label>
                        <textarea id="appealDetails" required rows="4" 
                                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                                  placeholder="Provide a detailed explanation of why you believe the ban should be lifted..."></textarea>
                    </div>
                    
                    <div class="flex justify-end space-x-3 pt-4">
                        <button type="button" onclick="closeBanAppealModal()" 
                                class="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                            Cancel
                        </button>
                        <button type="submit" 
                                class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                            Submit Appeal
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modalBackdrop);
        document.body.style.overflow = 'hidden';
        
        // Handle form submission
        document.getElementById('banAppealForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const reason = document.getElementById('appealReason').value;
            const details = document.getElementById('appealDetails').value;
            
            if (!reason || !details.trim()) {
                alert('Please fill in all required fields.');
                return;
            }
            
            try {
                const response = await fetch('/auth/appeal-ban', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email,
                        reason: reason,
                        details: details.trim()
                    })
                });
                
                if (response.ok) {
                    alert('Your appeal has been submitted successfully. An admin will review your case and contact you via email.');
                    closeBanAppealModal();
                } else {
                    const error = await response.json();
                    alert(`Failed to submit appeal: ${error.message}`);
                }
            } catch (error) {
                console.error('Error submitting appeal:', error);
                alert('An error occurred while submitting your appeal. Please try again.');
            }
        });
    }
    
    // Global function to close ban appeal modal
    window.closeBanAppealModal = function() {
        const modal = document.getElementById('banAppealModal');
        if (modal) {
            modal.remove();
            document.body.style.overflow = 'auto';
        }
    };

    // Initialize the first step on page load
    showStep(currentStep);
});
