import { auth, db } from "./firebase-config.js";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

// Initialize Storage
const storage = getStorage();

// Initialize profile picture functionality
export function initProfilePicture() {
  console.log("Initializing profile picture functionality");
  
  // Settings profile picture buttons
  const settingsChangePictureBtn = document.getElementById('settings-change-picture-btn');
  const settingsRemovePictureBtn = document.getElementById('settings-remove-picture-btn');
  const settingsFileInput = document.getElementById('settings-profile-picture-upload');
  
  // Debug output for buttons
  console.log("Change button exists:", !!settingsChangePictureBtn);
  console.log("Remove button exists:", !!settingsRemovePictureBtn);
  console.log("File input exists:", !!settingsFileInput);
  
  // Handle settings picture buttons if elements exist
  if (settingsChangePictureBtn && settingsFileInput) {
    settingsChangePictureBtn.addEventListener('click', () => {
      console.log("Change button clicked");
      settingsFileInput.click();
    });
    
    settingsFileInput.addEventListener('change', (event) => {
      console.log("File selected:", event.target.files[0]?.name);
      handleFileSelect(event);
    });
  }
  
  if (settingsRemovePictureBtn) {
    settingsRemovePictureBtn.addEventListener('click', () => {
      console.log("Remove button clicked");
      removeProfilePicture();
    });
  }
  
  // Load current profile picture
  loadProfilePicture();
}

/**
 * Load the user's profile picture
 */
export async function loadProfilePicture() {
  try {
    console.log("Loading profile picture");
    
    const userId = auth.currentUser?.uid || localStorage.getItem('userId');
    if (!userId) {
      console.log("No user ID found");
      return;
    }

    // Try getting from localStorage first for faster loading
    const cachedUrl = localStorage.getItem('profilePictureURL');
    if (cachedUrl) {
      console.log("Using cached profile picture URL");
      updateProfilePictureElements(cachedUrl);
    }

    // Get profile document
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      console.log("User document not found");
      return;
    }

    const userData = userDoc.data();
    console.log("User data loaded, profile picture URL:", userData.profilePictureURL);
    
    // Check if user has a profile picture URL
    if (userData.profilePictureURL) {
      // Update all profile picture elements on the page
      updateProfilePictureElements(userData.profilePictureURL);
      
      // Update cache
      localStorage.setItem('profilePictureURL', userData.profilePictureURL);
    } else {
      // Use default avatar
      resetToDefaultAvatar();
    }
  } catch (error) {
    console.error('Error loading profile picture:', error);
    showPictureMessage('Error loading profile picture', true);
  }
}

/**
 * Handle file selection for profile picture
 * @param {Event} event - File input change event
 */
export async function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) {
    console.log("No file selected");
    return;
  }

  console.log("File selected:", file.name, file.type, file.size);
  
  // Show loading message
  showPictureMessage('Uploading picture...', false);

  try {
    // Validate file type
    if (!file.type.match('image.*')) {
      console.log("File is not an image");
      showPictureMessage('Please select an image file', true);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.log("File is too large");
      showPictureMessage('Image must be less than 5MB', true);
      return;
    }

    // Check dimensions and resize if necessary
    console.log("Resizing image if needed");
    const resizedImage = await resizeImageIfNeeded(file, 500, 500);
    
    // Upload to Firebase Storage
    console.log("Uploading to Firebase Storage");
    await uploadProfilePicture(resizedImage);

  } catch (error) {
    console.error('Error uploading profile picture:', error);
    showPictureMessage('Error uploading profile picture', true);
  }
}

/**
 * Resize image if it exceeds maximum dimensions
 * @param {File} file - Original image file
 * @param {number} maxWidth - Maximum width
 * @param {number} maxHeight - Maximum height
 * @returns {Promise<Blob>} - Resized image blob
 */
