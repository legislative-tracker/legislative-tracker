import { OpenStatesPerson } from './openstates-person.model';
import { Legislation } from './legislation.model';

/**
 * Generic configuration contract for data table columns.
 * @typeParam T - The data object type rendered by the table rows.
 */
export interface ColumnConfig<T> {
  /** Property key of the row data rendered in this column. */
  key: keyof T & string;
  /** Human-readable column header text. */
  label: string;
}

/**
 * Chamber naming configuration for upper and lower houses.
 */
export interface ChamberInfo {
  /** Upper chamber display name (e.g., 'Senate'). */
  upper?: string;
  /** Lower chamber display name (e.g., 'Assembly', 'House of Representatives'). */
  lower?: string;
}

/**
 * Table column definitions for rendering state legislators / members.
 */
export const MEMBER_COLS: ColumnConfig<OpenStatesPerson>[] = [
  { key: 'family_name', label: 'Last Name' },
  { key: 'given_name', label: 'First Name' },
  { key: 'party', label: 'Party' },
  { key: 'district', label: 'District' },
];

/**
 * Table column definitions for rendering user representatives on profile/dashboard.
 */
export const USER_REPS_COLS: ColumnConfig<any>[] = [
  { key: 'name', label: 'Name' },
  { key: 'party', label: 'Party' },
  { key: 'chamber', label: 'Chamber' },
  { key: 'district', label: 'District' },
];

/**
 * Generates custom bill column definitions dynamically based on jurisdiction chamber names.
 *
 * @param chambersOrPlugin - Chamber mapping, plugin object, or metadata defining upper/lower names.
 * @returns Array of table column configurations tailored to the jurisdiction.
 */
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

/**
 * Default fallback column definitions for bills.
 */
export const BILL_COLS: ColumnConfig<Legislation>[] = getBillCols();

/**
 * Table column definitions for rendering bill co-sponsors.
 */
export const COSPONSOR_COLS: ColumnConfig<any>[] = [
  { key: 'name', label: 'Name' },
  { key: 'party', label: 'Party' },
  { key: 'district', label: 'District' },
];

/**
 * Table column definitions for rendering sponsored bills on member profiles.
 */
export const SPONSORSHIP_COLS: ColumnConfig<any>[] = [
  { key: 'billName', label: 'Title' },
  { key: 'stateBillId', label: 'Bill' },
];
