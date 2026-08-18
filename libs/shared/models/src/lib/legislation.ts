export interface Legislation {
  id?: string;
  name: string;
  description?: string;
  upperBillId?: string;
  lowerBillId?: string;
  stateBillIds: {
    upper?: string;
    lower?: string;
  };
  ocdBillIds: {
    upper?: string;
    lower?: string;
  };
}
