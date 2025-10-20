import React from 'react';
import { DishSuggestion } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface DishSuggestionDisplayProps {
  suggestions: DishSuggestion[];
  onSelect: (suggestion: DishSuggestion) => void;
}

const DishSuggestionDisplay: React.FC<DishSuggestionDisplayProps> = ({ suggestions, onSelect }) => {
    const { t } = useTranslations();

    return (
        <div className="bg-white p-6 rounded-lg shadow-md animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
                {t('dish_suggestion_title')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {suggestions.map((suggestion, index) => (
                    <button 
                        key={index} 
                        onClick={() => onSelect(suggestion)}
                        className="group rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 text-left"
                        aria-label={`Select recipe for ${suggestion.dishName}`}
                    >
                        <div className="relative">
                            <img 
                                src={suggestion.imageUrl} 
                                alt={suggestion.dishName} 
                                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-10 transition-colors duration-300"></div>
                        </div>
                        <div className="p-4 bg-white">
                            <h3 className="text-lg font-semibold text-gray-800 truncate group-hover:text-emerald-600">
                                {suggestion.dishName}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1 h-10 overflow-hidden">
                                {suggestion.description}
                            </p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default DishSuggestionDisplay;
