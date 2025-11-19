import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface SimulatedPost {
  hasNewContent: boolean;
  type?: 'post' | 'story';
  caption?: string;
  imageUrl?: string; // We will use placeholder images
}

// This function simulates checking Instagram by asking Gemini to generate a fake "latest post" scenario
// In a real app, this would be replaced by an API call to a scraping backend (e.g., Python/Instaloader)
export const simulateInstagramCheck = async (username: string): Promise<SimulatedPost> => {
  try {
    const prompt = `
      Simulate an Instagram check for user "@${username}".
      Randomly decide (50% chance) if they have posted a new photo or story in the last 30 minutes.
      If yes, generate a creative caption they might have written.
      Return a JSON object.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hasNewContent: { type: Type.BOOLEAN },
            type: { type: Type.STRING, enum: ['post', 'story'] },
            caption: { type: Type.STRING },
          },
          required: ["hasNewContent"]
        }
      }
    });

    if (!response.text) {
      throw new Error("No response from AI");
    }

    const data = JSON.parse(response.text);
    
    // Add a random placeholder image since AI generates text
    if (data.hasNewContent) {
      const randomId = Math.floor(Math.random() * 1000);
      data.imageUrl = `https://picsum.photos/seed/${randomId}/400/400`;
    }

    return data as SimulatedPost;

  } catch (error) {
    console.error("Simulation error:", error);
    // Fallback in case of API error to keep app running
    return { hasNewContent: false };
  }
};