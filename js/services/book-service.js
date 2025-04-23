import { googleBooksApi, handleApiError } from "./api-config.js";

// Default book covers for different genres
const DEFAULT_BOOK_COVERS = {
  default: "/images/default-book-cover.jpg",
  fiction: "/images/fiction-book-cover.jpg",
  fantasy: "/images/fantasy-book-cover.jpg",
  scifi: "/images/scifi-book-cover.jpg",
  romance: "/images/romance-book-cover.jpg",
  thriller: "/images/thriller-book-cover.jpg",
  mystery: "/images/mystery-book-cover.jpg",
  nonfiction: "/images/nonfiction-book-cover.jpg",
};

// List of popular books with descriptions
const POPULAR_BOOKS = [
  {
    title: "Dune",
    author: "Frank Herbert",
    description:
      "Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family tasked with ruling an inhospitable world where the only thing of value is the spice melange.",
    genres: ["Science Fiction", "Fantasy"],
    rating: 4.5,
    ageRating: "Teen",
  },
  {
    title: "Project Hail Mary",
    author: "Andy Weir",
    description:
      "Ryland Grace is the sole survivor on a desperate, last-chance mission to save both humanity and the earth itself, who must conquer an extinction-level threat from a terrifying enemy.",
    genres: ["Science Fiction", "Adventure"],
    rating: 4.8,
    ageRating: "Teen",
  },
  {
    title: "The Hunger Games",
    author: "Suzanne Collins",
    description:
      "In a future North America, where the rulers maintain control through an annual televised survival competition, sixteen-year-old Katniss's skills are put to the test when she voluntarily takes her younger sister's place.",
    genres: ["Young Adult", "Dystopian"],
    rating: 4.3,
    ageRating: "Teen",
  },
  {
    title: "Atomic Habits",
    author: "James Clear",
    description:
      "Tiny Changes, Remarkable Results: An Easy & Proven Way to Build Good Habits & Break Bad Ones.",
    genres: ["Self-Help", "Nonfiction"],
    rating: 4.7,
    ageRating: "All Ages",
  },
  {
    title: "The House in the Cerulean Sea",
    author: "TJ Klune",
    description:
      "A magical island. A dangerous task. A burning secret. Linus Baker leads a quiet, solitary life as a Case Worker at the Department in Charge Of Magical Youth.",
    genres: ["Fantasy", "LGBTQ+"],
    rating: 4.6,
    ageRating: "Teen",
  },
];

/**
 * Get book cover image URL for a book title with fallback and caching
 * @param {string} bookTitle - The title of the book
 * @returns {Promise<string>} The book cover URL or fallback if not found
 */
export async function getBookCover(bookTitle) {
  try {
    // Check cache first
    const cachedUrl = getCachedImageUrl(bookTitle);
    if (cachedUrl) {
      console.log(`Using cached cover URL for ${bookTitle}`);
      return cachedUrl;
    }

    // Add "book" to the search query to improve results
    const searchQuery = `${bookTitle} book`;

    const response = await googleBooksApi.get("/volumes", {
      params: {
        q: searchQuery,
        maxResults: 3,
        printType: "books",
        orderBy: "relevance",
      },
    });

    if (!response.data.items || response.data.items.length === 0) {
      console.warn(`No books found for: ${bookTitle}`);
      return getDefaultBookCover(bookTitle);
    }

    // Try to find the best cover from the first few results
    for (const item of response.data.items) {
      const imageLinks = item.volumeInfo?.imageLinks;

      if (imageLinks) {
        // Google Books API provides these sizes in descending quality
        const sizes = ["extraLarge", "large", "medium", "small", "thumbnail"];

        for (const size of sizes) {
          if (imageLinks[size]) {
            let coverUrl = imageLinks[size]
              .replace("http://", "https://")
              .replace("&zoom=1", "")
              .replace("&edge=curl", "");

            if (!coverUrl.includes("&edge=")) {
              coverUrl += "&edge=nocurl";
            }

            // Cache the URL in localStorage for future use
            try {
              localStorage.setItem(cacheKey, coverUrl);
            } catch (e) {
              // Handle localStorage errors (quota exceeded, etc.)
              console.warn("Could not cache book cover:", e);
            }

            return coverUrl;
          }
        }
      }
    }

    console.warn(`No suitable cover found for: ${bookTitle}`);
    return getDefaultBookCover(bookTitle);
  } catch (error) {
    handleApiError(error, "Google Books", "Error fetching book cover");
    return getDefaultBookCover(bookTitle);
  }
}

/**
 * Get a default book cover based on title or genre
 * @param {string} bookTitle - The title of the book
 * @param {string} genre - Optional genre to determine the cover
 * @returns {string} Path to a default cover image
 */
