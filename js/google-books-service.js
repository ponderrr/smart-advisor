import axios from 'axios';

export async function getBookCover(bookTitle) {
    try {
        const response = await axios.get(`https://www.googleapis.com/books/v1/volumes`, {
            params: {
                q: bookTitle
            }
        });
        
        if (response.data.items && response.data.items[0]?.volumeInfo?.imageLinks?.thumbnail) {
            return response.data.items[0].volumeInfo.imageLinks.thumbnail;
        }
        return null;
    } catch (error) {
        console.error('Error fetching book cover:', error);
        return null;
    }
}