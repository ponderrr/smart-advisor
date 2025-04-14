import { googleBooksApi, handleApiError } from "./api-config.js";

/**
 * Get book cover image URL for a book title
 * @param {string} bookTitle - The title of the book
 * @returns {Promise<string|null>} The book cover URL or null if not found
 */
export async function getBookCover(bookTitle) {
  try {
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
      return null;
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

            return coverUrl;
          }
        }
      }
    }

    console.warn(`No suitable cover found for: ${bookTitle}`);
    return null;
  } catch (error) {
    handleApiError(error, "Google Books", "Error fetching book cover");
    return null;
  }
}

/**
 * Get detailed book information
 * @param {string} bookTitle - The title of the book
 * @returns {Promise<object>} Book details including cover, title, and author
 */
export async function getBookDetails(bookTitle) {
  try {
    const coverUrl = await getBookCover(bookTitle);

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

    return {
      coverUrl: coverUrl,
      title: bookTitle,
      author: "Unknown",
      description: "No description available",
    };
  } catch (error) {
    handleApiError(error, "Google Books", "Error fetching book details");
    return {
      coverUrl: null,
      title: bookTitle,
      author: "Unknown",
      description: "No description available",
    };
  }
}

/**
 * Get popular book recommendations
 * @param {number} limit - Number of books to return
 * @returns {Promise<Array>} Array of popular book details
 */
export async function getPopularBooks(limit = 5) {
  // List of popular books with high-quality cover art
  const popularBooks = [
    "Dune by Frank Herbert",
    "The Midnight Library by Matt Haig",
    "Project Hail Mary by Andy Weir",
    "The Hunger Games by Suzanne Collins",
    "A Court of Thorns and Roses by Sarah J. Maas",
    "The Silent Patient by Alex Michaelides",
    "Where the Crawdads Sing by Delia Owens",
    "It Ends with Us by Colleen Hoover",
    "Circe by Madeline Miller",
    "The Song of Achilles by Madeline Miller",
    "The Seven Husbands of Evelyn Hugo by Taylor Jenkins Reid",
    "Klara and the Sun by Kazuo Ishiguro",
    "The Thursday Murder Club by Richard Osman",
    "House of Earth and Blood by Sarah J. Maas",
    "The Invisible Life of Addie LaRue by V.E. Schwab",
    "Atomic Habits by James Clear",
    "The House in the Cerulean Sea by TJ Klune",
    "Normal People by Sally Rooney",
    "Fourth Wing by Rebecca Yarros",
    "A Little Life by Hanya Yanagihara",
  ];

  // Shuffle the array and take the requested number of books
  const selectedBooks = [...popularBooks]
    .sort(() => 0.5 - Math.random())
    .slice(0, limit);

  // Get details for each book
  const bookPromises = selectedBooks.map((book) => getBookDetails(book));
  const books = await Promise.all(bookPromises);

  return books.filter((book) => book.coverUrl !== null);
}
