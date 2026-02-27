/**
 * Formats a number as Sri Lankan Rupees (LKR) currency
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number | undefined | null): string => {
  if (amount == null || isNaN(amount)) return 'LKR 0.00';
  return `LKR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Formats large amounts in abbreviated form (K for thousands, M for millions)
 * @param amount - The amount to format
 * @returns Formatted currency string with abbreviation
 */
export const formatLargeCurrency = (amount: number | undefined | null): string => {
  if (amount == null || isNaN(amount)) return 'LKR 0.00';

  if (Math.abs(amount) >= 1000000) {
    return `LKR ${(amount / 1000000).toFixed(2)}M`;
  } else if (Math.abs(amount) >= 1000) {
    return `LKR ${(amount / 1000).toFixed(1)}K`;
  } else {
    return formatCurrency(amount);
  }
};