function resizeImageIfNeeded(file, maxWidth, maxHeight) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      const img = new Image();
      
      img.onload = function() {
        // Check if resizing is needed
        if (img.width <= maxWidth && img.height <= maxHeight) {
          console.log("No resizing needed");
          resolve(file); // No resizing needed
          return;
        }
        
        console.log("Resizing from", img.width, "x", img.height);
        
        // Calculate new dimensions while maintaining aspect ratio
        let newWidth, newHeight;
        if (img.width > img.height) {
          newWidth = maxWidth;
          newHeight = Math.floor(img.height * (maxWidth / img.width));
        } else {
          newHeight = maxHeight;
          newWidth = Math.floor(img.width * (maxHeight / img.height));
        }
        
        console.log("New dimensions:", newWidth, "x", newHeight);
        
        // Create canvas for resizing
        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        // Draw resized image on canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        
        // Convert canvas to blob
        canvas.toBlob((blob) => {
          console.log("Image resized to blob:", blob.size, "bytes");
          resolve(blob);
        }, file.type);
      };
      
      img.onerror = function() {
        console.error("Failed to load image");
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = function() {
      console.error("Failed to read file");
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Upload profile picture to Firebase Storage
 * @param {Blob} imageBlob - Image blob to upload
 */
async function uploadProfilePicture(imageBlob) {
  try {
    console.log("Starting upload to Firebase Storage");
    
    const userId = auth.currentUser?.uid || localStorage.getItem('userId');
    if (!userId) {
      console.error("No user ID found");
      showPictureMessage('Please log in to upload a profile picture', true);
      return;
    }
    
    // Create a storage reference
    const storageRef = ref(storage, `profile_pictures/${userId}`);
    console.log("Storage reference created");
    
    // Upload the file
    console.log("Uploading blob...");
    const snapshot = await uploadBytes(storageRef, imageBlob);
    console.log("Upload completed");
    
    // Get download URL
    console.log("Getting download URL...");
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log("Download URL:", downloadURL);
    
    // Update user document with profile picture URL
    console.log("Updating user document...");
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      profilePictureURL: downloadURL,
      profilePictureUpdated: new Date().toISOString()
    });
    console.log("User document updated");
    
    // Update profile picture elements
    updateProfilePictureElements(downloadURL);
    
    // Show success message
    showPictureMessage('Profile picture updated successfully!', false);
    
    // Update localStorage
    localStorage.setItem('profilePictureURL', downloadURL);
    
    console.log("Profile picture update complete");
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    showPictureMessage(`Error uploading profile picture: ${error.message}`, true);
  }
}

/**
 * Remove profile picture
 */
export async function removeProfilePicture() {
  try {
    console.log("Removing profile picture");
    
    const userId = auth.currentUser?.uid || localStorage.getItem('userId');
    if (!userId) {
      console.log("No user ID found");
      return;
    }
    
    // Show loading message
    showPictureMessage('Removing picture...', false);
    
    // Get user document to check if user has a profile picture
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      console.log("User document not found");
      return;
    }
    
    const userData = userDoc.data();
    if (!userData.profilePictureURL) {
      console.log("User has no profile picture to remove");
      showPictureMessage('No profile picture to remove', true);
      return;
    }
    
    // Delete from storage
    try {
      console.log("Deleting from storage");
      const storageRef = ref(storage, `profile_pictures/${userId}`);
      await deleteObject(storageRef);
      console.log("Deleted from storage");
    } catch (storageError) {
      console.warn('Storage object may not exist:', storageError);
      // Continue anyway - we still want to update the database
    }
    
    // Update user document
    console.log("Updating user document");
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      profilePictureURL: null,
      profilePictureUpdated: new Date().toISOString()
    });
    console.log("User document updated");
    
    // Reset to default avatar
    resetToDefaultAvatar();
    
    // Show success message
    showPictureMessage('Profile picture removed', false);
    
    // Update localStorage
    localStorage.removeItem('profilePictureURL');
    
    console.log("Profile picture removal complete");
  } catch (error) {
    console.error('Error removing profile picture:', error);
    showPictureMessage(`Error removing profile picture: ${error.message}`, true);
  }
}

