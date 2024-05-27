export const validateNumberType = (value: unknown): number => {
  if (value && typeof value === 'number') return value;
  return 0;
};

export const validateStringType = (value: unknown): string => {
  if (value && typeof value === 'string') return value;
  return '';
};

export const validateBooleanType = (value: unknown): boolean => {
  if (value && typeof value === 'boolean') return value;
  return false;
};

export const validateRequiredType = (value: unknown): string | null => {
  if (value && value !== '' && typeof value === 'string') return value;
  return null;
};

export const validateArrayStringType = (value: unknown): string[] => {
  if (value && Array.isArray(value) && value.every((i) => typeof i === 'string')) return value;
  return [];
};
