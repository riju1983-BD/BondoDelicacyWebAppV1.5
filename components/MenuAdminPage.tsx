import React, { useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { brandsData } from '../data';
import { Brand } from '../types';
import { Icon } from './Icon';
import { parseMenuFromText } from '../services/geminiService';

// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.4.168/build/pdf.worker.mjs`;

const Spinner: React.FC<{className?: string}> = ({ className = "h-5 w-5" }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const MenuAdminPage: React.FC = () => {
    const [selectedBrandId, setSelectedBrandId] = useState<Brand['id']>('bjale-jhole');
    const [isParsing, setIsParsing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [parsedMenu, setParsedMenu] = useState<any | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);
        setParsedMenu(null);
        setSuccessMessage(null);
        setIsParsing(true);

        try {
            if (file.type !== "application/pdf") {
                 throw new Error("Unsupported file type. Please upload a PDF file.");
            }
            const arrayBuffer = await file.arrayBuffer();
            let text = '';
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                // @ts-ignore
                text += textContent.items.map((item: { str: string }) => item.str).join(' ');
            }
            
            const result = await parseMenuFromText(text);

            // Add placeholder images to satisfy the MenuItem type
            const menuWithPlaceholders = result.map(category => ({
                ...category,
                items: category.items.map(item => ({
                    ...item,
                    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop'
                }))
            }));

            setParsedMenu(menuWithPlaceholders);

        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to process file.");
        } finally {
            setIsParsing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSaveMenu = () => {
        if (!parsedMenu) {
            setError("No menu to save. Please parse a file first.");
            return;
        }
        try {
            localStorage.setItem(`menu_${selectedBrandId}`, JSON.stringify(parsedMenu));
            setSuccessMessage(`Menu for ${brandsData[selectedBrandId].name} saved successfully!`);
        } catch (e) {
            setError("Could not save menu to local storage. It might be full.");
            console.error(e);
        }
    };
    
    const handleNavigate = (route: string) => {
        window.location.hash = route;
    };
    
    return (
        <div className="min-h-screen bg-gray-800 text-white p-4 sm:p-6 lg:p-8 flex items-center justify-center">
            <div className="w-full max-w-2xl bg-gray-900 rounded-lg shadow-2xl p-8">
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-serif">Menu Management</h1>
                    <p className="text-gray-400 mt-2">Upload a PDF to parse and update a brand's menu.</p>
                </header>
                
                <div className="space-y-6">
                     {error && (
                        <div className="p-3 bg-red-900/50 border border-red-600 text-red-200 rounded-md animate-fade-in">
                            <p>{error}</p>
                        </div>
                    )}
                    {successMessage && (
                        <div className="p-3 bg-green-900/50 border border-green-600 text-green-200 rounded-md animate-fade-in">
                            <p>{successMessage}</p>
                        </div>
                    )}

                    <div>
                        <label htmlFor="brand-select" className="block text-sm font-medium text-gray-300 mb-1">Select Brand</label>
                        <select
                            id="brand-select"
                            value={selectedBrandId}
                            onChange={(e) => setSelectedBrandId(e.target.value as Brand['id'])}
                            className="block w-full rounded-md border-gray-600 bg-gray-800 py-2 px-3 text-white focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm"
                        >
                            {Object.values(brandsData).map(brand => (
                                <option key={brand.id} value={brand.id}>{brand.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="text-center p-6 border-2 border-dashed border-gray-600 rounded-lg">
                        <Icon type="upload-cloud" className="mx-auto h-12 w-12 text-gray-500" />
                        <p className="mt-2 text-sm text-gray-400">
                            <label htmlFor="file-upload" className="font-semibold text-cyan-400 cursor-pointer hover:underline">
                                Upload a PDF menu
                                <input ref={fileInputRef} id="file-upload" type="file" className="sr-only" accept=".pdf" onChange={handleFileChange} disabled={isParsing} />
                            </label>
                        </p>
                        {isParsing && (
                            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-400">
                                <Spinner className="w-4 h-4" />
                                <span>AI is parsing your menu... this may take a moment.</span>
                            </div>
                        )}
                    </div>
                    
                    {parsedMenu && (
                        <div className="animate-fade-in">
                            <h3 className="text-lg font-semibold mb-2">Parsed Menu Preview:</h3>
                            <pre className="bg-gray-800 p-4 rounded-md text-sm max-h-60 overflow-auto border border-gray-700">
                                {JSON.stringify(parsedMenu, null, 2)}
                            </pre>
                            <button
                                onClick={handleSaveMenu}
                                className="mt-4 w-full rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
                            >
                                Save This Menu for {brandsData[selectedBrandId].name}
                            </button>
                        </div>
                    )}
                </div>

                <div className="text-center mt-8">
                     <button onClick={() => handleNavigate('#')} className="text-sm text-cyan-400 hover:underline bg-transparent border-none p-0 cursor-pointer">← Back to Main Site</button>
                </div>
            </div>
        </div>
    );
};

export default MenuAdminPage;