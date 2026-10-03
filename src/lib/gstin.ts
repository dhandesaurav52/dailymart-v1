/**
 * GSTIN (Goods and Services Tax Identification Number) Utilities
 * 
 * An Indian GSTIN is a 15-character alphanumeric code:
 * - 2 digits: State code (01 - 38)
 * - 10 characters: PAN of the business (5 letters, 4 digits, 1 letter)
 * - 1 digit: Entity number of the same PAN holder in the state (1-9, A-Z)
 * - 1 character: 'Z' by default
 * - 1 character: Checksum digit (alphanumeric)
 * 
 * Example: 27AABCS1429B1ZB
 */

export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const INDIAN_STATES_BY_CODE: Record<string, string> = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '26': 'Dadra and Nagar Haveli and Daman and Diu',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
};

/**
 * Normalizes a raw GSTIN string: uppercase, trimmed, whitespace removed
 */
export function normalizeGstin(raw: string): string {
  return (raw || '').replace(/\s+/g, '').toUpperCase().trim();
}

/**
 * Validates a normalized GSTIN string against statutory syntax and state code
 */
export function isValidGstin(raw: string): {
  isValid: boolean;
  normalized: string;
  error?: string;
  stateName?: string;
  pan?: string;
} {
  const normalized = normalizeGstin(raw);

  if (!normalized) {
    return { isValid: false, normalized, error: 'GSTIN is mandatory for seller onboarding.' };
  }

  if (normalized.length !== 15) {
    return {
      isValid: false,
      normalized,
      error: `GSTIN must be exactly 15 characters (entered ${normalized.length}).`,
    };
  }

  if (!GSTIN_REGEX.test(normalized)) {
    return {
      isValid: false,
      normalized,
      error: 'Invalid GSTIN format. Expected pattern: 2 digits + 10-char PAN + 1 entity code + Z + 1 check digit (e.g., 27AABCS1429B1ZB).',
    };
  }

  const stateCode = normalized.substring(0, 2);
  const stateName = INDIAN_STATES_BY_CODE[stateCode];
  if (!stateName) {
    return {
      isValid: false,
      normalized,
      error: `State code "${stateCode}" is not a recognized Indian state/UT code.`,
    };
  }

  const pan = normalized.substring(2, 12);

  return {
    isValid: true,
    normalized,
    stateName,
    pan,
  };
}

/**
 * Extracts PAN from a 15-character GSTIN
 */
export function extractPanFromGstin(rawGstin: string): string | null {
  const norm = normalizeGstin(rawGstin);
  if (norm.length >= 12) {
    return norm.substring(2, 12);
  }
  return null;
}
