// FIX: Implemented type definitions for Recipe and Ingredient.
export interface Ingredient {
  name: string;
  amount: string;
}

export interface Recipe {
  id: string; // Added for unique identification
  recipeName: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string[];
  imageUrl?: string; // Added for the recipe image
}

export interface DishSuggestion {
  dishName: string;
  description: string;
  imageUrl: string;
}
