import type { ButtonHTMLAttributes } from 'react';

import { cn } from '../../lib/cn';

interface PanelActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  display?: 'icon' | 'compact';
}

export function PanelActionButton({
  className,
  display = 'icon',
  type = 'button',
  ...props
}: PanelActionButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'panel-action-button',
        display === 'compact' ? 'panel-action-button--compact' : '',
        className,
      )}
      {...props}
    />
  );
}
