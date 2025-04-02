document.addEventListener("DOMContentLoaded", function () {
  // Find all password input fields
  const passwordFields = document.querySelectorAll('input[type="password"]');

  // Add toggle buttons to each password field
  passwordFields.forEach((field) => {
    addPasswordToggle(field);
  });
});

/**

  @param {HTMLInputElement} inputField 
 */
function addPasswordToggle(inputField) {
  // Only proceed if the input is still in the DOM
  if (!inputField.parentNode) return;

  // Get the parent element's position style
  const parentPosition = window.getComputedStyle(
    inputField.parentNode
  ).position;

  // Check if the parent already has relative positioning
  const needsRelativeParent =
    parentPosition !== "relative" &&
    parentPosition !== "absolute" &&
    parentPosition !== "fixed";

  // Create wrapper only if needed
  let wrapper = inputField.parentNode;

  // If parent doesn't have relative positioning, create a new wrapper
  if (needsRelativeParent) {
    wrapper = document.createElement("div");
    wrapper.className = "password-field-wrapper";
    wrapper.style.position = "relative";
    wrapper.style.display = "block";
    wrapper.style.width = "100%";

    // Insert wrapper before the input field
    inputField.parentNode.insertBefore(wrapper, inputField);

    // Move input into wrapper
    wrapper.appendChild(inputField);
  }

  // Check if the toggle button already exists to prevent duplicates
  const existingToggle = wrapper.querySelector(".password-toggle");
  if (existingToggle) return;

  // Create toggle button
  const toggleButton = document.createElement("button");
  toggleButton.type = "button";
  toggleButton.className = "password-toggle";
  toggleButton.setAttribute("aria-label", "Toggle password visibility");
  toggleButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="eye-icon show-password" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
        <svg xmlns="http://www.w3.org/2000/svg" class="eye-icon hide-password" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: none;">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
            <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
    `;

  toggleButton.style.position = "absolute";
  toggleButton.style.right = "8px";
  toggleButton.style.top = "50%";
  toggleButton.style.transform = "translateY(-50%)";
  toggleButton.style.border = "none";
  toggleButton.style.background = "transparent";
  toggleButton.style.cursor = "pointer";
  toggleButton.style.zIndex = "10";
  toggleButton.style.display = "flex";
  toggleButton.style.alignItems = "center";
  toggleButton.style.justifyContent = "center";
  toggleButton.style.padding = "5px";
  toggleButton.style.width = "30px";
  toggleButton.style.height = "30px";
  toggleButton.style.marginRight = "2px";

  const isAccountPage =
    document.querySelector(".section.change-password-section") !== null;

  // Get current theme color
  const isDarkTheme = document.body.getAttribute("data-theme") === "dark";
  const eyeColor = isDarkTheme ? "#ffffff" : "#333333";

  // Style the eye icons
  const eyeIcons = toggleButton.querySelectorAll(".eye-icon");
  eyeIcons.forEach((icon) => {
    icon.style.color = eyeColor;
    icon.style.opacity = "0.7";
    icon.style.transition = "opacity 0.3s ease";
  });

  // Add hover effect to toggle button
  toggleButton.addEventListener("mouseenter", () => {
    eyeIcons.forEach((icon) => {
      icon.style.opacity = "1";
    });
  });

  toggleButton.addEventListener("mouseleave", () => {
    eyeIcons.forEach((icon) => {
      icon.style.opacity = "0.7";
    });
  });

  if (isAccountPage) {
    inputField.style.paddingRight = "40px";
  } else {
    inputField.style.paddingRight = "40px";
  }

  // Add toggle functionality
  toggleButton.addEventListener("click", function (e) {
    e.preventDefault(); // Prevent form submission
    const isPassword = inputField.type === "password";

    // Toggle password visibility
    inputField.type = isPassword ? "text" : "password";

    // Toggle eye icon visibility
    const showPasswordIcon = toggleButton.querySelector(".show-password");
    const hidePasswordIcon = toggleButton.querySelector(".hide-password");

    showPasswordIcon.style.display = isPassword ? "none" : "block";
    hidePasswordIcon.style.display = isPassword ? "block" : "none";
  });

  // Add toggle button to the wrapper
  wrapper.appendChild(toggleButton);

  const style = document.createElement("style");
  style.textContent = `
        /* Fix for input padding */
        input[type="password"] {
            padding-right: 40px !important;
        }
        
        /* Make sure the wrapper doesn't break layouts */
        .password-field-wrapper {
            margin-top: 8px;
            margin-bottom: 8px;
            width: 100%;
        }
        
        /* Ensure toggle button is properly positioned */
        .password-toggle {
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            z-index: 10;
        }
        
        /* Specific fix for account page */
        .change-password-section .password-toggle {
            right: 10px;
        }
    `;

  if (!document.getElementById("password-toggle-styles")) {
    style.id = "password-toggle-styles";
    document.head.appendChild(style);
  }
}
