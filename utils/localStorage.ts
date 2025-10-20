// FIX: Implemented localStorage utility functions for recipes.
import { Recipe } from '../types';

const SAVED_RECIPES_KEY = 'savedRecipes';

export const getSavedRecipes = (): Recipe[] => {
  try {
    const savedRecipes = localStorage.getItem(SAVED_RECIPES_KEY);
    return savedRecipes ? JSON.parse(savedRecipes) : [];
  } catch (error) {
    console.error('Error retrieving recipes from local storage:', error);
    return [];
  }
};

export const saveRecipe = (recipe: Recipe): void => {
  try {
    const savedRecipes = getSavedRecipes();
    // Avoid saving duplicate recipes by checking the unique ID
    if (!savedRecipes.some(r => r.id === recipe.id)) {
      const updatedRecipes = [...savedRecipes, recipe];
      localStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify(updatedRecipes));
    }
  } catch (error) {
    console.error('Error saving recipe to local storage:', error);
  }
};