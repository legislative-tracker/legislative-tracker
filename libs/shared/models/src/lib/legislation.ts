export interface Legislation {
  name: string;
  description?: string;
  stateBillIds: {
    upper?: string;
    lower?: string;
  };
  ocdBillIds: {
    upper?: string;
    lower?: string;
  };
}
