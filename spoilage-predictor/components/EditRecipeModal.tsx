
import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { Recipe, Ingredient } from '../types';
import { parseRecipeText } from '../services/geminiService';
import { Modal } from './Modal';
import { Icon } from './Icon';

// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.4.168/build/pdf.worker.mjs`;

interface EditRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (recipe: Recipe) => void;
  recipeToEdit: Recipe | null;
}

const Spinner: React.FC<{className?: string}> = ({ className = "h-5 w-5" }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export const EditRecipeModal: React.FC<EditRecipeModalProps> = ({ isOpen, onClose, onSave, recipeToEdit }) => {
  const [recipeName, setRecipeName] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [sourceText, setSourceText] = useState<string | undefined>('');
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (recipeToEdit) {
      setRecipeName(recipeToEdit.name);
      setIngredients(recipeToEdit.ingredients);
      setSourceText(recipeToEdit.sourceText);
    } else {
      // Reset for new recipe
      setRecipeName('');
      setIngredients([]);
      setSourceText('');
    }
    setError(null);
  }, [recipeToEdit, isOpen]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsParsing(true);

    try {
        const arrayBuffer = await file.arrayBuffer();
        let text = '';
        if (file.type === "application/pdf") {
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                // @ts-ignore
                text += textContent.items.map((item: { str: string }) => item.str).join(' ');
            }
        } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
            const result = await mammoth.extractRawText({ arrayBuffer });
            text = result.value;
        } else {
            throw new Error("Unsupported file type. Please upload a PDF or DOCX file.");
        }
        
        setSourceText(text);
        if(!recipeName) {
            setRecipeName(file.name.replace(/\.[^/.]+$/, "")); // Use file name as recipe name
        }
        
        const parsedIngredients = await parseRecipeText(text);
        setIngredients(parsedIngredients);

    } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to process file.");
    } finally {
        setIsParsing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleIngredientChange = (index: number, field: keyof Ingredient, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setIngredients(newIngredients);
  };
  
  const addIngredient = () => {
    setIngredients([...ingredients, { id: self.crypto.randomUUID(), name: '', quantity: '' }]);
  };

  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter(ing => ing.id !== id));
  };
  
  const handleSave = () => {
    if (!recipeName.trim()) {
        setError("Recipe name is required.");
        return;
    }
    const finalRecipe: Recipe = {
      id: recipeToEdit?.id || self.crypto.randomUUID(),
      name: recipeName,
      ingredients: ingredients,
      sourceText: sourceText,
      createdAt: recipeToEdit?.createdAt || new Date().toISOString(),
    };
    onSave(finalRecipe);
    onClose();
  };

  const modalTitle = recipeToEdit ? "Edit Recipe" : "Add New Recipe";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
        <div className="space-y-6">
            {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-600 text-red-800 dark:text-red-200 rounded-md">
                    <p>{error}</p>
                </div>
            )}
            <div>
                <label htmlFor="recipeName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Recipe Name</label>
                <input
                    type="text"
                    id="recipeName"
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                    className="block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 py-2 px-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm"
                    placeholder="e.g., Chocolate Chip Cookies"
                />
            </div>
            
            <div className="text-center p-6 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
                <Icon type="upload-cloud" className="mx-auto h-12 w-12 text-slate-400" />
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    <label htmlFor="file-upload" className="font-semibold text-emerald-600 cursor-pointer hover:underline">
                        Upload a file
                        <input ref={fileInputRef} id="file-upload" type="file" className="sr-only" accept=".pdf,.docx" onChange={handleFileChange} disabled={isParsing} />
                    </label>
                    <span className="ml-1">to automatically parse ingredients.</span>
                </p>
                <p className="text-xs text-slate-500">PDF or DOCX</p>
                {isParsing && (
                    <div className="flex items-center justify-center gap-2 mt-2 text-sm text-slate-500 dark:text-slate-400">
                        <Spinner className="w-4 h-4" />
                        <span>AI is parsing your recipe...</span>
                    </div>
                )}
            </div>

            <div>
                <h3 className="text-md font-medium text-slate-800 dark:text-slate-200 mb-2">Ingredients</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {ingredients.map((ing, index) => (
                        <div key={ing.id} className="grid grid-cols-12 gap-2 items-center">
                            <input
                                type="text"
                                value={ing.quantity}
                                onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                                placeholder="e.g., 1 cup"
                                className="col-span-4 block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 py-1.5 px-3 text-sm"
                            />
                            <input
                                type="text"
                                value={ing.name}
                                onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                                placeholder="e.g., Flour"
                                className="col-span-7 block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 py-1.5 px-3 text-sm"
                            />
                            <button onClick={() => removeIngredient(ing.id)} className="col-span-1 text-slate-400 hover:text-red-500">
                                <Icon type="trash" className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
                 <button onClick={addIngredient} className="mt-3 flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-500">
                    <Icon type="plus" className="w-4 h-4" />
                    Add Ingredient
                </button>
            </div>
            
            <footer className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button onClick={onClose} className="rounded-md bg-white dark:bg-slate-700 px-3 py-2 text-sm font-semibold text-slate-900 dark:text-slate-200 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600">
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={isParsing}
                    className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:bg-slate-400"
                >
                    {isParsing ? 'Parsing...' : 'Save Recipe'}
                </button>
            </footer>
        </div>
    </Modal>
  );
};
