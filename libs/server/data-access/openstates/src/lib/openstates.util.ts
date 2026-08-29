/**
 * Normalizes state/jurisdiction string for OpenStates v3 API requests.
 * Maps 'us-ny' or 'leg-us-ny' -> 'ny', 'ny' -> 'ny', while preserving full names like 'New York'.
 *
 * @param state - The input state abbreviation, jurisdiction ID, or name.
 * @returns Normalized 2-letter state abbreviation or cleaned jurisdiction string.
 */
export function normalizeJurisdictionForOpenStates(state: string): string {
  if (!state) return '';
  const clean = state.trim();
  const match = clean.match(/^(?:leg-)?us-([a-z]{2})$/i);
  if (match) {
    return match[1].toLowerCase();
  }
  if (/^[a-z]{2}$/i.test(clean)) {
    return clean.toLowerCase();
  }
  return clean;
}
