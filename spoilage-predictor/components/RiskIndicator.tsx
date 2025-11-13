import React from 'react';
import { Icon } from './Icon';

interface RiskIndicatorProps {
  message: string;
}

export const RiskIndicator: React.FC<RiskIndicatorProps> = ({ message }) => {
  return (
    <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 animate-fade-in-fast" role="alert">
      <Icon type="warning" className="w-4 h-4" />
      <span className="text-xs font-medium">{message}</span>
    </div>
  );
};