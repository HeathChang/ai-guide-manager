export const STACK_LIST = ['frontend', 'backend'] as const;
export type Stack = (typeof STACK_LIST)[number];

export const isStack = (value: string): value is Stack =>
  (STACK_LIST as readonly string[]).includes(value);
