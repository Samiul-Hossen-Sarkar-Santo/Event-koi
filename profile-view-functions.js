function updateProfileViewDisplay(user) {
    // Basic Information Display
    const nameDisplay = document.getElementById('profile-name-display');
    const usernameDisplay = document.getElementById('profile-username-display');
    const emailDisplay = document.getElementById('profile-email-display');
    const phoneDisplay = document.getElementById('profile-phone-display');
    
    if (nameDisplay) nameDisplay.textContent = user.name || '-';
    if (usernameDisplay) usernameDisplay.textContent = user.username || '-';
    if (emailDisplay) emailDisplay.textContent = user.email || '-';
    if (phoneDisplay) phoneDisplay.textContent = user.personalInfo?.contactDetails?.phone || 'Not provided';

    // Academic Information Display
    const universityDisplay = document.getElementById('profile-university-display');
    const yearDisplay = document.getElementById('profile-year-display');
    const addressDisplay = document.getElementById('profile-address-display');
    
    if (universityDisplay) universityDisplay.textContent = user.university || user.personalInfo?.universityOrganization || 'Not provided';
    if (yearDisplay) yearDisplay.textContent = user.yearOfStudy || 'Not provided';
    if (addressDisplay) addressDisplay.textContent = user.personalInfo?.contactDetails?.address || 'Not provided';

    // Personal Details Display
    const bioDisplay = document.getElementById('profile-bio-display');
    const skillsDisplay = document.getElementById('profile-skills-display');
    const interestsDisplay = document.getElementById('profile-interests-display');
    const tshirtDisplay = document.getElementById('profile-tshirt-display');
    
    if (bioDisplay) bioDisplay.textContent = user.bio || 'Not provided';
    if (tshirtDisplay) tshirtDisplay.textContent = user.personalInfo?.tShirtSize || 'Not provided';

    // Skills tags display
    if (skillsDisplay) {
        const skills = user.skills || user.personalInfo?.skills || [];
        if (skills.length > 0) {
            skillsDisplay.innerHTML = skills.map(skill => 
                `<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">${skill}</span>`
            ).join('');
        } else {
            skillsDisplay.innerHTML = '<span class="text-gray-500">No skills added</span>';
        }
    }

    // Interests tags display
    if (interestsDisplay) {
        const interests = user.interests || [];
        if (interests.length > 0) {
            interestsDisplay.innerHTML = interests.map(interest => 
                `<span class="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">${interest}</span>`
            ).join('');
        } else {
            interestsDisplay.innerHTML = '<span class="text-gray-500">No interests added</span>';
        }
    }

    // Notification preferences display
    const emailNotifDisplay = document.getElementById('notifications-email-display');
    const remindersDisplay = document.getElementById('notifications-reminders-display');
    const digestDisplay = document.getElementById('notifications-digest-display');
    
    if (emailNotifDisplay) emailNotifDisplay.textContent = user.notifications?.email !== false ? 'Enabled' : 'Disabled';
    if (remindersDisplay) remindersDisplay.textContent = user.notifications?.eventReminders !== false ? 'Enabled' : 'Disabled';
    if (digestDisplay) digestDisplay.textContent = user.notifications?.weeklyDigest === true ? 'Enabled' : 'Disabled';

    // Profile picture display
    updateProfilePictureDisplay(user);
}

function updateProfilePictureDisplay(user) {
    const profilePictureDisplay = document.getElementById('profile-picture-display');
    const profilePictureImgDisplay = document.getElementById('profile-picture-img-display');
    const profileInitialDisplay = document.getElementById('profile-initial-display');
    
    if (user.profilePicture) {
        if (profilePictureImgDisplay) {
            profilePictureImgDisplay.src = user.profilePicture;
            profilePictureImgDisplay.classList.remove('hidden');
        }
        if (profilePictureDisplay) profilePictureDisplay.classList.add('hidden');
    } else {
        if (profilePictureImgDisplay) profilePictureImgDisplay.classList.add('hidden');
        if (profilePictureDisplay) profilePictureDisplay.classList.remove('hidden');
        if (profileInitialDisplay) {
            profileInitialDisplay.textContent = (user.name || user.username).charAt(0).toUpperCase();
        }
    }
}
