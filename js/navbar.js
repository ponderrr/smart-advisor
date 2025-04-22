/**
 * Navbar Module
 * Handles the navbar functionality including username display and profile pictures
 */

import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase-config.js";

// Update username in navbar
export async function updateNavbarUsername() {
  const usernameElement = document.getElementById('navbar-username');
  if (!usernameElement) return;

  const storedUsername = localStorage.getItem('username');
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  
  // Update avatar
  await updateNavbarAvatar(isLoggedIn);
  
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

// Update avatar in navbar
async function updateNavbarAvatar(isLoggedIn) {
  const avatarElement = document.getElementById('avatar-initial');
  const userAvatar = document.querySelector('.user-avatar');
  
  if (!avatarElement || !userAvatar) return;
  
  // Remove any existing avatar images
  const existingImg = userAvatar.querySelector('img');
  if (existingImg) {
    existingImg.remove();
  }
  
  if (!isLoggedIn) {
    // Show guest initial
    avatarElement.style.display = 'block';
    avatarElement.textContent = 'G';
    return;
  }
  
  // Try to get profile picture URL from localStorage first
  let profilePictureURL = localStorage.getItem('profilePictureURL');
  
  // If not in localStorage, try to fetch from database
  if (!profilePictureURL) {
    try {
      const userId = auth.currentUser?.uid || localStorage.getItem('userId');
      if (userId) {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          profilePictureURL = userData.profilePictureURL;
          
          // Cache in localStorage for future use
          if (profilePictureURL) {
            localStorage.setItem('profilePictureURL', profilePictureURL);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching profile picture:', error);
    }
  }
  
  if (profilePictureURL) {
    // Create and add image element
    avatarElement.style.display = 'none';
    
    const img = document.createElement('img');
    img.src = profilePictureURL;
    img.alt = 'Profile';
    
    userAvatar.appendChild(img);
  } else {
    // Show initial based on username
    const username = localStorage.getItem('username') || '';
    
    avatarElement.style.display = 'block';
    avatarElement.textContent = username.charAt(0).toUpperCase() || 'U';
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
    if (event.key === 'isLoggedIn' || event.key === 'username' || event.key === 'profilePictureURL') {
      updateNavbarUsername();
      updateLogoutLinkVisibility();
    }
  });
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', initNavbar);