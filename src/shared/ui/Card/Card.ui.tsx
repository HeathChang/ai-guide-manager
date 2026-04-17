import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const Card = ({ className, children, ...rest }: CardProps) => (
  <div
    className={cn(
      'bg-bg-card border border-border-base rounded-card shadow-sm',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
);
