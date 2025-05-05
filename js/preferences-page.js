import { supabase } from "./supabase-config.js";
import { getUserProfile } from "./supabase-utils.js";

document.addEventListener("DOMContentLoaded", async () => {
  // Check if user is logged in
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = "sign-in.html?redirectTo=preferences.html";
    return;
  }

  // Initialize the form with user preferences
  await initializePreferences();

  // Set up form submission
  const form = document.getElementById("accessibility-form");
  if (form) {
    form.addEventListener("submit", handleSubmit);
  }
});

/**
 * Initialize form with user preferences
 */
async function initializePreferences() {
  try {
    // Show loading state
    const form = document.getElementById("accessibility-form");
    if (form) {
      form.innerHTML = `
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>Loading your preferences...</p>
        </div>
      `;
    }

    // Get user profile
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const userProfile = await getUserProfile(session.user.id);
    if (!userProfile) {
      console.error("User profile not found");
      return;
    }

    // Get preferences or use defaults
    const preferences = userProfile.preferences || {
      accessibility: {
        requireSubtitles: false,
        requireAudioDescription: false,
        requireClosedCaptions: false,
      },
      contentFilters: {
        excludeViolentContent: false,
        excludeSexualContent: false,
      },
      language: "en",
      recommendationHistory: [],
    };

    // Reset form with original content
    resetForm();

    // Set form values based on user preferences
    setFormValues(preferences);
  } catch (error) {
    console.error("Error initializing preferences:", error);
    showError("Failed to load preferences. Please try again later.");
  }
}

/**
 * Reset form to original state
 */
function resetForm() {
  const form = document.getElementById("accessibility-form");
  if (!form) return;

  // Clear loading state and restore original content
  form.innerHTML = `
    <div class="preferences-group">
      <h3>Media Accessibility</h3>
      
      <div class="preference-item">
        <div class="preference-info">
          <label for="subtitles-toggle">Require Subtitles</label>
          <p class="preference-description">Only recommend movies that offer subtitles</p>
        </div>
        <div class="toggle-switch">
          <input type="checkbox" id="subtitles-toggle" class="toggle-input">
          <label for="subtitles-toggle" class="toggle-label"></label>
        </div>
      </div>

      <div class="preference-item">
        <div class="preference-info">
          <label for="audio-description-toggle">Require Audio Description</label>
          <p class="preference-description">Only recommend movies with audio descriptions for visually impaired viewers</p>
        </div>
        <div class="toggle-switch">
          <input type="checkbox" id="audio-description-toggle" class="toggle-input">
          <label for="audio-description-toggle" class="toggle-label"></label>
        </div>
      </div>

      <div class="preference-item">
        <div class="preference-info">
          <label for="closed-captions-toggle">Require Closed Captions</label>
          <p class="preference-description">Only recommend content with closed captions (includes sound effects and speaker identification)</p>
        </div>
        <div class="toggle-switch">
          <input type="checkbox" id="closed-captions-toggle" class="toggle-input">
          <label for="closed-captions-toggle" class="toggle-label"></label>
        </div>
      </div>
    </div>

    <div class="preferences-group">
      <h3>Content Filters</h3>
      
      <div class="preference-item">
        <div class="preference-info">
          <label for="violent-content-toggle">Exclude Violent Content</label>
          <p class="preference-description">Filter out movies and books with excessive violence</p>
        </div>
        <div class="toggle-switch">
          <input type="checkbox" id="violent-content-toggle" class="toggle-input">
          <label for="violent-content-toggle" class="

          <div class="preference-info">
          <label for="violent-content-toggle">Exclude Violent Content</label>
          <p class="preference-description">Filter out movies and books with excessive violence</p>
        </div>
        <div class="toggle-switch">
          <input type="checkbox" id="violent-content-toggle" class="toggle-input">
          <label for="violent-content-toggle" class="toggle-label"></label>
        </div>
      </div>

      <div class="preference-item">
        <div class="preference-info">
          <label for="sexual-content-toggle">Exclude Sexual Content</label>
          <p class="preference-description">Filter out movies and books with explicit sexual content</p>
        </div>
        <div class="toggle-switch">
          <input type="checkbox" id="sexual-content-toggle" class="toggle-input">
          <label for="sexual-content-toggle" class="toggle-label"></label>
        </div>
      </div>
    </div>

    <div class="preferences-group">
      <h3>Language Options</h3>
      
      <div class="preference-item">
        <div class="preference-info">
          <label for="language-select">Preferred Language</label>
          <p class="preference-description">Choose your preferred language for subtitles and content</p>
        </div>
        <div class="language-select-container">
          <select id="language-select" name="preferred-language">
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="it">Italian</option>
            <option value="zh">Chinese</option>
            <option value="ja">Japanese</option>
            <option value="ko">Korean</option>
            <option value="ru">Russian</option>
            <option value="pt">Portuguese</option>
          </select>
        </div>
      </div>
    </div>

    <div class="form-actions">
      <button type="submit" class="save-preferences-btn">Save Preferences</button>
    </div>
  `;
}

