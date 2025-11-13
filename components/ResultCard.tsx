
import React, { useState } from 'react';
import { PredictionResult } from '../types';
import { Icon } from './Icon';

interface ResultCardProps {
  result: PredictionResult;
  onFeedbackSubmit: (actualDate: string) => void;
}

const formatDate = (dateString: string) => {
    try {
        const date = new Date(dateString);
        // Adjust for timezone offset to prevent date from being off by one day
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(date.getTime() + userTimezoneOffset);

        return adjustedDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    } catch (e) {
        return dateString;
    }
}

export const ResultCard: React.FC<ResultCardProps> = ({ result, onFeedbackSubmit }) => {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackDate, setFeedbackDate] = useState('');

  const handleFeedbackFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedbackDate) {
      onFeedbackSubmit(feedbackDate);
      setFeedbackSubmitted(true);
      setShowFeedbackForm(false);
    }
  };


  return (
    <div className="bg-emerald-50 dark:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-700 rounded-lg p-6 mt-6 transition-all duration-500 ease-in-out transform animate-fade-in">
      <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200">Prediction Result</h3>
      <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-shrink-0 bg-emerald-100 dark:bg-emerald-800 p-3 rounded-full">
          <Icon type="calendar" className="w-8 h-8 text-emerald-600 dark:text-emerald-300" />
        </div>
        <div>
          <p className="text-sm text-emerald-700 dark:text-emerald-300">Predicted Spoilage Date:</p>
          <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{formatDate(result.spoilageDate)}</p>
        </div>
      </div>
      <div className="mt-6 border-t border-emerald-200 dark:border-emerald-700 pt-4">
        <div className="flex items-start gap-3">
            <Icon type="info" className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
                 <h4 className="font-medium text-emerald-800 dark:text-emerald-200">Reasoning</h4>
                 <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">{result.reasoning}</p>
            </div>
        </div>
      </div>

      {/* Feedback Section */}
      <div className="mt-6 border-t border-emerald-200 dark:border-emerald-700 pt-4">
        {feedbackSubmitted ? (
             <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-300 animate-fade-in-fast">
                <Icon type="check-circle" className="w-5 h-5" />
                <p className="text-sm font-medium">Thank you for your feedback!</p>
            </div>
        ) : (
            <>
                {!showFeedbackForm && (
                    <button
                        onClick={() => setShowFeedbackForm(true)}
                        className="text-sm font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
                    >
                        Provide Feedback to Improve AI
                    </button>
                )}

                {showFeedbackForm && (
                    <form onSubmit={handleFeedbackFormSubmit} className="space-y-3 animate-fade-in-fast">
                        <label htmlFor="feedback-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                           What was the actual spoilage date?
                        </label>
                        <div className="flex items-center gap-3">
                           <input
                            type="date"
                            id="feedback-date"
                            value={feedbackDate}
                            onChange={(e) => setFeedbackDate(e.target.value)}
                            required
                            className="block w-full max-w-xs rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 py-2 px-3 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm"
                           />
                           <button
                             type="submit"
                             className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                           >
                            Submit
                           </button>
                        </div>
                    </form>
                )}
            </>
        )}
      </div>
    </div>
  );
};
