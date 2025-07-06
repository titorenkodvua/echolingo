import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'error' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  noIconMargin?: boolean;
}

const variantMap = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
  error: 'btn-error',
  success: 'btn-success',
};

const sizeMap = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      children,
      className,
      disabled,
      noIconMargin,
      ...rest
    },
    ref
  ) => (
    <button
      ref={ref}
      className={cn(
        'btn',
        variantMap[variant],
        sizeMap[size],
        loading && 'btn-disabled',
        className
      )}
      disabled={disabled || loading}
      aria-busy={loading}
      {...rest}
    >
      {loading && (
        <span className="loading loading-spinner w-4 h-4 mr-2" aria-hidden="true" />
      )}
      {icon && !loading && (
        <span className={!noIconMargin && children ? 'mr-2' : ''}>{icon}</span>
      )}
      {children}
    </button>
  )
);
Button.displayName = 'Button'; 