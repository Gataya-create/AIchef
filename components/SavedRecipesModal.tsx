// FIX: Implemented the SavedRecipesModal component.
import React from 'react';
import { Recipe } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface SavedRecipesModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
}

const SavedRecipesModal: React.FC<SavedRecipesModalProps> = ({ isOpen, onClose, recipes, onSelectRecipe }) => {
  const { t } = useTranslations();

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative mx-auto p-8 border w-full max-w-lg shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-semibold text-gray-800">{t('saved_recipes')}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>
        <div>
          {recipes.length > 0 ? (
            <ul className="space-y-4 max-h-96 overflow-y-auto">
              {recipes.map((recipe) => (
                <li key={recipe.id} 
                    className="p-4 border rounded-md hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => {
                        onSelectRecipe(recipe);
                        onClose();
                    }}
                >
                  <p className="font-semibold text-lg text-emerald-700">{recipe.recipeName}</p>
                  <p className="text-sm text-gray-500">{recipe.description}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center py-4">{t('no_saved_recipes')}</p>
          )}
        </div>
        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SavedRecipesModal;