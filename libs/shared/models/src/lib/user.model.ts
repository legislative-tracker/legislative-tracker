import { OpenStatesPerson } from './openstates-person.model';

export interface TimestampLike {
  seconds: number;
  nanoseconds: number;
  toDate?: () => Date;
}

export interface UserRepresentative {
  name: string;
  chamber: string;
  party: string;
  district: string;
  ocdId: string;
}

export interface AppUser {
  displayName: string;
  email: string;
  uid: string;
  lastLogin: TimestampLike | any;
  phoneNumber?: string | null;
  photoURL?: string | null;
  districts?: {
    federal?: string;
    state?: {
      assembly?: string;
      senate?: string;
    };
  };
  legislators?: {
    federal?: (OpenStatesPerson | UserRepresentative)[];
    state?: (OpenStatesPerson | UserRepresentative)[];
  };
  favorites?: string[];
}
