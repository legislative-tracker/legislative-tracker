export interface Success<T> {
  results: T;
}

export interface ChamberMapping {
  [key: string]: {
    [key: string]: string;
  };
}
