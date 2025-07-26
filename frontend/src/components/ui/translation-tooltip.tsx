import React from 'react';
import type { Translation } from '../../types';

interface TranslationTooltipProps {
  translations: Translation[];
  isVisible: boolean;
  position: { x: number; y: number };
  onClose: () => void;
}

// Флаги для языков
const languageFlags: Record<string, string> = {
  'pl': '🇵🇱',
  'en': '🇺🇸',
  'ru': '🇷🇺',
  'de': '🇩🇪',
  'fr': '🇫🇷',
  'es': '🇪🇸',
  'it': '🇮🇹',
  'pt': '🇵🇹',
  'ja': '🇯🇵',
  'ko': '🇰🇷',
  'zh': '🇨🇳',
  'ar': '🇸🇦',
};

// Названия языков
const languageNames: Record<string, string> = {
  'pl': 'Polish',
  'en': 'English',
  'ru': 'Russian',
  'de': 'German',
  'fr': 'French',
  'es': 'Spanish',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese',
  'ar': 'Arabic',
};

export const TranslationTooltip: React.FC<TranslationTooltipProps> = ({
  translations,
  isVisible,
  position,
  onClose
}) => {
  if (!isVisible || translations.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed z-50 bg-base-300 border border-base-content/20 rounded-lg shadow-lg p-3 max-w-sm"
      style={{
        left: position.x + 10,
        top: position.y - 10,
        transform: 'translateY(-100%)',
      }}
      onMouseLeave={onClose}
    >
      <div className="space-y-2">
        {translations.map((translation, index) => (
          <div key={index} className="flex items-start gap-2">
            <span className="text-lg flex-shrink-0">
              {languageFlags[translation.language] || '🌐'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-base-content/60 font-medium">
                {languageNames[translation.language] || translation.language}
              </div>
              <div className="text-sm text-base-content leading-relaxed">
                {translation.text}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Стрелка указывающая на элемент */}
      <div 
        className="absolute w-2 h-2 bg-base-300 border-r border-b border-base-content/20 transform rotate-45"
        style={{
          left: -6,
          top: '50%',
          transform: 'translateY(-50%) rotate(45deg)',
        }}
      />
    </div>
  );
}; 