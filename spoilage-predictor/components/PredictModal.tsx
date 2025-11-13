
import React, { useState, useCallback, useEffect } from 'react';
import { Recipe, PredictionInputs, PredictionResult, FeedbackItem } from '../types';
import { predictSpoilageDate } from '../services/geminiService';
import { Modal } from './Modal';
import { CustomInput } from './Input';
import { ResultCard } from './ResultCard';
import { RiskIndicator } from './RiskIndicator';
import { Icon } from './Icon';

interface PredictModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe | null;
  feedbackHistory: FeedbackItem[];
  onFeedback: (feedback: FeedbackItem) => void;
}

const HIGH_RISK_FREEZING_TEMP = -12;
const HIGH_RISK_TIME_OUTSIDE = 2;
const HIGH_RISK_OUTSIDE_TEMP = 25;

const Spinner: React.FC<{className?: string}> = ({ className = "h-5 w-5" }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export const PredictModal: React.FC<PredictModalProps> = ({ isOpen, onClose, recipe, feedbackHistory, onFeedback }) => {
  const [inputs, setInputs] = useState<PredictionInputs>({
    prepDate: new Date().toISOString().split('T')[0],
    freezingTemp: -18,
    timeOutside: 2,
    timeInside: 72,
    outsideTemp: 20,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingTemp, setIsFetchingTemp] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal is closed
      setResult(null);
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
  };
  
  const handleFetchTemperature = useCallback(() => { /* ... implementation from App.tsx ... */ }, []);

  const handleSubmit = useCallback(async () => {
    if (!recipe) return;
    setError(null);
    setResult(null);
    setIsLoading(true);

    try {
      const prediction = await predictSpoilageDate(recipe, inputs, feedbackHistory);
      setResult(prediction);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [recipe, inputs, feedbackHistory]);

  const handleFeedbackSubmit = (actualSpoilageDate: string) => {
    if (recipe) {
      onFeedback({ recipe, inputs, actualSpoilageDate });
    }
  };

  const modalTitle = recipe ? `Predict Spoilage for: ${recipe.name}` : '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
      {!result ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CustomInput
                label="Preparation Date"
                id="prepDate" name="prepDate" type="date"
                value={inputs.prepDate} onChange={handleInputChange}
                icon="calendar" required
            />
            <CustomInput
                label="Freezing Temperature"
                id="freezingTemp" name="freezingTemp" type="number"
                value={inputs.freezingTemp} onChange={handleNumberInputChange}
                icon="fridge" unit="°C" required
                riskIndicator={Number(inputs.freezingTemp) > HIGH_RISK_FREEZING_TEMP && <RiskIndicator message="Warmer temp increases risk" />}
            />
            <CustomInput
                label="Time Outside Freezer"
                id="timeOutside" name="timeOutside" type="number"
                value={inputs.timeOutside} onChange={handleNumberInputChange}
                icon="time" unit="hours" required
                riskIndicator={Number(inputs.timeOutside) > HIGH_RISK_TIME_OUTSIDE && <RiskIndicator message="Longer time increases risk" />}
            />
            <CustomInput
                label="Time Inside Freezer"
                id="timeInside" name="timeInside" type="number"
                value={inputs.timeInside} onChange={handleNumberInputChange}
                icon="time" unit="hours" required
            />
            <CustomInput
                label="Outside Temperature"
                id="outsideTemp" name="outsideTemp" type="number"
                value={inputs.outsideTemp} onChange={handleNumberInputChange}
                icon="thermometer" unit="°C" required
                riskIndicator={Number(inputs.outsideTemp) > HIGH_RISK_OUTSIDE_TEMP && <RiskIndicator message="Higher temp increases risk" />}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 rounded-md">
                {error}
            </div>
          )}

          <footer className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button onClick={onClose} className="rounded-md bg-white dark:bg-slate-700 px-3 py-2 text-sm font-semibold text-slate-900 dark:text-slate-200 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-40 flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:bg-slate-400"
            >
              {isLoading ? <Spinner /> : 'Run Prediction'}
            </button>
          </footer>
        </div>
      ) : (
        <ResultCard result={result} onFeedbackSubmit={handleFeedbackSubmit} />
      )}
    </Modal>
  );
};
