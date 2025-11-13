import React, { InputHTMLAttributes } from 'react';
import { Icon } from './Icon';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: 'calendar' | 'thermometer' | 'time' | 'fridge';
  unit?: string;
  riskIndicator?: React.ReactNode;
  actionButton?: React.ReactNode;
}

export const CustomInput: React.FC<InputProps> = ({ label, icon, unit, riskIndicator, actionButton, ...props }) => {
  const hasUnit = !!unit;
  const hasActionButton = !!actionButton;
  
  let paddingRight = 'pr-4';
  if (hasUnit && hasActionButton) {
    paddingRight = 'pr-20'; // Space for button and unit
  } else if (hasActionButton) {
    paddingRight = 'pr-12'; // Space for button
  } else if (hasUnit) {
    paddingRight = 'pr-12'; // Space for unit
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label htmlFor={props.id} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
        {riskIndicator}
      </div>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Icon type={icon} className="h-5 w-5 text-slate-400" />
        </div>
        <input
          {...props}
          className={`block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 py-2 pl-10 ${paddingRight} text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm`}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {actionButton}
            {unit && (
              <span className={`text-slate-500 sm:text-sm ${hasActionButton ? 'ml-2' : ''}`}>{unit}</span>
            )}
        </div>
      </div>
    </div>
  );
};