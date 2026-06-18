/**
 * Converts a string to a valid field name (lowercase, snake_case)
 */
export const slugifyFieldName = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

/**
 * Validates that a field name is valid (lowercase letters, numbers, underscores only)
 */
export const isValidFieldName = (name: string): boolean => {
  return /^[a-z0-9_]+$/.test(name);
};

/**
 * Checks if a field name is unique within a list of existing names
 */
export const isUniqueFieldName = (name: string, existingNames: string[]): boolean => {
  return !existingNames.includes(name);
};
