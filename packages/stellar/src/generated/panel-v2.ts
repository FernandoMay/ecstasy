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





export interface Case {
  agreement_id: u64;
  amount: i128;
  arbitrators: Array<string>;
  commit_deadline: u64;
  eligible_snapshot: Array<string>;
  evidence_hash: Buffer;
  id: u64;
  outcome_code: Option<u32>;
  payer: string;
  recipient: string;
  reveal_deadline: u64;
  selection_salt: Buffer;
  status: CaseStatus;
}

export type CaseStatus = {tag: "PanelPending", values: void} | {tag: "Open", values: void} | {tag: "Resolved", values: void} | {tag: "NoQuorum", values: void};


export const PanelV2Error = {
  1: {message:"NotFound"},
  2: {message:"NotAuthorized"},
  3: {message:"InvalidState"},
  4: {message:"InvalidAmount"},
  5: {message:"NotArbitrator"},
  6: {message:"AlreadyCommitted"},
  7: {message:"AlreadyRevealed"},
  8: {message:"TooEarly"},
  9: {message:"TooLate"},
  10: {message:"CommitmentMismatch"},
  11: {message:"InvalidDecision"},
  12: {message:"RegistryUnavailable"},
  13: {message:"InsufficientArbitrators"},
  14: {message:"InsufficientFunds"}
}

