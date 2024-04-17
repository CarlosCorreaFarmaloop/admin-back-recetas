export const validateNumberType = (value: unknown): number => {
  if (value && typeof value === 'number') return value;
  return 0;
};

export const validateStringType = (value: unknown): string => {
  if (value && typeof value === 'string') return value;
  return '';
};
