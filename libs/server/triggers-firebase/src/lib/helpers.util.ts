/**
 * Result summary for a state legislative batch update execution.
 */
export interface UpdateResult {
  /** State jurisdiction identifier (e.g. 'us-ny'). */
  state: string;
  /** Number of matching records updated. */
  matched?: number;
  /** Warning messages collected during processing. */
  warnings?: string[];
  /** Fatal error message if state processing failed. */
  error?: string;
}

/**
 * Strips the 'ocd-person/' or 'ocd-bill/' prefix from an OCD ID for use as a Firestore document ID.
 *
 * @param ocdId - The raw OCD identifier (e.g. 'ocd-person/123' or 'ocd-bill/456').
 * @returns Sanitized ID suitable for Firestore document key.
 */
export const formatDocId = (ocdId: string): string =>
  ocdId.replace(/^(ocd-person|ocd-bill)\//, '');
