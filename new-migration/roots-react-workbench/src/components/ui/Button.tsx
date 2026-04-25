import type { ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-[8px] text-sm font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--action-blue)] disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'border border-[var(--action-blue)] bg-[var(--action-blue)] text-[var(--surface-raised)] shadow-[0_1px_2px_rgba(23,24,23,0.08)] hover:bg-[var(--action-blue-strong)] hover:border-[var(--action-blue-strong)] active:scale-[0.99]',
        secondary:
          'border border-[var(--line)] bg-[var(--surface-raised)] text-[var(--text)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-muted)] active:scale-[0.99]',
      },
      size: {
        sm: 'px-3 py-2',
        md: 'px-5 py-3',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, size, variant, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ size, variant }), className)}
      {...props}
    />
  );
}

