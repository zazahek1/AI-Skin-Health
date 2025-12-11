
export interface TreatmentStep {
  step: number;
  description: string;
  duration: string;
}

export interface AnalysisResult {
  condition: string;
  description: string;
  treatmentPlan: TreatmentStep[];
}

export interface FullAnalysis {
    diagnosis: AnalysisResult;
    healingImages: string[];
}
