/**
 * Generic success wrapper payload.
 * @typeParam T - Type of the underlying results payload.
 */
export interface Success<T> {
  /** Unwrapped result data. */
  results: T;
}

/**
 * Key-value mapping representing jurisdiction chamber lookups.
 */
export interface ChamberMapping {
  [key: string]: {
    [key: string]: string;
  };
}
