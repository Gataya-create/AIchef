// No longer need html2canvas, so its typings are removed.
declare global {
  interface Window {
    jspdf: any;
  }
}

import React, { useState } from 'react';
import { Recipe } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { interRegularBase64, interBoldBase64 } from './inter-fonts';

// FIX: Added interface definition for RecipeDisplayProps to resolve TypeScript error.
interface RecipeDisplayProps {
  recipe: Recipe;
  onSave: (recipe: Recipe) => void;
  isSaved: boolean;
}

const RecipeDisplay: React.FC<RecipeDisplayProps> = ({ recipe, onSave, isSaved }) => {
  const { t } = useTranslations();
  const [isDownloading, setIsDownloading] = useState(false);

  const slugify = (text: string) => {
    return text
        .toString()
        .normalize('NFD') // split an accented letter into the base letter and the accent
        .replace(/[\u0300-\u036f]/g, '') // remove all previously split accents
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-') // replace spaces with -
        .replace(/[^\w-]+/g, '') // remove all non-word chars
        .replace(/--+/g, '-'); // replace multiple - with single -
  };


  const handleDownloadPDF = async () => {
    if (!window.jspdf) {
      console.error("jsPDF library not loaded yet.");
      return;
    }

    setIsDownloading(true);
    try {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // --- Load Custom Fonts for UTF-8 Support ---
      // Use the Base64 encoded fonts imported locally to avoid network requests.
      pdf.addFileToVFS('Inter-Regular.ttf', interRegularBase64);
      pdf.addFont('Inter-Regular.ttf', 'Inter', 'normal');
      
      pdf.addFileToVFS('Inter-Bold.ttf', interBoldBase64);
      pdf.addFont('Inter-Bold.ttf', 'Inter', 'bold');

      const pageHeight = pdf.internal.pageSize.getHeight();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 15;
      let yPos = margin;

      // Helper function to check and add new page if content exceeds page height
      const checkPageBreak = (neededHeight: number) => {
        if (yPos + neededHeight > pageHeight - margin) {
          pdf.addPage();
          yPos = margin;
        }
      };

      // --- Title ---
      pdf.setFontSize(22);
      pdf.setFont('Inter', 'bold');
      const titleLines = pdf.splitTextToSize(recipe.recipeName, pageWidth - margin * 2);
      checkPageBreak(titleLines.length * 8);
      pdf.text(titleLines, margin, yPos);
      yPos += titleLines.length * 8 + 5;

      // --- Description ---
      pdf.setFontSize(11);
      pdf.setFont('Inter', 'normal');
      const descriptionLines = pdf.splitTextToSize(recipe.description, pageWidth - margin * 2);
      checkPageBreak(descriptionLines.length * 5);
      pdf.text(descriptionLines, margin, yPos);
      yPos += descriptionLines.length * 5 + 10;

      // --- Image ---
      if (recipe.imageUrl) {
        const img = new Image();
        img.src = recipe.imageUrl;
        // Ensure image is loaded to get its dimensions
        await new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve; // Continue even if image fails to load
        });

        if (img.width > 0 && img.height > 0) {
            const aspectRatio = img.width / img.height;
            let pdfImgWidth = pageWidth - margin * 2;
            let pdfImgHeight = pdfImgWidth / aspectRatio;
            
            if(pdfImgHeight > (pageHeight - yPos - margin)) {
               pdfImgHeight = pageHeight - margin * 2;
               pdfImgWidth = pdfImgHeight * aspectRatio;
               if (yPos > margin) {
                 pdf.addPage();
                 yPos = margin;
               }
            }
            checkPageBreak(pdfImgHeight);
            pdf.addImage(recipe.imageUrl, 'PNG', margin, yPos, pdfImgWidth, pdfImgHeight);
            yPos += pdfImgHeight + 10;
        }
      }
      
      // --- Ingredients ---
      checkPageBreak(16);
      pdf.setFontSize(16);
      pdf.setFont('Inter', 'bold');
      pdf.text(t('ingredients'), margin, yPos);
      yPos += 10;
      
      pdf.setFontSize(11);
      pdf.setFont('Inter', 'normal');
      recipe.ingredients.forEach(ing => {
           const text = `• ${ing.amount} ${ing.name}`;
           const lines = pdf.splitTextToSize(text, pageWidth - margin * 2);
           checkPageBreak(lines.length * 6);
           pdf.text(lines, margin, yPos);
           yPos += lines.length * 6;
      });

      yPos += 10;

      // --- Instructions ---
      checkPageBreak(16);
      pdf.setFontSize(16);
      pdf.setFont('Inter', 'bold');
      pdf.text(t('instructions'), margin, yPos);
      yPos += 10;
      
      pdf.setFontSize(11);
      pdf.setFont('Inter', 'normal');
      recipe.instructions.forEach((step, index) => {
           const text = `${index + 1}. ${step}`;
           const lines = pdf.splitTextToSize(text, pageWidth - margin * 2 - 5);
           checkPageBreak(lines.length * 6 + 2);
           pdf.text(lines, margin, yPos);
           yPos += lines.length * 6 + 2;
      });

      pdf.save(`${slugify(recipe.recipeName)}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md animate-fade-in">
      <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
        <h2 className="text-3xl font-bold text-gray-800">{recipe.recipeName}</h2>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-white transition-colors duration-300 ${
              isDownloading 
                ? 'bg-blue-300 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            {isDownloading ? t('downloading_pdf') : t('download_pdf')}
          </button>
          <button
            onClick={() => onSave(recipe)}
            disabled={isSaved}
            className={`px-4 py-2 rounded-md font-semibold text-white transition-colors duration-300 ${
              isSaved 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isSaved ? t('recipe_saved') : t('save_recipe')}
          </button>
        </div>
      </div>

      <p className="text-gray-600 mb-6">{recipe.description}</p>

      {recipe.imageUrl && (
        <img 
          src={recipe.imageUrl} 
          alt={recipe.recipeName}
          crossOrigin="anonymous"
          className="w-full h-80 object-cover rounded-md mb-6" 
        />
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-2xl font-semibold mb-3">{t('ingredients')}</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index}>
                <span className="font-medium">{ingredient.amount}</span> {ingredient.name}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-2xl font-semibold mb-3">{t('instructions')}</h3>
          <ol className="list-decimal list-inside space-y-3 text-gray-700">
            {recipe.instructions.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
};

export default RecipeDisplay;