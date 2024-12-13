import axios from 'axios';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
console.log("api key", TMDB_API_KEY)
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export async function getMoviePoster(movieTitle) {
    try {
        console.log('Fetching poster for movie:', movieTitle);
        const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
                api_key: TMDB_API_KEY,
                query: movieTitle
            }
        });

        console.log('TMDB API response:', response);
        
        if (response.data.results && response.data.results.length > 0) {
            const posterPath = response.data.results[0].poster_path;
            const fullPath = `https://image.tmdb.org/t/p/w500${posterPath}`;
            console.log('Generated poster URL:', fullPath);
            return fullPath;
        }
        console.log('No poster found for:', movieTitle);
        return null;
    } catch (error) {
        console.error('Error fetching movie poster:', error);
        return null;
    }
}