document.addEventListener('DOMContentLoaded', () => {
  const modeToggleButton = document.getElementById('mode-toggle');
  const modeIcon = document.getElementById('mode-icon');

  const sunIcon = '☀️'; // Sun emoji
  const moonIcon = '🌙'; // Moon emoji

  // Set initial theme and icon based on saved preference
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  modeIcon.textContent = savedTheme === 'dark' ? sunIcon : moonIcon;

  // Toggle theme and icon on click
  modeToggleButton.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);

      // Update icon based on the new theme
      modeIcon.textContent = newTheme === 'dark' ? sunIcon : moonIcon;
  });
});

