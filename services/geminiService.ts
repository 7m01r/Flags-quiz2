
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export async function getCountryFact(countryName: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `أعطني حقيقة واحدة غريبة أو مذهلة عن دولة ${countryName} باللغة العربية. اجعل الإجابة قصيرة جداً (أقل من 20 كلمة).`,
      config: {
        temperature: 0.7,
      }
    });
    return response.text || 'معلومة مشوقة عن هذه الدولة قيد التحضير...';
  } catch (error) {
    console.error("Error fetching country fact:", error);
    return "هل تعلم أن لكل دولة تاريخاً فريداً يميزها؟";
  }
}
