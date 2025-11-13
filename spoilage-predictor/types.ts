
export interface Ingredient {
  id: string;
  name: string;
  quantity: string;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: Ingredient[];
  sourceText?: string;
  createdAt: string;
}

export interface PredictionInputs {
  prepDate: string;
  freezingTemp: number;
  timeOutside: number;
  timeInside: number;
  outsideTemp: number;
}

export interface PredictionResult {
  spoilageDate: string;
  reasoning: string;
}

export interface FeedbackItem {
  recipe: Recipe;
  inputs: PredictionInputs;
  actualSpoilageDate: string;
}