/**
 * Set form values based on user preferences
 * @param {Object} preferences - User preferences
 */
function setFormValues(preferences) {
  // Set accessibility toggles
  const subtitlesToggle = document.getElementById("subtitles-toggle");
  const audioDescriptionToggle = document.getElementById(
    "audio-description-toggle"
  );
  const closedCaptionsToggle = document.getElementById(
    "closed-captions-toggle"
  );

  if (subtitlesToggle && preferences.accessibility) {
    subtitlesToggle.checked =
      preferences.accessibility.requireSubtitles || false;
  }

  if (audioDescriptionToggle && preferences.accessibility) {
    audioDescriptionToggle.checked =
      preferences.accessibility.requireAudioDescription || false;
  }

  if (closedCaptionsToggle && preferences.accessibility) {
    closedCaptionsToggle.checked =
      preferences.accessibility.requireClosedCaptions || false;
  }

  // Set content filter toggles
  const violentContentToggle = document.getElementById(
    "violent-content-toggle"
  );
  const sexualContentToggle = document.getElementById("sexual-content-toggle");

  if (violentContentToggle && preferences.contentFilters) {
    violentContentToggle.checked =
      preferences.contentFilters.excludeViolentContent || false;
  }

  if (sexualContentToggle && preferences.contentFilters) {
    sexualContentToggle.checked =
      preferences.contentFilters.excludeSexualContent || false;
  }

  // Set language preference
  const languageSelect = document.getElementById("language-select");
  if (languageSelect && preferences.language) {
    languageSelect.value = preferences.language;
  }
}

/**
 * Handle form submission
 * @param {Event} event - Form submission event
 */
async function handleSubmit(event) {
  event.preventDefault();

  // Get form values
  const subtitlesToggle = document.getElementById("subtitles-toggle");
  const audioDescriptionToggle = document.getElementById(
    "audio-description-toggle"
  );
  const closedCaptionsToggle = document.getElementById(
    "closed-captions-toggle"
  );
  const violentContentToggle = document.getElementById(
    "violent-content-toggle"
  );
  const sexualContentToggle = document.getElementById("sexual-content-toggle");
  const languageSelect = document.getElementById("language-select");

  // Build preferences object
  const preferences = {
    accessibility: {
      requireSubtitles: subtitlesToggle?.checked || false,
      requireAudioDescription: audioDescriptionToggle?.checked || false,
      requireClosedCaptions: closedCaptionsToggle?.checked || false,
    },
    contentFilters: {
      excludeViolentContent: violentContentToggle?.checked || false,
      excludeSexualContent: sexualContentToggle?.checked || false,
    },
    language: languageSelect?.value || "en",
  };

  try {
    // Save preferences to database
    await savePreferences(preferences);

    // Show success message
    showSuccessToast();
  } catch (error) {
    console.error("Error saving preferences:", error);
    showError("Failed to save preferences. Please try again later.");
  }
}

/**
 * Save preferences to database
 * @param {Object} preferences - User preferences
 */
async function savePreferences(preferences) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("User ID not found");
  }

  // Get current user data to preserve recommendation history
  const userProfile = await getUserProfile(session.user.id);
  const recommendationHistory =
    userProfile?.preferences?.recommendationHistory || [];

  // Update user record with new preferences
  const { error } = await supabase
    .from("users")
    .update({
      preferences: {
        ...preferences,
        recommendationHistory: recommendationHistory,
      },
    })
    .eq("id", session.user.id);

  if (error) throw error;
}

/**
 * Show success toast message
 */
function showSuccessToast() {
  const toast = document.getElementById("success-toast");
  if (!toast) return;

  toast.classList.add("show");

  // Hide toast after 3 seconds
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
  const form = document.getElementById("accessibility-form");
  if (!form) return;

  const errorElement = document.createElement("div");
  errorElement.className = "error-message";
  errorElement.textContent = message;
  errorElement.style.marginBottom = "1rem";

  // Check if there's already an error message
  const existingError = form.querySelector(".error-message");
  if (existingError) {
    existingError.textContent = message;
    return;
  }

  // Insert error at the top of the form
  form.insertBefore(errorElement, form.firstChild);
}
