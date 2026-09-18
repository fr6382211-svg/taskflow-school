import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
};

const variantClasses: Record<NonNullable<Props['variant']>, string> = {
  primary: 'editorial-button editorial-button--outline border border-blue-600 bg-transparent text-blue-600',
  secondary: 'editorial-button editorial-button--dark bg-slate-900 text-white',
  ghost: 'editorial-button editorial-button--ghost bg-transparent text-slate-600',
  danger: 'editorial-button editorial-button--danger border border-rose-400 bg-transparent text-rose-700',
  outline: 'editorial-button editorial-button--outline border border-slate-200 bg-white text-slate-700',
};

const sizeClasses: Record<NonNullable<Props['size']>, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-sm',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  ...props
}: Props) {
  return (
    <button
      className={cn(
        'btn-glow focus-ring inline-flex items-center justify-center gap-2 font-medium transition',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <LoaderCircle className="animate-spin" size={16} /> : icon}
      {children}
    </button>
  );
}
