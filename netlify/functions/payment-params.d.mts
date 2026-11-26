export declare const PAYMENT_PARAMS: Readonly<{
  destination: string;
  amount: string;
  asset: string;
  memo: string;
}>;
export declare function samePaymentParams(recordParams: unknown): boolean;
