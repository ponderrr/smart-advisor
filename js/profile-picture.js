import { supabase } from "./supabase-config.js";
import {
  updateProfilePictureURL,
  removeProfilePicture,
} from "./supabase-utils.js";

export function initProfilePicture() {
  console.log("Initializing profile picture functionality");

  const settingsChangePictureBtn = document.getElementById(
    "settings-change-picture-btn"
  );
  const settingsRemovePictureBtn = document.getElementById(
    "settings-remove-picture-btn"
  );
  const settingsFileInput = document.getElementById(
    "settings-profile-picture-upload"
  );

  console.log("Change button exists:", !!settingsChangePictureBtn);
  console.log("Remove button exists:", !!settingsRemovePictureBtn);
  console.log("File input exists:", !!settingsFileInput);

  if (settingsChangePictureBtn && settingsFileInput) {
    settingsChangePictureBtn.addEventListener("click", () => {
      console.log("Change button clicked");
      settingsFileInput.click();
    });

    settingsFileInput.addEventListener("change", (event) => {
      console.log("File selected:", event.target.files[0]?.name);
      handleFileSelect(event);
    });
  }

  if (settingsRemovePictureBtn) {
    settingsRemovePictureBtn.addEventListener("click", () => {
      console.log("Remove button clicked");
      removeProfilePictureHandler();
    });
  }

  loadProfilePicture();
}

