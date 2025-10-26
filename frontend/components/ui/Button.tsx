'use client';

/**
 * Button Component
 * Accessible, styled button with variants and sizes
 * Phase 3.7: UI Primitives
 */

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-brand hover:bg-brand/90 text-white border-transparent shadow-sm hover:shadow-md',
  secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700',
  danger: 'bg-red-500 hover:bg-red-600 text-white border-transparent',
  ghost: 'bg-transparent hover:bg-slate-800 text-slate-300 border-transparent',
  success: 'bg-emerald-500 hover:bg-emerald-600 text-white border-transparent'
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base'
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon,
    children,
    className,
    ...props
  }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium border transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-slate-950',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {!loading && icon && icon}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
