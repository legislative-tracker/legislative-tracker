import { OpenStatesPerson, PersonSponsorship } from './openstates-person';
import { OpenStatesBill } from './openstates-bill';

export interface ColumnConfig<T> {
  key: keyof T & string;
  label: string;
}

export const MEMBER_COLS: ColumnConfig<OpenStatesPerson>[] = [
  { key: 'name', label: 'Name' },
  { key: 'family_name', label: 'Last Name' },
  { key: 'given_name', label: 'First Name' },
  { key: 'party', label: 'Party' },
];

export const LEGISLATOR_COLS = MEMBER_COLS;

export const BILL_COLS: ColumnConfig<OpenStatesBill>[] = [
  { key: 'id', label: 'Bill Number' },
  { key: 'title', label: 'Title' },
];

export const COSPONSOR_COLS: ColumnConfig<any>[] = [
  { key: 'name', label: 'Name' },
];

export const SPONSORSHIP_COLS: ColumnConfig<any>[] = [
  { key: 'stateBillId', label: 'Bill' },
  { key: 'billName', label: 'Title' },
];
