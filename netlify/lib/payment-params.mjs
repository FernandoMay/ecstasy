/** Fixed payment parameters. A key can never be reused with different ones. */
export const PAYMENT_PARAMS = Object.freeze({
  destination: "GAUZSVWQY5KOFMWZA5YJEBOECWBGSZHPSADVI6G3ZB54JULLDL6IKISJ",
  amount: "0.0001",
  asset: "native",
  memo: "SHIP-S97KF8",
});

export function samePaymentParams(recordParams) {
  if (!recordParams || typeof recordParams !== "object") return true;
  return (
    recordParams.destination === PAYMENT_PARAMS.destination &&
    recordParams.amount === PAYMENT_PARAMS.amount &&
    (recordParams.memo ?? PAYMENT_PARAMS.memo) === PAYMENT_PARAMS.memo
  );
}