function getDefaultBookCover(bookTitle, genre) {
  // If genre is provided, use that to determine the cover
  if (genre && DEFAULT_BOOK_COVERS[genre.toLowerCase()]) {
    return DEFAULT_BOOK_COVERS[genre.toLowerCase()];
  }

  // Look for genre keywords in the title
  const title = bookTitle.toLowerCase();

  if (
    title.includes("fantasy") ||
    title.includes("magic") ||
    title.includes("wizard") ||
    title.includes("dragon")
  ) {
    return DEFAULT_BOOK_COVERS.fantasy;
  }

  if (
    title.includes("sci-fi") ||
    title.includes("science fiction") ||
    title.includes("space") ||
    title.includes("alien")
  ) {
    return DEFAULT_BOOK_COVERS.scifi;
  }

  if (
    title.includes("romance") ||
    title.includes("love") ||
    title.includes("passion")
  ) {
    return DEFAULT_BOOK_COVERS.romance;
  }

  if (
    title.includes("thriller") ||
    title.includes("suspense") ||
    title.includes("horror")
  ) {
    return DEFAULT_BOOK_COVERS.thriller;
  }

  if (
    title.includes("mystery") ||
    title.includes("detective") ||
    title.includes("crime")
  ) {
    return DEFAULT_BOOK_COVERS.mystery;
  }

  if (
    title.includes("non-fiction") ||
    title.includes("biography") ||
    title.includes("history") ||
    title.includes("science")
  ) {
    return DEFAULT_BOOK_COVERS.nonfiction;
  }

  // Default fallback
  return DEFAULT_BOOK_COVERS.default;
}

function cacheImageUrl(title, url) {
  try {
    localStorage.setItem(`book_cover_${title.replace(/\s+/g, "_")}`, url);
  } catch (e) {
    console.warn("Error caching book cover URL:", e);
  }
}

function getCachedImageUrl(title) {
  return localStorage.getItem(`book_cover_${title.replace(/\s+/g, "_")}`);
}

/**
 * Get detailed book information with fallback to local data
 * @param {string} bookTitle - The title of the book
 * @returns {Promise<object>} Book details including cover, title, and author
 */
export async function getBookDetails(bookTitle) {
  try {
    // Try to get cover first
    const coverUrl = await getBookCover(bookTitle);

    // Try to get more details from API
    const response = await googleBooksApi.get("/volumes", {
      params: {
        q: bookTitle,
        maxResults: 1,
        printType: "books",
      },
    });

    if (response.data.items && response.data.items.length > 0) {
      const book = response.data.items[0].volumeInfo;
      return {
        coverUrl: coverUrl,
        title: book.title || bookTitle,
        author: book.authors ? book.authors.join(", ") : "Unknown",
        description: book.description || "No description available",
        pageCount: book.pageCount,
        publishedDate: book.publishedDate,
        categories: book.categories,
        averageRating: book.averageRating,
        infoLink: book.infoLink,
      };
    }

    // If API failed, check if we have this book in our local data
    const localBook = findLocalBookData(bookTitle);
    if (localBook) {
      return {
        coverUrl: coverUrl,
        title: localBook.title,
        author: localBook.author,
        description: localBook.description,
        categories: localBook.genres,
        averageRating: localBook.rating,
      };
    }

    // Default fallback data
    return {
      coverUrl: coverUrl,
      title: bookTitle,
      author: "Unknown",
      description: "No description available",
    };
  } catch (error) {
    handleApiError(error, "Google Books", "Error fetching book details");

    // Try to find local data as fallback
    const localBook = findLocalBookData(bookTitle);
    if (localBook) {
      return {
        coverUrl: await getBookCover(bookTitle),
        title: localBook.title,
        author: localBook.author,
        description: localBook.description,
        categories: localBook.genres,
        averageRating: localBook.rating,
      };
    }

    return {
      coverUrl: await getBookCover(bookTitle),
      title: bookTitle,
      author: "Unknown",
      description: "No description available",
    };
  }
}

/**
 * Find a book in our local data by title
 * @param {string} bookTitle - The title to search for
 * @returns {object|null} The book object or null if not found
 */
function findLocalBookData(bookTitle) {
  const searchTitle = bookTitle.toLowerCase();
  return POPULAR_BOOKS.find((book) =>
    book.title.toLowerCase().includes(searchTitle)
  );
}

/**
 * Get popular book recommendations from local data when API fails
 * @param {number} limit - Number of books to return
 * @returns {Promise<Array>} Array of popular book details
 */
export async function getPopularBooks(limit = 5) {
  try {
    // Shuffle the array of popular books
    const shuffledBooks = [...POPULAR_BOOKS].sort(() => 0.5 - Math.random());

    // Get the requested number of books
    const selectedBooks = shuffledBooks.slice(0, limit);

    // Get details for each book
    const bookPromises = selectedBooks.map(async (book) => {
      try {
        const coverUrl = await getBookCover(book.title);

        return {
          title: book.title,
          author: book.author,
          description: book.description,
          coverUrl: coverUrl,
          genres: book.genres,
          rating: book.rating,
        };
      } catch (error) {
        console.error(`Error getting cover for ${book.title}:`, error);

        return {
          title: book.title,
          author: book.author,
          description: book.description,
          coverUrl: getDefaultBookCover(book.title, book.genres[0]),
          genres: book.genres,
          rating: book.rating,
        };
      }
    });

    const books = await Promise.all(bookPromises);
    return books.filter((book) => book !== null);
  } catch (error) {
    console.error("Error getting popular books:", error);

    // Return fallback data from our local collection
    return POPULAR_BOOKS.slice(0, limit).map((book) => ({
      ...book,
      coverUrl: getDefaultBookCover(book.title, book.genres[0]),
    }));
  }
}
