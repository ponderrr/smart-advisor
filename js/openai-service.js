import axios from 'axios';

const OPENAI_API_URL = import.meta.env.VITE_OPENAI_URL;
const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;

const axiosInstance = axios.create({
  baseURL: OPENAI_API_URL,
  headers: {
    "Authorization": `Bearer ${openaiApiKey}`,
    "Content-Type": "application/json"
  }
});

export async function getQuestionsAndRecommendation({ numberOfQuestions, age, type, answers }) {
  try {
    if (!answers) {
      const questionsPrompt = `Generate exactly ${numberOfQuestions} engaging questions to understand a ${age} year old's preferences for ${type === 'both' ? 'movies and books' : type + 's'}. Make questions age-appropriate and fun. Format: numbered list.`;

      const response = await axiosInstance.post('', {
        model: "gpt-3.5-turbo",
        messages: [{
          role: "user",
          content: questionsPrompt
        }],
        temperature: 0.7
      });

      const rawQuestions = response.data.choices[0].message.content;

      console.log("here", rawQuestions);
      const questions = rawQuestions.split('\n')
        .filter(q => q.trim())
        .map(q => q.replace(/^\d+\.\s*/, '').trim());

      return { questions };
    }

    const recommendationPrompt = `Based on these answers from a ${age} year old user: ${JSON.stringify(answers)}
    Please recommend ${type === 'both' ? 'one movie and one book' : 'one ' + type} that is:
    1. Age-appropriate (rated ${age <= 13 ? 'G or PG' : age <= 17 ? 'up to PG-13' : 'any rating'})
    2. Matches their interests
    3. Has good entertainment value
    
    Format the response as JSON with these fields:
    - title (string)
    - type (string: "movie", "book", or "both")
    - rating (number 1-5)
    - genres (array of strings)
    - ageRating (string)`;

    const response = await axiosInstance.post('', {
      model: "gpt-3.5-turbo",
      messages: [{
        role: "user",
        content: recommendationPrompt
      }],
      temperature: 0.7
    });

    const recommendation = JSON.parse(response.data.choices[0].message.content);
    console.log("recommendation", recommendation);
    return { recommendation };

  } catch (error) {
    console.error("Error with OpenAI API:", error);
    throw new Error("Failed to process request: " + error.message);
  }
}

export async function handleAPIRequest(req, res) {
  try {
    const result = await getQuestionsAndRecommendation(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}