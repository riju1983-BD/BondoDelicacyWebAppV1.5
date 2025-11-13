import React from 'react';
import { Icon } from './Icon';

interface HelpBuddyIconProps {
  onClick: () => void;
}

const HelpBuddyIcon: React.FC<HelpBuddyIconProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 bg-cyan-600 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center z-50 hover:bg-cyan-500 hover:scale-110 transition-transform"
      aria-label="Open Help Buddy"
    >
      <Icon type="message-circle" className="w-8 h-8" />
    </button>
  );
};

export default HelpBuddyIcon;