export interface Client {
  /**
   * Construct and simulate a get transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get: ({case_id}: {case_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Case>>>

  /**
   * Construct and simulate a commit transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  commit: ({caller, case_id, commitment}: {caller: string, case_id: u64, commitment: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a create transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Deposit and freeze the eligible snapshot. No arbitrator can be passed here.
   */
  create: ({caller, agreement_id, recipient, amount, evidence_hash}: {caller: string, agreement_id: u64, recipient: string, amount: i128, evidence_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a reveal transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  reveal: ({caller, case_id, decision, secret}: {caller: string, case_id: u64, decision: u32, secret: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a resolve transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Permissionless quorum settlement after the reveal window.
   */
  resolve: ({caller, case_id}: {caller: string, case_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a commitment transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Off-chain mirror: sha256("ECSTASY-PANEL-V2" || contract_id || case_id ||
   * decision(u32) || secret || arbitrator).
   */
  commitment: ({case_id, arbitrator, decision, secret}: {case_id: u64, arbitrator: string, decision: u32, secret: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Buffer>>

  /**
   * Construct and simulate a select_panel transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Permissionless deterministic selection from the frozen snapshot.
   */
  select_panel: ({caller, case_id}: {caller: string, case_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {asset, registry}: {asset: string, registry: string},
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
    return ContractClient.deploy({asset, registry}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAQAAAAAAAAAAAAAABENhc2UAAAANAAAAAAAAAAxhZ3JlZW1lbnRfaWQAAAAGAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAC2FyYml0cmF0b3JzAAAAA+oAAAATAAAAAAAAAA9jb21taXRfZGVhZGxpbmUAAAAABgAAAAAAAAARZWxpZ2libGVfc25hcHNob3QAAAAAAAPqAAAAEwAAAAAAAAANZXZpZGVuY2VfaGFzaAAAAAAAA+4AAAAgAAAAAAAAAAJpZAAAAAAABgAAAAAAAAAMb3V0Y29tZV9jb2RlAAAD6AAAAAQAAAAAAAAABXBheWVyAAAAAAAAEwAAAAAAAAAJcmVjaXBpZW50AAAAAAAAEwAAAAAAAAAPcmV2ZWFsX2RlYWRsaW5lAAAAAAYAAAAAAAAADnNlbGVjdGlvbl9zYWx0AAAAAAPuAAAAIAAAAAAAAAAGc3RhdHVzAAAAAAfQAAAACkNhc2VTdGF0dXMAAA==",
        "AAAAAgAAAAAAAAAAAAAACkNhc2VTdGF0dXMAAAAAAAQAAAAAAAAAAAAAAAxQYW5lbFBlbmRpbmcAAAAAAAAAAAAAAARPcGVuAAAAAAAAAAAAAAAIUmVzb2x2ZWQAAAAAAAAAAAAAAAhOb1F1b3J1bQ==",
        "AAAABQAAAAAAAAAAAAAAClBhbmVsRXZlbnQAAAAAAAEAAAALcGFuZWxfZXZlbnQAAAAAAwAAAAAAAAAEa2luZAAAABEAAAABAAAAAAAAAAdjYXNlX2lkAAAAAAYAAAABAAAAAAAAAAVhY3RvcgAAAAAAABMAAAAAAAAAAg==",
        "AAAABAAAAAAAAAAAAAAADFBhbmVsVjJFcnJvcgAAAA4AAAAAAAAACE5vdEZvdW5kAAAAAQAAAAAAAAANTm90QXV0aG9yaXplZAAAAAAAAAIAAAAAAAAADEludmFsaWRTdGF0ZQAAAAMAAAAAAAAADUludmFsaWRBbW91bnQAAAAAAAAEAAAAAAAAAA1Ob3RBcmJpdHJhdG9yAAAAAAAABQAAAAAAAAAQQWxyZWFkeUNvbW1pdHRlZAAAAAYAAAAAAAAAD0FscmVhZHlSZXZlYWxlZAAAAAAHAAAAAAAAAAhUb29FYXJseQAAAAgAAAAAAAAAB1Rvb0xhdGUAAAAACQAAAAAAAAASQ29tbWl0bWVudE1pc21hdGNoAAAAAAAKAAAAAAAAAA9JbnZhbGlkRGVjaXNpb24AAAAACwAAAAAAAAATUmVnaXN0cnlVbmF2YWlsYWJsZQAAAAAMAAAAAAAAABdJbnN1ZmZpY2llbnRBcmJpdHJhdG9ycwAAAAANAAAAAAAAABFJbnN1ZmZpY2llbnRGdW5kcwAAAAAAAA4=",
        "AAAAAAAAAAAAAAADZ2V0AAAAAAEAAAAAAAAAB2Nhc2VfaWQAAAAABgAAAAEAAAPpAAAH0AAAAARDYXNlAAAH0AAAAAxQYW5lbFYyRXJyb3I=",
        "AAAAAAAAAAAAAAAGY29tbWl0AAAAAAADAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAAB2Nhc2VfaWQAAAAABgAAAAAAAAAKY29tbWl0bWVudAAAAAAD7gAAACAAAAABAAAD6QAAAAIAAAfQAAAADFBhbmVsVjJFcnJvcg==",
        "AAAAAAAAAEtEZXBvc2l0IGFuZCBmcmVlemUgdGhlIGVsaWdpYmxlIHNuYXBzaG90LiBObyBhcmJpdHJhdG9yIGNhbiBiZSBwYXNzZWQgaGVyZS4AAAAABmNyZWF0ZQAAAAAABQAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAxhZ3JlZW1lbnRfaWQAAAAGAAAAAAAAAAlyZWNpcGllbnQAAAAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAADWV2aWRlbmNlX2hhc2gAAAAAAAPuAAAAIAAAAAEAAAPpAAAABgAAB9AAAAAMUGFuZWxWMkVycm9y",
        "AAAAAAAAAAAAAAAGcmV2ZWFsAAAAAAAEAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAAB2Nhc2VfaWQAAAAABgAAAAAAAAAIZGVjaXNpb24AAAAEAAAAAAAAAAZzZWNyZXQAAAAAA+4AAAAgAAAAAQAAA+kAAAACAAAH0AAAAAxQYW5lbFYyRXJyb3I=",
        "AAAAAAAAADlQZXJtaXNzaW9ubGVzcyBxdW9ydW0gc2V0dGxlbWVudCBhZnRlciB0aGUgcmV2ZWFsIHdpbmRvdy4AAAAAAAAHcmVzb2x2ZQAAAAACAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAAB2Nhc2VfaWQAAAAABgAAAAEAAAPpAAAAAgAAB9AAAAAMUGFuZWxWMkVycm9y",
        "AAAAAAAAAHBPZmYtY2hhaW4gbWlycm9yOiBzaGEyNTYoIkVDU1RBU1ktUEFORUwtVjIiIHx8IGNvbnRyYWN0X2lkIHx8IGNhc2VfaWQgfHwKZGVjaXNpb24odTMyKSB8fCBzZWNyZXQgfHwgYXJiaXRyYXRvcikuAAAACmNvbW1pdG1lbnQAAAAAAAQAAAAAAAAAB2Nhc2VfaWQAAAAABgAAAAAAAAAKYXJiaXRyYXRvcgAAAAAAEwAAAAAAAAAIZGVjaXNpb24AAAAEAAAAAAAAAAZzZWNyZXQAAAAAA+4AAAAgAAAAAQAAA+4AAAAg",
        "AAAAAAAAAEBQZXJtaXNzaW9ubGVzcyBkZXRlcm1pbmlzdGljIHNlbGVjdGlvbiBmcm9tIHRoZSBmcm96ZW4gc25hcHNob3QuAAAADHNlbGVjdF9wYW5lbAAAAAIAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAAAAAAHY2FzZV9pZAAAAAAGAAAAAQAAA+kAAAACAAAH0AAAAAxQYW5lbFYyRXJyb3I=",
        "AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAIAAAAAAAAABWFzc2V0AAAAAAAAEwAAAAAAAAAIcmVnaXN0cnkAAAATAAAAAA==" ]),
      options
    )
  }
  public readonly fromJSON = {
    get: this.txFromJSON<Result<Case>>,
        commit: this.txFromJSON<Result<void>>,
        create: this.txFromJSON<Result<u64>>,
        reveal: this.txFromJSON<Result<void>>,
        resolve: this.txFromJSON<Result<void>>,
        commitment: this.txFromJSON<Buffer>,
        select_panel: this.txFromJSON<Result<void>>
  }
}