import { OpenStatesPerson } from './openstates-person.model';

/**
 * Compatible representation of a Firestore Timestamp object.
 */
export interface TimestampLike {
  /** Seconds since Unix epoch. */
  seconds: number;
  /** Fractional seconds in nanoseconds. */
  nanoseconds: number;
  /** Converts Firestore Timestamp into a JavaScript Date object. */
  toDate?: () => Date;
}

/**
 * Summary representation of an elected official representing a user.
 */
export interface UserRepresentative {
  /** Full name of the representative. */
  name: string;
  /** Chamber of office (e.g. 'Senate', 'Assembly'). */
  chamber: string;
  /** Political party affiliation. */
  party: string;
  /** District number or code represented. */
  district: string;
  /** Open Civic Data person identifier. */
  ocdId: string;
}

/**
 * User profile document stored in the Firestore `users` collection.
 */
export interface AppUser {
  /** Display name provided by auth provider or user profile. */
  displayName: string;
  /** Email address associated with the account. */
  email: string;
  /** Unique Firebase Authentication UID. */
  uid: string;
  /** Timestamp of the user's most recent login session. */
  lastLogin: TimestampLike | any;
  /** Phone number if provided. */
  phoneNumber?: string | null;
  /** Avatar or profile picture URL. */
  photoURL?: string | null;
  /** Electoral districts resolved from the user's geocoded address. */
  districts?: {
    /** Federal congressional district identifier. */
    federal?: string;
    /** State legislative district identifiers. */
    state?: {
      /** State lower chamber / assembly district number. */
      assembly?: string;
      /** State upper chamber / senate district number. */
      senate?: string;
    };
  };
  /** Cached lists of elected officials representing the user. */
  legislators?: {
    /** Federal elected representatives. */
    federal?: (OpenStatesPerson | UserRepresentative)[];
    /** State elected representatives. */
    state?: (OpenStatesPerson | UserRepresentative)[];
  };
}
