import { Cosponsor, Legislation, Legislator, Sponsorship } from './legislature';

export interface ColumnConfig<T> {
  key: keyof T & string;
  label: string;
}

export const LEGISLATOR_COLS: ColumnConfig<Legislator>[] = [
  { key: 'name', label: 'Name' },
  { key: 'chamber', label: 'Chamber' },
  { key: 'district', label: 'District' },
  { key: 'party', label: 'Party' },
];

export const BILL_COLS: ColumnConfig<Legislation>[] = [
  { key: 'id', label: 'Bill Number' },
  { key: 'title', label: 'Title' },
  { key: 'latest_action_date', label: 'Latest Action' },
];

export const MEMBER_COLS: ColumnConfig<Legislator>[] = [
  { key: 'family_name', label: 'Last Name' },
  { key: 'given_name', label: 'First Name' },
  { key: 'district', label: 'District' },
  { key: 'party', label: 'Party' },
];

export const COSPONSOR_COLS: ColumnConfig<Cosponsor>[] = [
  { key: 'name', label: 'Name' },
  { key: 'chamber', label: 'Chamber' },
  { key: 'district', label: 'District' },
];

export const SPONSORSHIP_COLS: ColumnConfig<Sponsorship>[] = [
  { key: 'id', label: 'Bill Id' },
  { key: 'title', label: 'Title' },
];
