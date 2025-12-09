
import { GoogleGenAI, Type } from "@google/genai";
import { PredictionInputs, PredictionResult, FeedbackItem, Recipe, Ingredient } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set3");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function parseRecipeText(recipeText: string): Promise<Ingredient[]> {
  const prompt = `
    You are an expert recipe parser. Your task is to extract the ingredients and their quantities from the following recipe text.
    Return the result as a JSON array where each object has a unique "id", a "name", and a "quantity".
    If the text is not a recipe, return an empty array.

    Recipe Text:
    ---
    ${recipeText}
    ---

    Provide your response ONLY in the specified JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "A unique identifier (e.g., UUID)." },
              name: { type: Type.STRING, description: "The name of the ingredient." },
              quantity: { type: Type.STRING, description: "The quantity of the ingredient (e.g., '2 cups', '1 tbsp')." },
            },
            required: ["id", "name", "quantity"],
          },
        },
      },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    
    if (Array.isArray(result)) {
        return result.map(item => ({...item, id: self.crypto.randomUUID()})); // Ensure unique IDs
    }
    return [];

  } catch (error) {
    console.error("Error parsing recipe text with Gemini API:", error);
    throw new Error("Failed to parse recipe. The file might not contain a valid recipe format.");
  }
}


export async function predictSpoilageDate(
    recipe: Recipe,
    inputs: PredictionInputs,
    feedbackHistory: FeedbackItem[] = []
): Promise<PredictionResult> {

  // Take the last 3 feedback items to keep the prompt concise
  const recentFeedback = feedbackHistory.slice(-3);

  const examples = recentFeedback.length > 0 ? `
    Here are some previous examples of predictions and their real-world outcomes. Use them to improve your accuracy.
    ${recentFeedback.map((item, index) => `
    --- Example ${index + 1} ---
    **Inputs:**
    - Recipe Name: ${item.recipe.name}
    - Ingredients: ${item.recipe.ingredients.map(i => `${i.quantity} ${i.name}`).join(', ')}
    - Preparation Date: ${item.inputs.prepDate}
    - Storage: ${item.inputs.timeOutside}h outside at ${item.inputs.outsideTemp}°C, ${item.inputs.timeInside}h in freezer at ${item.inputs.freezingTemp}°C.
    **Actual Spoilage Date (User Feedback):** ${item.actualSpoilageDate}
    `).join('\n')}
    ---
  ` : '';

  const ingredientsString = recipe.ingredients.map(i => `- ${i.quantity} ${i.name}`).join('\n');

  const prompt = `
    You are a food science expert specializing in food safety and spoilage. Your task is to predict the spoilage date of a dish based on the provided information.
    ${examples}
    Analyze the following new data carefully:

    **Dish & Ingredients:**
    - Recipe Name: ${recipe.name}
    ---
    ${ingredientsString}
    ---

    **Timeline & Environment:**
    - Preparation Date: ${inputs.prepDate}
    - Total Time Outside Freezer: ${inputs.timeOutside} hours
    - Outside Temperature: ${inputs.outsideTemp}°C
    - Total Time in Freezer: ${inputs.timeInside} hours
    - Freezing Temperature: ${inputs.freezingTemp}°C

    **Task:**
    Based on all the provided information (and learning from the examples if any), predict the exact date (YYYY-MM-DD) when the food will spoil. Consider the ingredients (especially perishables like dairy, meat, or soft vegetables), preparation date, and the temperature history. A standard refrigerator is about 4°C and a standard freezer is -18°C. Use these as references if needed.

    Provide your response ONLY in the specified JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            spoilageDate: {
              type: Type.STRING,
              description: "The predicted spoilage date in YYYY-MM-DD format.",
            },
            reasoning: {
              type: Type.STRING,
              description: "A brief explanation for the predicted spoilage date, considering the most perishable ingredients and storage conditions.",
            },
          },
          required: ["spoilageDate", "reasoning"],
        },
      },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    
    if (typeof result.spoilageDate === 'string' && typeof result.reasoning === 'string') {
        return result as PredictionResult;
    } else {
        throw new Error("Invalid JSON structure received from API.");
    }

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get prediction from the AI. Please check your inputs and try again.");
  }
}
