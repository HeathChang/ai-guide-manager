import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  className?: string;
}

export const Tooltip = ({ content, children, className }: TooltipProps) => (
  <span className={cn('relative inline-flex group', className)}>
    <span
      tabIndex={0}
      className="cursor-help focus:outline-none focus-visible:ring-2 focus-visible:ring-border-accent rounded"
    >
      {children}
    </span>
    <span
      role="tooltip"
      className={cn(
        'pointer-events-none absolute left-1/2 bottom-full z-10 mb-2 w-64 -translate-x-1/2',
        'rounded-md bg-text-main px-3 py-2 text-xs leading-relaxed text-text-inverse shadow-md',
        'opacity-0 transition-opacity duration-150',
        'group-hover:opacity-100 group-focus-within:opacity-100',
      )}
    >
      {content}
    </span>
  </span>
);
