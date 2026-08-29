/**
 * Represents a piece of tracked state legislation across both legislative chambers.
 */
export interface Legislation {
  /**
   * Unique Firestore document identifier (e.g. 'auto-generated' or custom key).
   */
  id?: string;

  /**
   * Human-readable title or description of the tracked legislation.
   */
  name: string;

  /**
   * Optional extended summary or notes regarding the legislation.
   */
  description?: string;

  /**
   * Display bill identifier for the upper chamber (e.g., 'S100', 'SB 42').
   */
  upperBillId?: string;

  /**
   * Display bill identifier for the lower chamber (e.g., 'A200', 'HB 105').
   */
  lowerBillId?: string;

  /**
   * Canonical state bill identifier mapping.
   */
  stateBillIds: {
    /** Upper chamber state bill ID (e.g., 'S100'). */
    upper?: string;
    /** Lower chamber state bill ID (e.g., 'A200'). */
    lower?: string;
  };

  /**
   * Open Civic Data (OCD) Bill identifiers mapping.
   */
  ocdBillIds: {
    /** Upper chamber Open Civic Data identifier. */
    upper?: string;
    /** Lower chamber Open Civic Data identifier. */
    lower?: string;
  };
}

/**
 * Parameters for adding new bills to be tracked in a state.
 */
export interface AddBillsParams {
  /**
   * State code (e.g., 'ny', 'nj').
   */
  state: string;

  /**
   * Human-readable title for the tracked legislation.
   */
  name: string;

  /**
   * Optional summary or memo for the bill.
   */
  description?: string;

  /**
   * Array of bill identifier strings to register (e.g., `['S100', 'A200']`).
   */
  billIds: string[];
}

/**
 * Parameters for updating existing tracked legislation.
 */
export interface UpdateBillParams {
  /**
   * State code (e.g., 'ny', 'nj').
   */
  state: string;

  /**
   * Document ID of the legislation to update.
   */
  id: string;

  /**
   * Updated display name/title.
   */
  name?: string;

  /**
   * Updated description or notes.
   */
  description?: string;

  /**
   * Updated upper chamber bill identifier.
   */
  upperBillId?: string;

  /**
   * Updated lower chamber bill identifier.
   */
  lowerBillId?: string;
}
