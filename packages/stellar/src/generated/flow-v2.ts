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





export interface Flow {
  agreement_id: u64;
  created_at: u64;
  id: u64;
  settlement_tx: Option<Buffer>;
  status: FlowStatus;
  vault_id: u64;
}

export const FlowError = {
  1: {message:"NotFound"},
  2: {message:"NotAuthorized"},
  3: {message:"InvalidState"},
  4: {message:"InvalidStep"},
  5: {message:"DuplicateStep"},
  6: {message:"MissingStep"},
  7: {message:"InvalidPage"}
}


export type FlowStatus = {tag: "Open", values: void} | {tag: "Settled", values: void};


export interface StepRecord {
  actor: string;
  flow_id: u64;
  recorded_at: u64;
  ref_id: u64;
  step: string;
  tx_hash: Buffer;
}

export interface Client {
  /**
   * Construct and simulate a start transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Open a composed flow. Only the fund manager role may start it.
   */
  start: ({caller, vault_id, agreement_id}: {caller: string, vault_id: u64, agreement_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a settle transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Close the composed flow after the required primitives have been linked.
   */
  settle: ({caller, flow_id, settlement_tx}: {caller: string, flow_id: u64, settlement_tx: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_flow transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_flow: ({flow_id}: {flow_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Flow>>>

  /**
   * Construct and simulate a get_step transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_step: ({flow_id, step}: {flow_id: u64, step: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<StepRecord>>>

  /**
   * Construct and simulate a get_steps transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Bounded page of steps: a large flow never requires reading the whole list.
   */
  get_steps: ({flow_id, offset}: {flow_id: u64, offset: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Array<StepRecord>>>

  /**
   * Construct and simulate a link_step transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Link one real step with its on-chain transaction hash.
   */
  link_step: ({caller, flow_id, step, ref_id, tx_hash}: {caller: string, flow_id: u64, step: string, ref_id: u64, tx_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {roles}: {roles: string},
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
    return ContractClient.deploy({roles}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAQAAAAAAAAAAAAAABEZsb3cAAAAGAAAAAAAAAAxhZ3JlZW1lbnRfaWQAAAAGAAAAAAAAAApjcmVhdGVkX2F0AAAAAAAGAAAAAAAAAAJpZAAAAAAABgAAAAAAAAANc2V0dGxlbWVudF90eAAAAAAAA+gAAAPuAAAAIAAAAAAAAAAGc3RhdHVzAAAAAAfQAAAACkZsb3dTdGF0dXMAAAAAAAAAAAAIdmF1bHRfaWQAAAAG",
        "AAAABAAAAAAAAAAAAAAACUZsb3dFcnJvcgAAAAAAAAcAAAAAAAAACE5vdEZvdW5kAAAAAQAAAAAAAAANTm90QXV0aG9yaXplZAAAAAAAAAIAAAAAAAAADEludmFsaWRTdGF0ZQAAAAMAAAAAAAAAC0ludmFsaWRTdGVwAAAAAAQAAAAAAAAADUR1cGxpY2F0ZVN0ZXAAAAAAAAAFAAAAAAAAAAtNaXNzaW5nU3RlcAAAAAAGAAAAAAAAAAtJbnZhbGlkUGFnZQAAAAAH",
        "AAAABQAAAAAAAAAAAAAACUZsb3dFdmVudAAAAAAAAAEAAAAKZmxvd19ldmVudAAAAAAAAwAAAAAAAAAEa2luZAAAABEAAAABAAAAAAAAAAdmbG93X2lkAAAAAAYAAAABAAAAAAAAAAVhY3RvcgAAAAAAABMAAAAAAAAAAg==",
        "AAAAAgAAAAAAAAAAAAAACkZsb3dTdGF0dXMAAAAAAAIAAAAAAAAAAAAAAARPcGVuAAAAAAAAAAAAAAAHU2V0dGxlZAA=",
        "AAAAAQAAAAAAAAAAAAAAClN0ZXBSZWNvcmQAAAAAAAYAAAAAAAAABWFjdG9yAAAAAAAAEwAAAAAAAAAHZmxvd19pZAAAAAAGAAAAAAAAAAtyZWNvcmRlZF9hdAAAAAAGAAAAAAAAAAZyZWZfaWQAAAAAAAYAAAAAAAAABHN0ZXAAAAARAAAAAAAAAAd0eF9oYXNoAAAAA+4AAAAg",
        "AAAAAAAAAD5PcGVuIGEgY29tcG9zZWQgZmxvdy4gT25seSB0aGUgZnVuZCBtYW5hZ2VyIHJvbGUgbWF5IHN0YXJ0IGl0LgAAAAAABXN0YXJ0AAAAAAAAAwAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAh2YXVsdF9pZAAAAAYAAAAAAAAADGFncmVlbWVudF9pZAAAAAYAAAABAAAD6QAAAAYAAAfQAAAACUZsb3dFcnJvcgAAAA==",
        "AAAAAAAAAEdDbG9zZSB0aGUgY29tcG9zZWQgZmxvdyBhZnRlciB0aGUgcmVxdWlyZWQgcHJpbWl0aXZlcyBoYXZlIGJlZW4gbGlua2VkLgAAAAAGc2V0dGxlAAAAAAADAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAAB2Zsb3dfaWQAAAAABgAAAAAAAAANc2V0dGxlbWVudF90eAAAAAAAA+4AAAAgAAAAAQAAA+kAAAACAAAH0AAAAAlGbG93RXJyb3IAAAA=",
        "AAAAAAAAAAAAAAAIZ2V0X2Zsb3cAAAABAAAAAAAAAAdmbG93X2lkAAAAAAYAAAABAAAD6QAAB9AAAAAERmxvdwAAB9AAAAAJRmxvd0Vycm9yAAAA",
        "AAAAAAAAAAAAAAAIZ2V0X3N0ZXAAAAACAAAAAAAAAAdmbG93X2lkAAAAAAYAAAAAAAAABHN0ZXAAAAARAAAAAQAAA+kAAAfQAAAAClN0ZXBSZWNvcmQAAAAAB9AAAAAJRmxvd0Vycm9yAAAA",
        "AAAAAAAAAEpCb3VuZGVkIHBhZ2Ugb2Ygc3RlcHM6IGEgbGFyZ2UgZmxvdyBuZXZlciByZXF1aXJlcyByZWFkaW5nIHRoZSB3aG9sZSBsaXN0LgAAAAAACWdldF9zdGVwcwAAAAAAAAIAAAAAAAAAB2Zsb3dfaWQAAAAABgAAAAAAAAAGb2Zmc2V0AAAAAAAEAAAAAQAAA+oAAAfQAAAAClN0ZXBSZWNvcmQAAA==",
        "AAAAAAAAADZMaW5rIG9uZSByZWFsIHN0ZXAgd2l0aCBpdHMgb24tY2hhaW4gdHJhbnNhY3Rpb24gaGFzaC4AAAAAAAlsaW5rX3N0ZXAAAAAAAAAFAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAAB2Zsb3dfaWQAAAAABgAAAAAAAAAEc3RlcAAAABEAAAAAAAAABnJlZl9pZAAAAAAABgAAAAAAAAAHdHhfaGFzaAAAAAPuAAAAIAAAAAEAAAPpAAAAAgAAB9AAAAAJRmxvd0Vycm9yAAAA",
        "AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAEAAAAAAAAABXJvbGVzAAAAAAAAEwAAAAA=" ]),
      options
    )
  }
  public readonly fromJSON = {
    start: this.txFromJSON<Result<u64>>,
        settle: this.txFromJSON<Result<void>>,
        get_flow: this.txFromJSON<Result<Flow>>,
        get_step: this.txFromJSON<Result<StepRecord>>,
        get_steps: this.txFromJSON<Array<StepRecord>>,
        link_step: this.txFromJSON<Result<void>>
  }
}