import { cn } from '@/shared/lib/cn';

export interface TabItem<TValue extends string> {
  value: TValue;
  label: string;
}

interface TabsProps<TValue extends string> {
  items: readonly TabItem<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
  ariaLabel?: string;
}

export const Tabs = <TValue extends string>({
  items,
  value,
  onChange,
  ariaLabel,
}: TabsProps<TValue>) => (
  <div
    role="tablist"
    aria-label={ariaLabel}
    className="inline-flex items-center gap-1 p-1 bg-bg-muted rounded-btn"
  >
    {items.map((item) => {
      const isActive = item.value === value;
      return (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={isActive}
          className={cn(
            'h-8 px-4 text-sm font-medium rounded-btn transition-colors',
            isActive
              ? 'bg-bg-card text-text-main shadow-sm'
              : 'text-text-muted hover:text-text-main',
          )}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      );
    })}
  </div>
);
