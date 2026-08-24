export interface SearchAddress {
  address: string;
  address2: string | null;
  city: string;
  state: string;
  postalCode: number;
}

export interface ShippingAddress extends SearchAddress {}
