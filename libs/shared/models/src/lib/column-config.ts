import { OpenStatesPerson, PersonSponsorship } from './openstates-person';
import { OpenStatesBill } from './openstates-bill';
import { Legislation } from './legislation';

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

export const BILL_COLS: ColumnConfig<Legislation>[] = [
  { key: 'name', label: 'Title' },
  { key: 'upperBillId', label: 'Upper Chamber Bill ID' },
  { key: 'lowerBillId', label: 'Lower Chamber Bill ID' },
];

export const COSPONSOR_COLS: ColumnConfig<any>[] = [
  { key: 'name', label: 'Name' },
];

export const SPONSORSHIP_COLS: ColumnConfig<any>[] = [
  { key: 'stateBillId', label: 'Bill' },
  { key: 'billName', label: 'Title' },
];
