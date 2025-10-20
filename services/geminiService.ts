import { GoogleGenAI, GenerateContentResponse, Modality, Type } from '@google/genai';
import { Recipe, DishSuggestion } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Define a strict schema for the recipe data to ensure a reliable JSON response.
const recipeSchema = {
    type: Type.OBJECT,
    properties: {
        recipeName: { type: Type.STRING },
        description: { 
            type: Type.STRING,
            description: "A description of the dish, focusing on the health benefits and vitamins of its main ingredients. For example, if the dish contains carrots, mention that they are a good source of Vitamin A, which is beneficial for eye health."
        },
        ingredients: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    amount: { type: Type.STRING },
                },
                required: ['name', 'amount'],
            },
        },
        instructions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
        },
    },
    required: ['recipeName', 'description', 'ingredients', 'instructions'],
};

const dishSuggestionsSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            dishName: { type: Type.STRING },
            description: { type: Type.STRING, description: 'A brief, enticing description of the dish.' },
        },
        required: ['dishName', 'description'],
    },
};


export const generateDishSuggestions = async (request: string, language: string): Promise<DishSuggestion[] | null> => {
    try {
        // Step 1: Generate 5 dish ideas (name and description)
        const suggestionsPrompt = `Based on the user request "${request}", generate 5 distinct dish ideas. Provide only a JSON array of objects, where each object has "dishName" and "description". The entire response must be in ${language}.`;
        
        const suggestionsResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: suggestionsPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: dishSuggestionsSchema,
            },
        });

        let dishIdeas;
        try {
            const parsed = JSON.parse(suggestionsResponse.text);
            if (Array.isArray(parsed) && parsed.length > 0) {
                dishIdeas = parsed.slice(0, 5); // Ensure we only take up to 5 suggestions
            } else {
                throw new Error("Parsed response is not a valid array of suggestions.");
            }
        } catch (e) {
            console.error("Failed to parse dish suggestions JSON.", "Response text:", suggestionsResponse.text, e);
            throw new Error('The model did not provide valid dish suggestions.');
        }

        // Step 2: Generate an image for each idea concurrently for performance
        const imagePromises = dishIdeas.map(idea => {
            const imagePrompt = `Generate a photorealistic, delicious-looking image of a dish called "${idea.dishName}". Context: ${idea.description}`;
            return ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: imagePrompt }] },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });
        });

        const imageResponses = await Promise.all(imagePromises);

        // Step 3: Combine ideas with their images
        const suggestionsWithImages: DishSuggestion[] = dishIdeas.map((idea, index) => {
            const imageResponse = imageResponses[index];
            const imagePart = imageResponse?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
            
            const imageUrl = imagePart?.inlineData
                ? `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`
                : ''; // Handle cases where image generation might fail for one item

            return { ...idea, imageUrl };
        });

        return suggestionsWithImages.filter(s => s.imageUrl); // Only return suggestions that successfully got an image

    } catch (error) {
        console.error('Error in generateDishSuggestions flow:', error);
        return null;
    }
};


export const generateRecipe = async (request: { type: 'ingredients' | 'dish', value: string }, language: string): Promise<Recipe | null> => {
  try {
    // --- Step 1: Generate the structured recipe data ---
    const recipePrompt = request.type === 'ingredients'
        ? `Create a detailed recipe using the following ingredients: ${request.value}. The description must focus on the health benefits and vitamins of the key ingredients (e.g., "This dish is rich in Vitamin A from carrots, which is great for eye health."). The entire recipe, including all text and ingredient names, must be in ${language}.`
        : `Create a detailed recipe for the following dish: ${request.value}. The description must focus on the health benefits and vitamins of the key ingredients (e.g., "This dish is rich in Vitamin A from carrots, which is great for eye health."). The entire recipe, including all text and ingredient names, must be in ${language}.`;


    const recipeResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: recipePrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: recipeSchema,
        },
    });

    let recipeData;
    try {
        recipeData = JSON.parse(recipeResponse.text);
    } catch (e) {
        console.error("Failed to parse recipe JSON from API.", "Response text:", recipeResponse.text, e);
        throw new Error('The model did not provide a valid recipe structure.');
    }

    if (!recipeData || !recipeData.recipeName) {
        throw new Error('The generated recipe data is incomplete.');
    }

    // --- Step 2: Generate the recipe image based on the data ---
    const imagePrompt = `Generate a photorealistic, delicious-looking image of a dish called "${recipeData.recipeName}". Description for context: ${recipeData.description}`;

    const imageResponse: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: imagePrompt }] },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const imagePart = imageResponse?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!imagePart || !imagePart.inlineData) {
        console.error('Image generation step failed: No image data found in the response.');
        // Fallback: Continue without an image, but it's better to fail and let the user retry for a complete result.
        throw new Error('The model failed to generate an image for the recipe.');
    }
    const imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    
    // --- Step 3: Combine results ---
    const finalRecipe: Recipe = {
        ...recipeData,
        id: `${recipeData.recipeName.replace(/\s+/g, '-')}-${Date.now()}`,
        imageUrl: imageUrl,
    };
    
    return finalRecipe;

  } catch (error) {
    console.error('Error in generateRecipe flow:', error);
    return null;
  }
};