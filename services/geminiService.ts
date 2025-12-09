import { GoogleGenAI, Type } from "@google/genai";
import { MenuItem, BrandMenuCategory } from '../types';

export async function getMealRecommendation(
  preferences: string,
  menu: MenuItem[],
  brandName: string
): Promise<string> {
  if (!import.meta.env.VITE_API_KEY) {
    throw new Error("API_KEY environment variable not set1");
  }

  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });


  const simplifiedMenu = menu.map(item => item.name).join(', ');

  const prompt = `
    You are a friendly and knowledgeable restaurant host for "${brandName}".
    A customer has the following preference: "${preferences}".
    Based on this preference and our menu, please recommend one single dish.
    Our menu includes: ${simplifiedMenu}.

    Your response should be short, friendly, and enticing. First, name the dish, then give a one-sentence reason for the recommendation.
    For example: "I recommend the Chicken Biryani! It's a classic, flavorful rice dish that's both satisfying and delicious."
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    
    return response.text.trim();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Sorry, the chef is thinking! Please try again in a moment.");
  }
}

export async function parseMenuFromText(text: string): Promise<Omit<BrandMenuCategory, 'items'> & { items: Omit<MenuItem, 'image'>[] }[]> {
  console.log("Parsing menu text with Gemini API...",import.meta.env.VITE_API_KEY);
  if (!import.meta.env.VITE_API_KEY) {
    throw new Error("API_KEY environment variable not set2");
  }

  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

  const prompt = `
    You are an expert menu parser for a restaurant. Your task is to extract menu categories, and for each category, a list of items with their name, description, and price. The menu text is unstructured. Do your best to identify these components.

    Return the result as a JSON array matching the specified schema. Each object in the array represents a menu category. Omit any introductory text, closing remarks, or non-menu content.

    Menu Text:
    ---
    ${text}
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
              category: {
                type: Type.STRING,
                description: "The name of the menu category (e.g., 'Starters', 'Main Course').",
              },
              items: {
                type: Type.ARRAY,
                description: "A list of menu items in this category.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "The name of the dish." },
                    description: { type: Type.STRING, description: "A brief description of the dish." },
                    price: { type: Type.STRING, description: "The price of the dish (e.g., '₹120', '$15.99')." },
                  },
                  required: ["name", "description", "price"],
                },
              },
            },
            required: ["category", "items"],
          },
        },
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);

  } catch (error) {
    console.error("Error parsing menu text with Gemini API:", error);
    throw new Error("Failed to parse menu. The AI was unable to structure the provided text. Please ensure the file contains a clear menu format.");
  }
}