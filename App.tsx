// FIX: Implemented the main App component.
import React, { useState, useEffect } from 'react';
import { generateRecipe, generateDishSuggestions } from './services/geminiService';
import { DishSuggestion, Recipe } from './types';
import { useTranslations } from './hooks/useTranslations';
import RecipeDisplay from './components/RecipeDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import SavedRecipesModal from './components/SavedRecipesModal';
import { getSavedRecipes, saveRecipe as saveRecipeToStorage } from './utils/localStorage';
import DishSuggestionDisplay from './components/DishSuggestionDisplay';

function App() {
  const { t, setLanguage, language } = useTranslations();
  const [activeTab, setActiveTab] = useState<'ingredients' | 'dish'>('ingredients');
  const [ingredients, setIngredients] = useState('');
  const [dishRequest, setDishRequest] = useState('');
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [dishSuggestions, setDishSuggestions] = useState<DishSuggestion[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setSavedRecipes(getSavedRecipes());
  }, []);

  const handleGenerateRecipe = async () => {
    if (activeTab === 'ingredients' && !ingredients.trim()) {
      setError(t('error_no_ingredients'));
      return;
    }
    if (activeTab === 'dish' && !dishRequest.trim()) {
      setError(t('error_no_dish_request'));
      return;
    }

    setLoading(true);
    setError(null);
    setRecipe(null);
    setDishSuggestions(null);
    try {
      if (activeTab === 'ingredients') {
        const request = {
          type: activeTab,
          value: ingredients,
        };
        const result = await generateRecipe(request, language);
        if (result) {
          setRecipe(result);
        } else {
          setError(t('error_generating_recipe'));
        }
      } else { // activeTab === 'dish'
        const result = await generateDishSuggestions(dishRequest, language);
        if (result && result.length > 0) {
          setDishSuggestions(result);
        } else {
          setError(t('error_generating_recipe'));
        }
      }
    } catch (err) {
      setError(t('error_generating_recipe'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectDish = async (suggestion: DishSuggestion) => {
    setLoading(true);
    setError(null);
    setRecipe(null);
    setDishSuggestions(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
        const request = {
            type: 'dish' as const,
            value: suggestion.dishName,
        };
        const result = await generateRecipe(request, language);
        if (result) {
            setRecipe(result);
        } else {
            setError(t('error_generating_recipe'));
        }
    } catch (err) {
        setError(t('error_generating_recipe'));
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  const handleSaveRecipe = (recipeToSave: Recipe) => {
    saveRecipeToStorage(recipeToSave);
    setSavedRecipes(getSavedRecipes());
  };

  const getTabClassName = (tabName: 'ingredients' | 'dish') => {
    return `px-4 py-2 text-sm font-semibold rounded-md focus:outline-none transition-colors duration-200 ${
      activeTab === tabName
        ? 'bg-emerald-600 text-white'
        : 'text-gray-600 hover:bg-emerald-100'
    }`;
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <header className="text-center mb-8">
          <div className="flex justify-center items-center gap-4 mb-4 relative">
            <h1 className="text-5xl font-bold text-emerald-600">{t('app_title')}</h1>
            <div className="absolute top-0 right-0">
                <select 
                    value={language} 
                    onChange={(e) => setLanguage(e.target.value)} 
                    className="bg-white border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    aria-label="Select language"
                >
                    <option value="en">English</option>
                    <option value="vi">Tiếng Việt</option>
                </select>
            </div>
          </div>
          <p className="text-xl text-gray-500">{t('app_subtitle')}</p>
        </header>

        <main>
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <div className="flex gap-2 border border-gray-200 rounded-lg p-1">
                <button onClick={() => setActiveTab('ingredients')} className={getTabClassName('ingredients')}>
                  {t('tab_ingredients')}
                </button>
                <button onClick={() => setActiveTab('dish')} className={getTabClassName('dish')}>
                  {t('tab_dish_request')}
                </button>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-emerald-600 hover:text-emerald-800 font-medium transition-colors"
              >
                {t('view_saved_recipes')} ({savedRecipes.length})
              </button>
            </div>
            
            {activeTab === 'ingredients' ? (
              <div>
                <h2 className="text-xl font-semibold mb-2">{t('ingredients_prompt')}</h2>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                  placeholder={t('ingredients_placeholder')}
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                />
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-semibold mb-2">{t('dish_request_prompt')}</h2>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                  placeholder={t('dish_request_placeholder')}
                  value={dishRequest}
                  onChange={(e) => setDishRequest(e.target.value)}
                />
              </div>
            )}

            <button
              onClick={handleGenerateRecipe}
              className="mt-4 w-full bg-emerald-600 text-white py-3 px-4 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-300 disabled:bg-emerald-300"
              disabled={loading}
            >
              {loading ? t('generating_recipe') : t('generate_recipe')}
            </button>
          </div>
          
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-8" role="alert">{error}</div>}

          {loading && <LoadingSpinner text={t('loading_text')} />}

          {dishSuggestions && !loading && (
            <DishSuggestionDisplay 
              suggestions={dishSuggestions} 
              onSelect={handleSelectDish} 
            />
          )}

          {recipe && !loading && (
            <RecipeDisplay 
              recipe={recipe} 
              onSave={handleSaveRecipe} 
              isSaved={savedRecipes.some(r => r.id === recipe.id)}
            />
          )}
        </main>
        
        <SavedRecipesModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          recipes={savedRecipes}
          onSelectRecipe={(selectedRecipe) => {
            setRecipe(selectedRecipe);
            setDishSuggestions(null);
            setIsModalOpen(false);
            // Optional: scroll to the recipe display
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          }}
        />
      </div>
    </div>
  );
}

export default App;
