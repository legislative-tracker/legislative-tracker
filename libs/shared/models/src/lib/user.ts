import { Legislator } from "./legislature";

export interface TimestampLike {
  seconds: number;
  nanoseconds: number;
  toDate?: () => Date;
}

export interface AppUser {
  displayName: string;
  email: string;
  uid: string;
  lastLogin: TimestampLike | any;
  phoneNumber?: string;
  photoURL: string;
  districts: {
    federal: string;
    state: {
      assembly: string;
      senate: string;
    };
  };
  legislators: {
    federal: Legislator[];
    state: Legislator[];
  };
  favorites?: string[];
}
