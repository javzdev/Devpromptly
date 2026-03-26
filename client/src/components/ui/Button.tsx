import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility function for merging Tailwind classes
const cn = (...inputs: (string | undefined | null | false)[]) => {
  return twMerge(clsx(inputs));
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline' | 'ghost' | 'premium';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading = false, 
    fullWidth = false,
    icon,
    iconPosition = 'left',
    disabled,
    children,
    ...props 
  }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-soft hover:shadow-medium dark:bg-primary-500 dark:hover:bg-primary-600',
      secondary: 'bg-secondary-100 text-secondary-900 hover:bg-secondary-200 focus:ring-secondary-500 dark:bg-secondary-800 dark:text-secondary-100 dark:hover:bg-secondary-700',
      success: 'bg-success-600 text-white hover:bg-success-700 focus:ring-success-500 shadow-soft',
      warning: 'bg-warning-600 text-white hover:bg-warning-700 focus:ring-warning-500 shadow-soft',
      error: 'bg-error-600 text-white hover:bg-error-700 focus:ring-error-500 shadow-soft',
      outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500 dark:border-primary-500 dark:text-primary-500 dark:hover:bg-primary-950',
      ghost: 'text-secondary-600 hover:bg-secondary-100 focus:ring-secondary-500 dark:text-secondary-400 dark:hover:bg-secondary-800',
      premium: 'btn-premium'
    };

    const sizes = {
      xs: 'px-2.5 py-1.5 text-xs',
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
      xl: 'px-8 py-4 text-lg'
    };

    const iconSizes = {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-5 w-5',
      xl: 'h-6 w-6'
    };

    const classes = cn(
      baseClasses,
      variants[variant],
      sizes[size],
      fullWidth && 'w-full',
      className
    );

    const iconElement = icon && (
      <span className={cn(
        iconSizes[size], 
        iconPosition === 'left' && children ? 'mr-2' : '',
        iconPosition === 'right' && children ? 'ml-2' : ''
      )}>
        {icon}
      </span>
    );

    return (
      <button
        className={classes}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg 
            className={cn('animate-spin', iconSizes[size], children ? 'mr-2' : '')} 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        
        {!loading && iconPosition === 'left' && iconElement}
        
        {loading ? 'Loading...' : children}
        
        {!loading && iconPosition === 'right' && iconElement}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, cn };
