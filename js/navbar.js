/**
 * Navbar Module
 * Handles the navbar functionality including username display
 */

// Update username in navbar
export function updateNavbarUsername() {
  const usernameElement = document.getElementById('navbar-username');
  if (!usernameElement) return;

  const storedUsername = localStorage.getItem('username');
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  
  // Update avatar initial
  updateAvatarInitial(storedUsername);
  
  // Update username
  if (storedUsername && isLoggedIn) {
    usernameElement.textContent = storedUsername;
  } else {
    usernameElement.textContent = isLoggedIn ? 'User' : 'Guest';
  }
  
  // Update status indicator
  updateUserStatus(isLoggedIn);
  
  // Add/remove logged-in class
  const usernameDisplay = document.querySelector('.username-display');
  if (usernameDisplay) {
    if (isLoggedIn) {
      usernameDisplay.classList.add('logged-in');
    } else {
      usernameDisplay.classList.remove('logged-in');
    }
  }
}

// Update avatar initial
function updateAvatarInitial(username) {
  const avatarElement = document.getElementById('avatar-initial');
  if (!avatarElement) return;
  
  if (username && username.length > 0) {
    avatarElement.textContent = username.charAt(0).toUpperCase();
  } else {
    avatarElement.textContent = 'G'; // G for Guest
  }
}

// Update user status indicator
function updateUserStatus(isLoggedIn) {
  const statusElement = document.querySelector('.user-status');
  if (!statusElement) return;
  
  // Remove all status classes
  statusElement.classList.remove('online', 'offline', 'guest');
  
  if (isLoggedIn) {
    statusElement.classList.add('online');
  } else {
    statusElement.classList.add('guest');
  }
}

// Add click handler to username display
export function setupUsernameDisplayClickHandler() {
  const usernameDisplay = document.querySelector('.username-display');
  if (usernameDisplay) {
    usernameDisplay.addEventListener('click', () => {
      if (localStorage.getItem('isLoggedIn') === 'true') {
        window.location.href = 'account.html';
      } else {
        window.location.href = 'sign-in.html?redirectTo=account.html';
      }
    });
  }
}

// Show or hide logout link based on login status
export function updateLogoutLinkVisibility() {
  const logoutLink = document.getElementById('logout-link');
  if (logoutLink) {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    logoutLink.style.display = isLoggedIn ? 'inline-block' : 'none';
  }
}

// Initialize navbar functionality
export function initNavbar() {
  updateNavbarUsername();
  setupUsernameDisplayClickHandler();
  updateLogoutLinkVisibility();
  
  // Add listener for authentication changes
  window.addEventListener('storage', (event) => {
    if (event.key === 'isLoggedIn' || event.key === 'username') {
      updateNavbarUsername();
      updateLogoutLinkVisibility();
    }
  });
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', initNavbar);