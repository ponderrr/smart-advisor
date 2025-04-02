import axios from "axios";

/** 
 
 @param {string} bookTitle 
 @returns {Promise<string|null>} 
 
 */
export async function getEnhancedBookCover(bookTitle) {
  try {
    // Add "book" to the search query to improve results
    const searchQuery = `${bookTitle} book`;

    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes`,
      {
        params: {
          q: searchQuery,
          maxResults: 3, // Get a few results to choose from
          printType: "books",
          orderBy: "relevance",
        },
      }
    );

    if (!response.data.items || response.data.items.length === 0) {
      console.warn(`No books found for: ${bookTitle}`);
      return null;
    }

    // Try to find the best cover from the first few results
    for (const item of response.data.items) {
      const imageLinks = item.volumeInfo?.imageLinks;

      // Try to get the highest resolution available
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

            console.log(`Found ${size} cover for: ${bookTitle}`);
            return coverUrl;
          }
        }
      }
    }

    console.warn(`No suitable cover found for: ${bookTitle}`);
    return null;
  } catch (error) {
    console.error("Error fetching enhanced book cover:", error);
    return null;
  }
}

/**

  @param {string} bookTitle 
 @returns {Promise<{coverUrl: string, title: string, author: string}|null>}
 */
export async function getBookDetails(bookTitle) {
  try {
    const coverUrl = await getEnhancedBookCover(bookTitle);

    if (!coverUrl) {
      return {
        coverUrl: null,
        title: bookTitle,
        author: "Unknown",
      };
    }

    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes`,
      {
        params: {
          q: bookTitle,
          maxResults: 1,
          printType: "books",
        },
      }
    );

    if (response.data.items && response.data.items.length > 0) {
      const book = response.data.items[0].volumeInfo;
      return {
        coverUrl: coverUrl,
        title: book.title || bookTitle,
        author: book.authors ? book.authors.join(", ") : "Unknown",
      };
    }

    return {
      coverUrl: coverUrl,
      title: bookTitle,
      author: "Unknown",
    };
  } catch (error) {
    console.error("Error fetching book details:", error);
    return {
      coverUrl: null,
      title: bookTitle,
      author: "Unknown",
    };
  }
}
