import React from 'react';
import { cn } from '../../lib/utils';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
  center?: boolean;
}

const sizeMap = {
  sm: 'loading-sm',
  md: 'loading-md',
  lg: 'loading-lg',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', text, className, center }) => {
  const spinner = (
    <span className={cn('loading loading-spinner text-primary', sizeMap[size], className)} />
  );
  if (center) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        {spinner}
        {text && <span className="mt-2 text-base-content/70 text-sm">{text}</span>}
      </div>
    );
  }
  return (
    <span className="inline-flex items-center gap-2">
      {spinner}
      {text && <span className="text-base-content/70 text-sm">{text}</span>}
    </span>
  );
}; 