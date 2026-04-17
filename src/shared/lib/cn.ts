type ClassValue = string | number | false | null | undefined;

export const cn = (...classes: ClassValue[]): string =>
  classes.filter((value): value is string | number => Boolean(value)).join(' ');
