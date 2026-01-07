import { GoogleGenAI } from "@google/genai";

// Ensure API Key is available - Handle browser environments safely
const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) || '';
const ai = new GoogleGenAI({ apiKey });

export const sendCopilotMessage = async (message: string, context?: string): Promise<string> => {
    try {
        if (!apiKey) {
            return "DevManager Copilot is currently offline (Missing API Key).";
        }

        const model = 'gemini-3-flash-preview';
        const systemInstruction = `You are the DevManager Copilot, an AI assistant for a Talent Management Platform.
        Your goal is to help managers analyze project health, employee utilization, and hiring needs.
        
        Current Dashboard Context:
        - Utilization Rate: 87%
        - Open Roles: 12
        - Risk of Delay: 15%
        - Skill Gaps: React Native (Low Coverage), Python AI (Medium Coverage).
        
        Keep responses concise, professional, and helpful. Use formatting like bullet points if analyzing data.`;

        const response = await ai.models.generateContent({
            model,
            contents: [{
                role: 'user',
                parts: [{ text: context ? `Context: ${context}\n\nUser Query: ${message}` : message }]
            }],
            config: {
                systemInstruction,
            }
        });

        return response.text || "I couldn't generate a response at this time.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Sorry, I encountered an error connecting to the AI service.";
    }
};