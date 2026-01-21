/**
 * Gemini AI Service
 * Integration with Google's Gemini AI for DevManager Copilot
 */

import { GoogleGenAI } from "@google/genai";

// Environment-safe API key access
const getApiKey = (): string => {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        return import.meta.env.VITE_GEMINI_API_KEY || '';
    }
    if (typeof process !== 'undefined' && process.env) {
        return process.env.API_KEY || process.env.GEMINI_API_KEY || '';
    }
    return '';
};

const apiKey = getApiKey();
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export interface CopilotContext {
    dashboardMetrics?: {
        utilizationRate: number;
        openRoles: number;
        riskOfDelay: number;
        skillGaps: string[];
    };
    currentProject?: {
        id: string;
        name: string;
        status: string;
    };
    userRole?: string;
}

const DEFAULT_SYSTEM_INSTRUCTION = `You are the DevManager Copilot, an AI assistant for an Intelligent Agents Management Platform.
Your goal is to help managers analyze project health, team utilization, agent performance, and provide insights.

Key Responsibilities:
- Analyze project metrics and identify risks
- Suggest resource allocation improvements
- Provide insights on agent performance and optimization
- Answer questions about the platform and best practices

Keep responses concise, professional, and actionable. Use formatting like bullet points when analyzing data.
Respond in the same language as the user's query.`;

export const sendCopilotMessage = async (
    message: string, 
    context?: CopilotContext
): Promise<string> => {
    try {
        if (!ai) {
            return "DevManager Copilot is currently offline (Missing API Key). Please configure VITE_GEMINI_API_KEY.";
        }

        const contextString = context ? `
Current Dashboard Context:
- Utilization Rate: ${context.dashboardMetrics?.utilizationRate || 'N/A'}%
- Open Roles: ${context.dashboardMetrics?.openRoles || 'N/A'}
- Risk of Delay: ${context.dashboardMetrics?.riskOfDelay || 'N/A'}%
- Skill Gaps: ${context.dashboardMetrics?.skillGaps?.join(', ') || 'None identified'}
${context.currentProject ? `\nCurrent Project: ${context.currentProject.name} (${context.currentProject.status})` : ''}
${context.userRole ? `\nUser Role: ${context.userRole}` : ''}
` : '';

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [{
                role: 'user',
                parts: [{ 
                    text: contextString 
                        ? `${contextString}\n\nUser Query: ${message}` 
                        : message 
                }]
            }],
            config: {
                systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,
            }
        });

        return response.text || "I couldn't generate a response at this time.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Sorry, I encountered an error connecting to the AI service. Please try again.";
    }
};

export const analyzeDashboardData = async (data: any): Promise<string> => {
    const prompt = `Analyze the following dashboard data and provide key insights and recommendations:
    ${JSON.stringify(data, null, 2)}
    
    Focus on:
    1. Potential risks or blockers
    2. Resource optimization opportunities
    3. Actionable recommendations`;

    return sendCopilotMessage(prompt);
};

export default { sendCopilotMessage, analyzeDashboardData };
