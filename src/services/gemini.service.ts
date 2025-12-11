
import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from '@google/genai';
import { AnalysisResult, FullAnalysis, TreatmentStep } from '../models/analysis.model';

// This is a placeholder for the environment variable.
// In a real Applet environment, this would be provided.
const process = { env: { API_KEY: 'YOUR_API_KEY_HERE' } };


@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private readonly ai: GoogleGenAI;
  private readonly textModel = 'gemini-2.5-flash';
  private readonly imageModel = 'imagen-4.0-generate-001';

  constructor() {
    // IMPORTANT: Replace 'YOUR_API_KEY_HERE' with your actual API key 
    // or ensure process.env.API_KEY is properly configured in your deployment environment.
    if (process.env.API_KEY === 'YOUR_API_KEY_HERE') {
      console.warn("Using placeholder API Key. Please replace it with your actual Gemini API key.");
    }
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async getAnalysisAndHealingVisuals(imageBase64: string, imageType: string): Promise<FullAnalysis> {
    const diagnosis = await this.getDiagnosis(imageBase64, imageType);
    const healingImages = await this.generateHealingImages(diagnosis);
    return { diagnosis, healingImages };
  }

  private async getDiagnosis(imageBase64: string, imageType: string): Promise<AnalysisResult> {
    const prompt = `You are a dermatology expert. Analyze this skin image. Identify the most likely condition, provide a brief description, and create a standard, step-by-step medical treatment plan. Provide a concise plan with 3-4 steps.
    
    IMPORTANT: Respond ONLY with a JSON object that strictly adheres to the provided schema. Do not include any markdown formatting like \`\`\`json.`;
    
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: imageType,
      },
    };

    const response = await this.ai.models.generateContent({
      model: this.textModel,
      contents: { parts: [{ text: prompt }, imagePart] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            condition: { type: Type.STRING, description: 'The name of the diagnosed skin condition.' },
            description: { type: Type.STRING, description: 'A brief, professional description of the condition.' },
            treatmentPlan: {
              type: Type.ARRAY,
              description: 'A step-by-step treatment plan.',
              items: {
                type: Type.OBJECT,
                properties: {
                  step: { type: Type.INTEGER },
                  description: { type: Type.STRING, description: 'Detailed action for this step of the treatment.' },
                  duration: { type: Type.STRING, description: 'Estimated duration for this step (e.g., "7-10 days").' },
                },
                required: ['step', 'description', 'duration'],
              },
            },
          },
          required: ['condition', 'description', 'treatmentPlan'],
        },
      },
    });

    const jsonString = response.text.trim();
    return JSON.parse(jsonString) as AnalysisResult;
  }

  private async generateHealingImages(diagnosis: AnalysisResult): Promise<string[]> {
    const imagePromises: Promise<string>[] = [];

    for (const step of diagnosis.treatmentPlan) {
      const prompt = `A photorealistic image of skin with '${diagnosis.condition}', that is in the process of healing after following the treatment: "${step.description}". The skin should show visible improvement appropriate for this stage.`;
      
      imagePromises.push(this.generateImage(prompt));
    }

    return Promise.all(imagePromises);
  }

  private async generateImage(prompt: string): Promise<string> {
    const response = await this.ai.models.generateImages({
        model: this.imageModel,
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        },
    });

    return response.generatedImages[0].image.imageBytes;
  }
}
