// FIX: Added default import for 'React' to use React.createElement.
import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';

// Define the shape of the context
interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

// Create the context with a default value
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Define the provider component
// FIX: Explicitly type LanguageProvider as a React Function Component.
// This helps TypeScript's type inference when this component, defined in a .ts file,
// is used with JSX in a .tsx file, resolving errors about missing 'children' props.
export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState('vi');
  const [translations, setTranslations] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const response = await fetch(`/locales/${language}.json`);
        if (!response.ok) {
          throw new Error(`Failed to load translations for ${language}`);
        }
        const data = await response.json();
        setTranslations(data);
      } catch (error) {
        console.error(error);
        // Fallback to English if loading fails
        if (language !== 'en') {
            const fallbackResponse = await fetch(`/locales/en.json`);
            const fallbackData = await fallbackResponse.json();
            setTranslations(fallbackData);
        }
      }
    };

    loadTranslations();
  }, [language]);

  const t = (key: string): string => {
    return translations[key] || key;
  };

  // FIX: Replaced JSX with React.createElement because this is a .ts file.
  // JSX syntax is not supported in .ts files by default and was causing parsing errors.
  return React.createElement(LanguageContext.Provider, { value: { language, setLanguage, t } }, children);
};

// Create a custom hook to use the language context
export const useTranslations = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslations must be used within a LanguageProvider');
  }
  return context;
};