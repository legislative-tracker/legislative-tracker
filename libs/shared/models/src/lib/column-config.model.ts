import { OpenStatesPerson, PersonSponsorship } from './openstates-person.model';
import { OpenStatesBill } from './openstates-bill.model';
import { Legislation } from './legislation.model';

export interface ColumnConfig<T> {
  key: keyof T & string;
  label: string;
}

export interface ChamberInfo {
  upper?: string;
  lower?: string;
}

export const MEMBER_COLS: ColumnConfig<OpenStatesPerson>[] = [
  { key: 'name', label: 'Name' },
  { key: 'family_name', label: 'Last Name' },
  { key: 'given_name', label: 'First Name' },
  { key: 'party', label: 'Party' },
];

export const USER_REPS_COLS: ColumnConfig<any>[] = [
  { key: 'name', label: 'Name' },
  { key: 'party', label: 'Party' },
  { key: 'chamber', label: 'Chamber' },
  { key: 'district', label: 'District' },
];

export function getBillCols(
  chambersOrPlugin?:
    | ChamberInfo
    | { metadata?: { jurisdiction?: { chambers?: ChamberInfo } } }
    | { chambers?: ChamberInfo },
): ColumnConfig<Legislation>[] {
  let upperLabel = 'Upper Chamber';
  let lowerLabel = 'Lower Chamber';

  let chambers: ChamberInfo | undefined;

  if (chambersOrPlugin && 'metadata' in chambersOrPlugin) {
    chambers = chambersOrPlugin.metadata?.jurisdiction?.chambers;
  } else if (chambersOrPlugin && 'chambers' in chambersOrPlugin) {
    chambers = chambersOrPlugin.chambers;
  } else if (chambersOrPlugin) {
    chambers = chambersOrPlugin as ChamberInfo;
  }

  if (chambers?.upper) {
    upperLabel = chambers.upper;
  }
  if (chambers?.lower) {
    lowerLabel = chambers.lower;
  }

  return [
    { key: 'name', label: 'Title' },
    { key: 'upperBillId', label: `${upperLabel} Bill` },
    { key: 'lowerBillId', label: `${lowerLabel} Bill` },
  ];
}

export const BILL_COLS: ColumnConfig<Legislation>[] = getBillCols();

export const COSPONSOR_COLS: ColumnConfig<any>[] = [
  { key: 'name', label: 'Name' },
  { key: 'party', label: 'Party' },
  { key: 'district', label: 'District' },
];

export const SPONSORSHIP_COLS: ColumnConfig<any>[] = [
  { key: 'billName', label: 'Title' },
  { key: 'stateBillId', label: 'Bill' },
];
