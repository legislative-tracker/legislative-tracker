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

export interface AddBillsParams {
  state: string;
  name: string;
  description?: string;
  billIds: string[];
}

export interface UpdateBillParams {
  state: string;
  id: string;
  name?: string;
  description?: string;
  upperBillId?: string;
  lowerBillId?: string;
}
