/**
 * Utility functions for date and time formatting
 */

/**
 * Formats a date string or Date object to display both date and time
 * @param date - The date to format (string or Date object)
 * @returns Formatted date and time string
 */
export const formatDateTime = (date: string | Date): string => {
  if (!date || (typeof date === 'string' && date.trim() === '')) {
    return '';
  }
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

/**
 * Formats a date string or Date object to display only date
 * @param date - The date to format (string or Date object)
 * @returns Formatted date string
 */
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};