/**
 * Update all profile picture elements on the page
 * @param {string} url - Profile picture URL
 */
export function updateProfilePictureElements(url) {
  console.log("Updating profile picture elements with URL:", url);
  
  // Update settings preview if it exists
  const settingsPreview = document.getElementById('settings-profile-preview');
  if (settingsPreview) {
    console.log("Updating settings preview");
    settingsPreview.src = url;
  }
  
  // Update navbar avatar
  updateNavbarAvatar(url);
}

/**
 * Update navbar avatar with profile picture
 * @param {string} url - Profile picture URL
 */
export function updateNavbarAvatar(url) {
  console.log("Updating navbar avatar");
  
  const avatarElement = document.getElementById('avatar-initial');
  const userAvatar = document.querySelector('.user-avatar');
  
  if (!avatarElement || !userAvatar) {
    console.log("Avatar elements not found");
    return;
  }
  
  // Remove any existing images
  const existingImg = userAvatar.querySelector('img');
  if (existingImg) {
    console.log("Removing existing image");
    existingImg.remove();
  }
  
  if (url) {
    console.log("Adding profile picture to avatar");
    // Create and add image element
    avatarElement.style.display = 'none';
    
    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Profile';
    img.onerror = () => {
      console.log("Profile image failed to load, showing initial");
      avatarElement.style.display = 'block';
      img.remove();
    };
    
    userAvatar.appendChild(img);
  } else {
    console.log("No URL provided, showing initial");
    // Show initial
    avatarElement.style.display = 'block';
  }
}

/**
 * Reset profile picture to default avatar
 */
function resetToDefaultAvatar() {
  console.log("Resetting to default avatar");
  
  // Update settings preview if it exists
  const settingsPreview = document.getElementById('settings-profile-preview');
  if (settingsPreview) {
    console.log("Resetting settings preview");
    settingsPreview.src = '/images/default-avatar.svg';
  }
  
  // Reset navbar avatar to show initial
  const avatarElement = document.getElementById('avatar-initial');
  const userAvatar = document.querySelector('.user-avatar');
  
  if (avatarElement && userAvatar) {
    console.log("Resetting navbar avatar");
    // Remove any existing images
    const existingImg = userAvatar.querySelector('img');
    if (existingImg) {
      existingImg.remove();
    }
    
    // Show initial
    avatarElement.style.display = 'block';
  }
}

/**
 * Show message in the profile picture section
 * @param {string} message - Message to display
 * @param {boolean} isError - Whether it's an error message
 */
function showPictureMessage(message, isError) {
  console.log(`Showing ${isError ? 'error' : 'success'} message:`, message);
  
  // Try settings section message
  const settingsSection = document.querySelector('.settings-section[data-section="profile-picture"]');
  if (settingsSection) {
    // Check if message container exists, create if not
    let sectionMessage = settingsSection.querySelector('.section-message');
    if (!sectionMessage) {
      console.log("Creating new section message element");
      sectionMessage = document.createElement('div');
      sectionMessage.className = 'section-message';
      
      // Insert at the top of the section content
      const sectionContent = settingsSection.querySelector('.section-content');
      if (sectionContent) {
        sectionContent.insertBefore(sectionMessage, sectionContent.firstChild);
      }
    }
    
    // Set message and class
    sectionMessage.textContent = message;
    sectionMessage.className = isError ? 
      'section-message error-message' : 
      'section-message success-message';
    
    // Auto-hide success messages after 5 seconds
    if (!isError) {
      setTimeout(() => {
        if (sectionMessage.parentNode && sectionMessage.textContent === message) {
          sectionMessage.remove();
        }
      }, 5000);
    }
  } else {
    console.log("Settings section not found");
  }
}

// Initialize profile picture functionality on DOM loaded
document.addEventListener('DOMContentLoaded', initProfilePicture);