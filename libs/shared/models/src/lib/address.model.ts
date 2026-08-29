/**
 * Address fields submitted for geocoding and legislative district resolution.
 */
export interface SearchAddress {
  /** Primary street address line (e.g. '123 Main St'). */
  address: string;
  /** Secondary address line such as Apt, Suite, or Unit number. */
  address2: string | null;
  /** City or locality name. */
  city: string;
  /** Two-letter US state code (e.g. 'NY', 'NJ'). */
  state: string;
  /** 5-digit US ZIP postal code. */
  postalCode: number;
}

/**
 * Standard address payload for shipping or physical correspondence.
 */
export interface ShippingAddress extends SearchAddress {}
