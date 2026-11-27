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




export type Outcome = {tag: "Release", values: void} | {tag: "Refund", values: void};


export interface Agreement {
  agreement_hash: Buffer;
  id: u64;
  milestones: Array<Milestone>;
  proposer: string;
  recipient: string;
  total: i128;
}


export interface Milestone {
  amount: i128;
  deadline: u64;
  evidence_hash: Option<Buffer>;
  reason_hash: Option<Buffer>;
  status: MilestoneStatus;
}

export const MilestoneError = {
  1: {message:"NotFound"},
  2: {message:"NotAuthorized"},
  3: {message:"InvalidState"},
  4: {message:"InvalidAmount"},
  5: {message:"InvalidMilestone"},
  6: {message:"DeadlineNotPassed"},
  7: {message:"AlreadySettled"},
  8: {message:"InsufficientFunds"},
  9: {message:"DisputeNotAllowed"}
}


export type MilestoneStatus = {tag: "Pending", values: void} | {tag: "Submitted", values: void} | {tag: "Paid", values: void} | {tag: "Disputed", values: void} | {tag: "Refunded", values: void} | {tag: "Recovered", values: void};

export interface Client {
  /**
   * Construct and simulate a get transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get: ({agreement_id}: {agreement_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Agreement>>>

  /**
   * Construct and simulate a create transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Deposit the exact sum of the milestone amounts.
   */
  create: ({caller, recipient, amounts, deadlines, agreement_hash}: {caller: string, recipient: string, amounts: Array<i128>, deadlines: Array<u64>, agreement_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a submit transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Recipient submits an evidence digest for one milestone.
   */
  submit: ({caller, agreement_id, index, evidence_hash}: {caller: string, agreement_id: u64, index: u32, evidence_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a approve transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Proposer approves one milestone: only its amount is released.
   */
  approve: ({caller, agreement_id, index}: {caller: string, agreement_id: u64, index: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a dispute transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Either party disputes a single milestone; other funds stay locked.
   */
  dispute: ({caller, agreement_id, index, reason_hash}: {caller: string, agreement_id: u64, index: u32, reason_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a recover transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Permissionless recovery of one unresolved milestone after its deadline.
   */
  recover: ({caller, agreement_id, index}: {caller: string, agreement_id: u64, index: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a resolve transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Resolver decides only the disputed milestone.
   */
  resolve: ({caller, agreement_id, index, outcome}: {caller: string, agreement_id: u64, index: u32, outcome: Outcome}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

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
      new ContractSpec([ "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",
        "AAAAAAAAAEJFaXRoZXIgcGFydHkgZGlzcHV0ZXMgYSBzaW5nbGUgbWlsZXN0b25lOyBvdGhlciBmdW5kcyBzdGF5IGxvY2tlZC4AAAAAAAdkaXNwdXRlAAAAAAQAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAAAAAAMYWdyZWVtZW50X2lkAAAABgAAAAAAAAAFaW5kZXgAAAAAAAAEAAAAAAAAAAtyZWFzb25faGFzaAAAAAPuAAAAIAAAAAEAAAPpAAAAAgAAB9AAAAAOTWlsZXN0b25lRXJyb3IAAA==",
        "AAAAAAAAAEdQZXJtaXNzaW9ubGVzcyByZWNvdmVyeSBvZiBvbmUgdW5yZXNvbHZlZCBtaWxlc3RvbmUgYWZ0ZXIgaXRzIGRlYWRsaW5lLgAAAAAHcmVjb3ZlcgAAAAADAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAADGFncmVlbWVudF9pZAAAAAYAAAAAAAAABWluZGV4AAAAAAAABAAAAAEAAAPpAAAAAgAAB9AAAAAOTWlsZXN0b25lRXJyb3IAAA==",
        "AAAAAAAAAC1SZXNvbHZlciBkZWNpZGVzIG9ubHkgdGhlIGRpc3B1dGVkIG1pbGVzdG9uZS4AAAAAAAAHcmVzb2x2ZQAAAAAEAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAADGFncmVlbWVudF9pZAAAAAYAAAAAAAAABWluZGV4AAAAAAAABAAAAAAAAAAHb3V0Y29tZQAAAAfQAAAAB091dGNvbWUAAAAAAQAAA+kAAAACAAAH0AAAAA5NaWxlc3RvbmVFcnJvcgAA",
        "AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAIAAAAAAAAABWFzc2V0AAAAAAAAEwAAAAAAAAAIcmVzb2x2ZXIAAAATAAAAAA==" ]),
      options
    )
  }
  public readonly fromJSON = {
    get: this.txFromJSON<Result<Agreement>>,
        create: this.txFromJSON<Result<u64>>,
        submit: this.txFromJSON<Result<void>>,
        approve: this.txFromJSON<Result<void>>,
        dispute: this.txFromJSON<Result<void>>,
        recover: this.txFromJSON<Result<void>>,
        resolve: this.txFromJSON<Result<void>>
  }
}