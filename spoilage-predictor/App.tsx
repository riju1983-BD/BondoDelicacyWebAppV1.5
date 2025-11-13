
import React, { useState } from 'react';
import { Recipe, FeedbackItem } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import { RecipeTable } from './components/RecipeTable';
import { EditRecipeModal } from './components/EditRecipeModal';
import { PredictModal } from './components/PredictModal';
import { Icon } from './components/Icon';

const App: React.FC = () => {
  const [recipes, setRecipes] = useLocalStorage<Recipe[]>('recipes', []);
  const [feedbackHistory, setFeedbackHistory] = useLocalStorage<FeedbackItem[]>('feedbackHistory', []);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPredictModalOpen, setIsPredictModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const handleAddNewRecipe = () => {
    setSelectedRecipe(null);
    setIsEditModalOpen(true);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsEditModalOpen(true);
  };

  const handleDeleteRecipe = (recipeId: string) => {
    if (window.confirm("Are you sure you want to delete this recipe?")) {
        setRecipes(prev => prev.filter(r => r.id !== recipeId));
    }
  };
  
  const handleSaveRecipe = (recipe: Recipe) => {
    setRecipes(prev => {
        const index = prev.findIndex(r => r.id === recipe.id);
        if (index > -1) {
            const newRecipes = [...prev];
            newRecipes[index] = recipe;
            return newRecipes;
        }
        return [...prev, recipe].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });
  };
  
  const handlePredict = (recipe: Recipe) => {
      setSelectedRecipe(recipe);
      setIsPredictModalOpen(true);
  };

  const handleFeedback = (feedback: FeedbackItem) => {
      setFeedbackHistory(prev => [...prev, feedback]);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans p-4 sm:p-6 lg:p-8">
      <main className="max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <div className="text-center sm:text-left">
                <h1 className="text-4xl sm:text-5xl font-bold text-emerald-600 dark:text-emerald-400">Recipe Dashboard</h1>
                <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">Manage recipes and predict spoilage with AI.</p>
            </div>
            <button
                onClick={handleAddNewRecipe}
                className="flex-shrink-0 flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-colors duration-200"
            >
                <Icon type="plus" className="w-5 h-5"/>
                Add New Recipe
            </button>
        </header>

        <RecipeTable 
            recipes={recipes}
            onEdit={handleEditRecipe}
            onDelete={handleDeleteRecipe}
            onPredict={handlePredict}
        />
        
        <EditRecipeModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSave={handleSaveRecipe}
            recipeToEdit={selectedRecipe}
        />
        
        <PredictModal
            isOpen={isPredictModalOpen}
            onClose={() => setIsPredictModalOpen(false)}
            recipe={selectedRecipe}
            feedbackHistory={feedbackHistory}
            onFeedback={handleFeedback}
        />

      </main>
    </div>
  );
};

export default App;
