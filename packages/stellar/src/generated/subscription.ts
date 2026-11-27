import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}





export interface Plan {
  amount: i128;
  cancelled: boolean;
  created_at: u64;
  frequency: u64;
  id: u64;
  payer: string;
  period_ids: Array<u32>;
  recipient: string;
}


export interface Period {
  amount: i128;
  delivery_hash: Option<Buffer>;
  due_at: u64;
  funded_at: u64;
  period_id: u32;
  plan_id: u64;
  reason_hash: Option<Buffer>;
  status: PeriodStatus;
}

export type Outcome = {tag: "Release", values: void} | {tag: "Refund", values: void};

export type PeriodStatus = {tag: "Funded", values: void} | {tag: "Submitted", values: void} | {tag: "Approved", values: void} | {tag: "Disputed", values: void} | {tag: "Refunded", values: void};

export const SubscriptionError = {
  1: {message:"NotFound"},
  2: {message:"NotAuthorized"},
  3: {message:"InvalidState"},
  4: {message:"InvalidAmount"},
  5: {message:"InvalidFrequency"},
  6: {message:"DuplicatePeriod"},
  7: {message:"PlanCancelled"},
  8: {message:"InvalidDueDate"},
  9: {message:"InsufficientFunds"}
}


export interface Client {
  /**
   * Construct and simulate a approve transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * The payer releases exactly one period's amount.
   */
  approve: ({caller, plan_id, period_id}: {caller: string, plan_id: u64, period_id: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a dispute transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Either party blocks one period without touching the others.
   */
  dispute: ({caller, plan_id, period_id, reason_hash}: {caller: string, plan_id: u64, period_id: u32, reason_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_plan transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_plan: ({plan_id}: {plan_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Plan>>>

  /**
   * Construct and simulate a get_period transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_period: ({plan_id, period_id}: {plan_id: u64, period_id: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Period>>>

  /**
   * Construct and simulate a cancel_plan transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Stop future periods. Already-funded periods remain executable.
   */
  cancel_plan: ({caller, plan_id}: {caller: string, plan_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a create_plan transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Define terms only. No funds move here and no debt is created.
   */
  create_plan: ({caller, recipient, amount, frequency}: {caller: string, recipient: string, amount: i128, frequency: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a fund_period transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Explicitly fund one period with real XLM from the payer.
   */
  fund_period: ({caller, plan_id, period_id, due_at}: {caller: string, plan_id: u64, period_id: u32, due_at: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_periods transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Verifiable history of every period created under a plan.
   */
  get_periods: ({plan_id}: {plan_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Array<Period>>>>

  /**
   * Construct and simulate a resolve_dispute transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * The designated resolver settles one disputed period. Terminal.
   */
  resolve_dispute: ({caller, plan_id, period_id, outcome}: {caller: string, plan_id: u64, period_id: u32, outcome: Outcome}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a submit_delivery transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * The recipient registers an evidence digest for one funded period.
   */
  submit_delivery: ({caller, plan_id, period_id, delivery_hash}: {caller: string, plan_id: u64, period_id: u32, delivery_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {asset, resolver}: {asset: string, resolver: string},
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy({asset, resolver}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAQAAAAAAAAAAAAAABFBsYW4AAAAIAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAACWNhbmNlbGxlZAAAAAAAAAEAAAAAAAAACmNyZWF0ZWRfYXQAAAAAAAYAAAAAAAAACWZyZXF1ZW5jeQAAAAAAAAYAAAAAAAAAAmlkAAAAAAAGAAAAAAAAAAVwYXllcgAAAAAAABMAAAAAAAAACnBlcmlvZF9pZHMAAAAAA+oAAAAEAAAAAAAAAAlyZWNpcGllbnQAAAAAAAAT",
        "AAAAAQAAAAAAAAAAAAAABlBlcmlvZAAAAAAACAAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAA1kZWxpdmVyeV9oYXNoAAAAAAAD6AAAA+4AAAAgAAAAAAAAAAZkdWVfYXQAAAAAAAYAAAAAAAAACWZ1bmRlZF9hdAAAAAAAAAYAAAAAAAAACXBlcmlvZF9pZAAAAAAAAAQAAAAAAAAAB3BsYW5faWQAAAAABgAAAAAAAAALcmVhc29uX2hhc2gAAAAD6AAAA+4AAAAgAAAAAAAAAAZzdGF0dXMAAAAAB9AAAAAMUGVyaW9kU3RhdHVz",
        "AAAAAgAAAAAAAAAAAAAAB091dGNvbWUAAAAAAgAAAAAAAAAAAAAAB1JlbGVhc2UAAAAAAAAAAAAAAAAGUmVmdW5kAAA=",
        "AAAAAgAAAAAAAAAAAAAADFBlcmlvZFN0YXR1cwAAAAUAAAAAAAAAAAAAAAZGdW5kZWQAAAAAAAAAAAAAAAAACVN1Ym1pdHRlZAAAAAAAAAAAAAAAAAAACEFwcHJvdmVkAAAAAAAAAAAAAAAIRGlzcHV0ZWQAAAAAAAAAAAAAAAhSZWZ1bmRlZA==",
        "AAAABAAAAAAAAAAAAAAAEVN1YnNjcmlwdGlvbkVycm9yAAAAAAAACQAAAAAAAAAITm90Rm91bmQAAAABAAAAAAAAAA1Ob3RBdXRob3JpemVkAAAAAAAAAgAAAAAAAAAMSW52YWxpZFN0YXRlAAAAAwAAAAAAAAANSW52YWxpZEFtb3VudAAAAAAAAAQAAAAAAAAAEEludmFsaWRGcmVxdWVuY3kAAAAFAAAAAAAAAA9EdXBsaWNhdGVQZXJpb2QAAAAABgAAAAAAAAANUGxhbkNhbmNlbGxlZAAAAAAAAAcAAAAAAAAADkludmFsaWREdWVEYXRlAAAAAAAIAAAAAAAAABFJbnN1ZmZpY2llbnRGdW5kcwAAAAAAAAk=",
        "AAAABQAAAAAAAAAAAAAAEVN1YnNjcmlwdGlvbkV2ZW50AAAAAAAAAQAAABJzdWJzY3JpcHRpb25fZXZlbnQAAAAAAAQAAAAAAAAABGtpbmQAAAARAAAAAQAAAAAAAAAHcGxhbl9pZAAAAAAGAAAAAQAAAAAAAAAJcGVyaW9kX2lkAAAAAAAABAAAAAAAAAAAAAAABWFjdG9yAAAAAAAAEwAAAAAAAAAC",
        "AAAAAAAAAC9UaGUgcGF5ZXIgcmVsZWFzZXMgZXhhY3RseSBvbmUgcGVyaW9kJ3MgYW1vdW50LgAAAAAHYXBwcm92ZQAAAAADAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAAB3BsYW5faWQAAAAABgAAAAAAAAAJcGVyaW9kX2lkAAAAAAAABAAAAAEAAAPpAAAAAgAAB9AAAAARU3Vic2NyaXB0aW9uRXJyb3IAAAA=",
        "AAAAAAAAADtFaXRoZXIgcGFydHkgYmxvY2tzIG9uZSBwZXJpb2Qgd2l0aG91dCB0b3VjaGluZyB0aGUgb3RoZXJzLgAAAAAHZGlzcHV0ZQAAAAAEAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAAB3BsYW5faWQAAAAABgAAAAAAAAAJcGVyaW9kX2lkAAAAAAAABAAAAAAAAAALcmVhc29uX2hhc2gAAAAD7gAAACAAAAABAAAD6QAAAAIAAAfQAAAAEVN1YnNjcmlwdGlvbkVycm9yAAAA",
        "AAAAAAAAAAAAAAAIZ2V0X3BsYW4AAAABAAAAAAAAAAdwbGFuX2lkAAAAAAYAAAABAAAD6QAAB9AAAAAEUGxhbgAAB9AAAAARU3Vic2NyaXB0aW9uRXJyb3IAAAA=",
        "AAAAAAAAAAAAAAAKZ2V0X3BlcmlvZAAAAAAAAgAAAAAAAAAHcGxhbl9pZAAAAAAGAAAAAAAAAAlwZXJpb2RfaWQAAAAAAAAEAAAAAQAAA+kAAAfQAAAABlBlcmlvZAAAAAAH0AAAABFTdWJzY3JpcHRpb25FcnJvcgAAAA==",
        "AAAAAAAAAD5TdG9wIGZ1dHVyZSBwZXJpb2RzLiBBbHJlYWR5LWZ1bmRlZCBwZXJpb2RzIHJlbWFpbiBleGVjdXRhYmxlLgAAAAAAC2NhbmNlbF9wbGFuAAAAAAIAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAAAAAAHcGxhbl9pZAAAAAAGAAAAAQAAA+kAAAACAAAH0AAAABFTdWJzY3JpcHRpb25FcnJvcgAAAA==",
        "AAAAAAAAAD1EZWZpbmUgdGVybXMgb25seS4gTm8gZnVuZHMgbW92ZSBoZXJlIGFuZCBubyBkZWJ0IGlzIGNyZWF0ZWQuAAAAAAAAC2NyZWF0ZV9wbGFuAAAAAAQAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAAAAAAJcmVjaXBpZW50AAAAAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAlmcmVxdWVuY3kAAAAAAAAGAAAAAQAAA+kAAAAGAAAH0AAAABFTdWJzY3JpcHRpb25FcnJvcgAAAA==",
        "AAAAAAAAADhFeHBsaWNpdGx5IGZ1bmQgb25lIHBlcmlvZCB3aXRoIHJlYWwgWExNIGZyb20gdGhlIHBheWVyLgAAAAtmdW5kX3BlcmlvZAAAAAAEAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAAB3BsYW5faWQAAAAABgAAAAAAAAAJcGVyaW9kX2lkAAAAAAAABAAAAAAAAAAGZHVlX2F0AAAAAAAGAAAAAQAAA+kAAAACAAAH0AAAABFTdWJzY3JpcHRpb25FcnJvcgAAAA==",
        "AAAAAAAAADhWZXJpZmlhYmxlIGhpc3Rvcnkgb2YgZXZlcnkgcGVyaW9kIGNyZWF0ZWQgdW5kZXIgYSBwbGFuLgAAAAtnZXRfcGVyaW9kcwAAAAABAAAAAAAAAAdwbGFuX2lkAAAAAAYAAAABAAAD6QAAA+oAAAfQAAAABlBlcmlvZAAAAAAH0AAAABFTdWJzY3JpcHRpb25FcnJvcgAAAA==",
        "AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAIAAAAAAAAABWFzc2V0AAAAAAAAEwAAAAAAAAAIcmVzb2x2ZXIAAAATAAAAAA==",
        "AAAAAAAAAD5UaGUgZGVzaWduYXRlZCByZXNvbHZlciBzZXR0bGVzIG9uZSBkaXNwdXRlZCBwZXJpb2QuIFRlcm1pbmFsLgAAAAAAD3Jlc29sdmVfZGlzcHV0ZQAAAAAEAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAAB3BsYW5faWQAAAAABgAAAAAAAAAJcGVyaW9kX2lkAAAAAAAABAAAAAAAAAAHb3V0Y29tZQAAAAfQAAAAB091dGNvbWUAAAAAAQAAA+kAAAACAAAH0AAAABFTdWJzY3JpcHRpb25FcnJvcgAAAA==",
        "AAAAAAAAAEFUaGUgcmVjaXBpZW50IHJlZ2lzdGVycyBhbiBldmlkZW5jZSBkaWdlc3QgZm9yIG9uZSBmdW5kZWQgcGVyaW9kLgAAAAAAAA9zdWJtaXRfZGVsaXZlcnkAAAAABAAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAdwbGFuX2lkAAAAAAYAAAAAAAAACXBlcmlvZF9pZAAAAAAAAAQAAAAAAAAADWRlbGl2ZXJ5X2hhc2gAAAAAAAPuAAAAIAAAAAEAAAPpAAAAAgAAB9AAAAARU3Vic2NyaXB0aW9uRXJyb3IAAAA=" ]),
      options
    )
  }
  public readonly fromJSON = {
    approve: this.txFromJSON<Result<void>>,
        dispute: this.txFromJSON<Result<void>>,
        get_plan: this.txFromJSON<Result<Plan>>,
        get_period: this.txFromJSON<Result<Period>>,
        cancel_plan: this.txFromJSON<Result<void>>,
        create_plan: this.txFromJSON<Result<u64>>,
        fund_period: this.txFromJSON<Result<void>>,
        get_periods: this.txFromJSON<Result<Array<Period>>>,
        resolve_dispute: this.txFromJSON<Result<void>>,
        submit_delivery: this.txFromJSON<Result<void>>
  }
}