export async function loadProfilePicture() {
  try {
    console.log("Loading profile picture");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.log("No user ID found");
      return;
    }

    const cachedUrl = localStorage.getItem("profilePictureURL");
    if (cachedUrl) {
      console.log("Using cached profile picture URL");
      updateProfilePictureElements(cachedUrl);
    }

    const { data, error } = await supabase
      .from("users")
      .select("profile_picture_url")
      .eq("id", user.id)
      .single();

    if (error) {
      console.log("Error fetching user profile:", error);
      return;
    }

    console.log(
      "User data loaded, profile picture URL:",
      data.profile_picture_url
    );

    if (data.profile_picture_url) {
      updateProfilePictureElements(data.profile_picture_url);

      localStorage.setItem("profilePictureURL", data.profile_picture_url);
    } else {
      resetToDefaultAvatar();
    }
  } catch (error) {
    console.error("Error loading profile picture:", error);
    showPictureMessage("Error loading profile picture", true);
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

  showPictureMessage("Uploading picture...", false);

  try {
    if (!file.type.match("image.*")) {
      console.log("File is not an image");
      showPictureMessage("Please select an image file", true);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      console.log("File is too large");
      showPictureMessage("Image must be less than 5MB", true);
      return;
    }

    console.log("Resizing image if needed");
    const resizedImage = await resizeImageIfNeeded(file, 500, 500);

    console.log("Uploading to Supabase Storage");
    await uploadProfilePicture(resizedImage);
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    showPictureMessage("Error uploading profile picture", true);
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

    reader.onload = function (e) {
      const img = new Image();

      img.onload = function () {
        if (img.width <= maxWidth && img.height <= maxHeight) {
          console.log("No resizing needed");
          resolve(file);
          return;
        }

        console.log("Resizing from", img.width, "x", img.height);

        let newWidth, newHeight;
        if (img.width > img.height) {
          newWidth = maxWidth;
          newHeight = Math.floor(img.height * (maxWidth / img.width));
        } else {
          newHeight = maxHeight;
          newWidth = Math.floor(img.width * (maxHeight / img.height));
        }

        console.log("New dimensions:", newWidth, "x", newHeight);

        const canvas = document.createElement("canvas");
        canvas.width = newWidth;
        canvas.height = newHeight;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        canvas.toBlob((blob) => {
          console.log("Image resized to blob:", blob.size, "bytes");
          resolve(blob);
        }, file.type);
      };

      img.onerror = function () {
        console.error("Failed to load image");
        reject(new Error("Failed to load image"));
      };

      img.src = e.target.result;
    };

    reader.onerror = function () {
      console.error("Failed to read file");
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Upload profile picture to Supabase Storage
 * @param {Blob} imageBlob - Image blob to upload
 */
async function uploadProfilePicture(imageBlob) {
  try {
    console.log("Starting upload to Supabase Storage");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.error("No user logged in");
      showPictureMessage("Please log in to upload a profile picture", true);
      return;
    }

    const fileName = `${user.id}_${Date.now()}.jpg`;
    const filePath = `profile_pictures/${fileName}`;

    console.log("Uploading blob...");
    const { data, error } = await supabase.storage
      .from("user-content")
      .upload(filePath, imageBlob, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) throw error;
    console.log("Upload completed");

    const { data: urlData } = supabase.storage
      .from("user-content")
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;
    console.log("Public URL:", publicUrl);

    console.log("Updating user profile...");
    await updateProfilePictureURL(user.id, publicUrl);

    updateProfilePictureElements(publicUrl);

    showPictureMessage("Profile picture updated successfully!", false);

    console.log("Profile picture update complete");
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    showPictureMessage(
      `Error uploading profile picture: ${error.message}`,
      true
    );
  }
}

async function removeProfilePictureHandler() {
  try {
    console.log("Removing profile picture");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.log("No user logged in");
      return;
    }

    showPictureMessage("Removing picture...", false);

    const { data, error } = await supabase
      .from("users")
      .select("profile_picture_url")
      .eq("id", user.id)
      .single();

    if (error) {
      console.log("Error fetching profile picture URL:", error);
      showPictureMessage("Error removing profile picture", true);
      return;
    }

    if (!data.profile_picture_url) {
      console.log("User has no profile picture to remove");
      showPictureMessage("No profile picture to remove", true);
      return;
    }

    const profilePictureUrl = data.profile_picture_url;
    let filePath = null;

    try {
      const url = new URL(profilePictureUrl);
      const pathMatch = url.pathname.match(/\/object\/user-content\/(.+)/);
      if (pathMatch && pathMatch[1]) {
        filePath = decodeURIComponent(pathMatch[1]);
        console.log("Extracted file path:", filePath);
      }
    } catch (e) {
      console.log("Could not parse profile picture URL:", e);
    }

    if (filePath) {
      try {
        const { error: storageError } = await supabase.storage
          .from("user-content")
          .remove([filePath]);

        if (storageError) {
          console.warn("Error deleting storage file:", storageError);
        } else {
          console.log("Deleted file from storage");
        }
      } catch (storageError) {
        console.warn("Storage object may not exist:", storageError);
      }
    }

    await removeProfilePicture(user.id);

    resetToDefaultAvatar();

    showPictureMessage("Profile picture removed", false);

    console.log("Profile picture removal complete");
  } catch (error) {
    console.error("Error removing profile picture:", error);
    showPictureMessage(
      `Error removing profile picture: ${error.message}`,
      true
    );
  }
}

/**
 * Update all profile picture elements on the page
 * @param {string} url - Profile picture URL
 */
export function updateProfilePictureElements(url) {
  console.log("Updating profile picture elements with URL:", url);

  const settingsPreview = document.getElementById("settings-profile-preview");
  if (settingsPreview) {
    console.log("Updating settings preview");
    settingsPreview.src = url;
  }

  updateNavbarAvatar(url);
}

/**
 * Update navbar avatar with profile picture
 * @param {string} url - Profile picture URL
 */
export function updateNavbarAvatar(url) {
  console.log("Updating navbar avatar");

  const avatarElement = document.getElementById("avatar-initial");
  const userAvatar = document.querySelector(".user-avatar");

  if (!avatarElement || !userAvatar) {
    console.log("Avatar elements not found");
    return;
  }

  const existingImg = userAvatar.querySelector("img");
  if (existingImg) {
    console.log("Removing existing image");
    existingImg.remove();
  }

  if (url) {
    console.log("Adding profile picture to avatar");
    avatarElement.style.display = "none";

    const img = document.createElement("img");
    img.src = url;
    img.alt = "Profile";
    img.onerror = () => {
      console.log("Profile image failed to load, showing initial");
      avatarElement.style.display = "block";
      img.remove();
    };

    userAvatar.appendChild(img);
  } else {
    console.log("No URL provided, showing initial");
    avatarElement.style.display = "block";
  }
}

function resetToDefaultAvatar() {
  console.log("Resetting to default avatar");

  const settingsPreview = document.getElementById("settings-profile-preview");
  if (settingsPreview) {
    console.log("Resetting settings preview");
    settingsPreview.src = "/images/default-avatar.svg";
  }

  const avatarElement = document.getElementById("avatar-initial");
  const userAvatar = document.querySelector(".user-avatar");

  if (avatarElement && userAvatar) {
    console.log("Resetting navbar avatar");
    const existingImg = userAvatar.querySelector("img");
    if (existingImg) {
      existingImg.remove();
    }

    avatarElement.style.display = "block";
  }
}

/**
 * Show message in the profile picture section
 * @param {string} message - Message to display
 * @param {boolean} isError - Whether it's an error message
 */
function showPictureMessage(message, isError) {
  console.log(`Showing ${isError ? "error" : "success"} message:`, message);

  const settingsSection = document.querySelector(
    '.settings-section[data-section="profile-picture"]'
  );
  if (settingsSection) {
    let sectionMessage = settingsSection.querySelector(".section-message");
    if (!sectionMessage) {
      console.log("Creating new section message element");
      sectionMessage = document.createElement("div");
      sectionMessage.className = "section-message";

      const sectionContent = settingsSection.querySelector(".section-content");
      if (sectionContent) {
        sectionContent.insertBefore(sectionMessage, sectionContent.firstChild);
      }
    }

    sectionMessage.textContent = message;
    sectionMessage.className = isError
      ? "section-message error-message"
      : "section-message success-message";

    if (!isError) {
      setTimeout(() => {
        if (
          sectionMessage.parentNode &&
          sectionMessage.textContent === message
        ) {
          sectionMessage.remove();
        }
      }, 5000);
    }
  } else {
    console.log("Settings section not found");
  }
}

document.addEventListener("DOMContentLoaded", initProfilePicture);
