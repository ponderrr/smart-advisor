import { getTrendingMovies } from "./services/movie-service.js";
import { getPopularBooks } from "./services/book-service.js";

// Function to load dynamic images on the home page
export async function loadHomePageImages() {
  try {
    // Get movie poster
    const movieBox = document.querySelector(".recommend-box.movie");
    if (movieBox) {
      const movies = await getTrendingMovies(1);
      const movieData = movies[0] || {
        title: "Movie Recommendation",
        posterUrl: "images/movie-background.jpg",
      };

      movieBox.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('${movieData.posterUrl}')`;

      // Add a title attribute for accessibility
      movieBox.setAttribute(
        "title",
        `Movie recommendation featuring ${movieData.title}`
      );

      // Add loading animation effect
      movieBox.classList.add("image-loaded");

      // Add info badge to show what movie is being displayed
      const badgeElement = document.createElement("div");
      badgeElement.className = "movie-info-badge";
      badgeElement.innerHTML = `<span class="movie-title">${movieData.title}</span>`;

      // Add the badge to the movie box
      movieBox.appendChild(badgeElement);
    }

    // Get book cover
    const bookBox = document.querySelector(".recommend-box.book");
    if (bookBox) {
      const books = await getPopularBooks(1);
      const bookData = books[0] || {
        title: "Book Recommendation",
        coverUrl: "images/book-background.jpg",
        author: "Various Authors",
      };

      bookBox.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('${bookData.coverUrl}')`;

      // Add a title attribute for accessibility
      bookBox.setAttribute(
        "title",
        `Book recommendation featuring ${bookData.title} by ${bookData.author}`
      );

      // Add loading animation effect
      bookBox.classList.add("image-loaded");

      const badgeElement = document.createElement("div");
      badgeElement.className = "book-info-badge";
      badgeElement.innerHTML = `<span class="book-title">${bookData.title}</span>
                                     <span class="book-author">by ${bookData.author}</span>`;

      // Add the badge to the book box
      bookBox.appendChild(badgeElement);
    }

    // Get combined image
    const bothBox = document.querySelector(".recommend-box.both");
    if (bothBox) {
      // Create a split effect by using CSS grid on the box
      bothBox.classList.add("split-background");
      bothBox.innerHTML = `
                <div class="split-container">
                    <div class="split-side movie-side"></div>
                    <div class="split-side book-side"></div>
                    <button>Movie & Book</button>
                </div>
            `;

      // Fetch both images
      const [movies, books] = await Promise.all([
        getTrendingMovies(1),
        getPopularBooks(1),
      ]);

      const movieData = movies[0] || {
        title: "Movie Recommendation",
        posterUrl: "images/movie-background.jpg",
      };

      const bookData = books[0] || {
        title: "Book Recommendation",
        coverUrl: "images/book-background.jpg",
      };

      // Set the backgrounds for each side
      const movieSide = bothBox.querySelector(".movie-side");
      const bookSide = bothBox.querySelector(".book-side");

      if (movieSide && bookSide) {
        movieSide.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('${movieData.posterUrl}')`;
        bookSide.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('${bookData.coverUrl}')`;

        // Add info badges for each side
        const movieBadge = document.createElement("div");
        movieBadge.className = "side-info-badge movie-badge";
        movieBadge.textContent = movieData.title;
        movieSide.appendChild(movieBadge);

        const bookBadge = document.createElement("div");
        bookBadge.className = "side-info-badge book-badge";
        bookBadge.textContent = bookData.title;
        bookSide.appendChild(bookBadge);
      }

      // Add title attribute for accessibility
      bothBox.setAttribute(
        "title",
        `Combined recommendation featuring ${movieData.title} movie and ${bookData.title} book`
      );

      // Restore the click handler
      bothBox.addEventListener("click", () => {
        window.handleRecommendationClick("both");
      });

      // Add loading animation effect
      bothBox.classList.add("image-loaded");
    }
  } catch (error) {
    console.error("Error loading home page images:", error);
    // Fallback to default images if there's an error
  }
}

// Add fadeIn animation class to the style
function injectLoadingStyles() {
  const styleElement = document.createElement("style");
  styleElement.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .recommend-box {
            opacity: 0;
            transition: opacity 0.5s ease, transform 0.3s ease;
            position: relative; /* For positioning the info badges */
        }
        
        .recommend-box.image-loaded {
            opacity: 1;
            animation: fadeIn 1s ease forwards;
        }
        
        /* Info badges styling */
        .movie-info-badge, .book-info-badge {
            position: absolute;
            bottom: 60px; /* Position above the button */
            left: 0;
            right: 0;
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 8px;
            text-align: center;
            font-size: 14px;
            opacity: 0;
            transform: translateY(10px);
            transition: opacity 0.3s ease, transform 0.3s ease;
        }
        
        .recommend-box:hover .movie-info-badge,
        .recommend-box:hover .book-info-badge {
            opacity: 1;
            transform: translateY(0);
        }
        
        .movie-title, .book-title {
            display: block;
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 3px;
        }
        
        .book-author {
            font-style: italic;
            font-size: 14px;
        }
        
        /* Split view for the combined recommendation */
        .split-background {
            position: relative;
            overflow: hidden;
            padding: 0 !important;
        }
        
        .split-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            width: 100%;
            height: 100%;
            position: relative;
        }
        
        .split-side {
            background-size: cover;
            background-position: center;
            height: 100%;
        }
        
        .movie-side {
            border-right: 2px solid var(--box-outline);
        }
        
        .book-side {
            border-left: 2px solid var(--box-outline);
        }
        
        .split-container button {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 2;
            white-space: nowrap;
        }
        
        /* Side info badges for the split view */
        .side-info-badge {
            position: absolute;
            bottom: 20px;
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 8px;
            font-size: 14px;
            text-align: center;
            opacity: 0;
            transition: opacity 0.3s ease;
            max-width: 90%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        .movie-badge {
            left: 5%;
        }
        
        .book-badge {
            right: 5%;
        }
        
        .recommend-box:hover .side-info-badge {
            opacity: 1;
        }
    `;
  document.head.appendChild(styleElement);
}

// Run when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  injectLoadingStyles();
  loadHomePageImages();
});
