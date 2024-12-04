import axios from 'axios';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export async function getMoviePoster(movieTitle) {
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
                api_key: TMDB_API_KEY,
                query: movieTitle
            }
        });
        
        if (response.data.results && response.data.results.length > 0) {
            const posterPath = response.data.results[0].poster_path;
            return `https://image.tmdb.org/t/p/w500${posterPath}`;
        }
        return null;
    } catch (error) {
        console.error('Error fetching movie poster:', error);
        return null;
    }
}