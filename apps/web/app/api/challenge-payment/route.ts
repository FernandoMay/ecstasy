import {
  Account,
  Asset,
  Keypair,
  Memo,
  Networks,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { NextResponse } from "next/server";

/**
 * Mission 02 / "Pago relámpago": a real Testnet payment sent by this app with
 * the challenge code in the transaction memo.
 *
 * The source is an ephemeral keypair generated per request and funded by
 * Testnet friendbot. No secret key is stored, logged, or sent to the client.
 */
export const runtime = "nodejs";

export const CHALLENGE_CODE = "SHIP-S97KF8";
const HORIZON_TESTNET = "https://horizon-testnet.stellar.org";
const FRIEND_BOT = "https://friendbot.stellar.org";
const AMOUNT = "0.0001";
const DEFAULT_DESTINATION = "GAUZSVWQY5KOFMWZA5YJEBOECWBGSZHPSADVI6G3ZB54JULLDL6IKISJ";

function explorerUrl(hash: string): string {
  return `https://stellar.expert/explorer/testnet/tx/${hash}`;
}

async function waitForAccount(address: string): Promise<{ sequence: string }> {
  let lastError = "unknown error";
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const response = await fetch(`${HORIZON_TESTNET}/accounts/${address}`);
    if (response.ok) return (await response.json()) as { sequence: string };
    lastError = await response.text();
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error(`Funded account not available on Horizon: ${lastError}`);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { destination?: string };
    const destination = body.destination ?? process.env.PAYMENT_DESTINATION ?? DEFAULT_DESTINATION;

    const source = Keypair.random();
    const fundResponse = await fetch(`${FRIEND_BOT}?addr=${source.publicKey()}`);
    if (!fundResponse.ok) {
      throw new Error(`Friendbot failed with HTTP ${fundResponse.status}`);
    }

    const account = await waitForAccount(source.publicKey());
    const transaction = new TransactionBuilder(new Account(source.publicKey(), account.sequence), {
      fee: "100",
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.payment({
          destination,
          asset: Asset.native(),
          amount: AMOUNT,
        }),
      )
      .addMemo(Memo.text(CHALLENGE_CODE))
      .setTimeout(180)
      .build();
    transaction.sign(source);

    const submitResponse = await fetch(`${HORIZON_TESTNET}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ tx: transaction.toXdr() }).toString(),
    });
    const submitted = (await submitResponse.json()) as { hash?: string; result_codes?: unknown };
    if (!submitResponse.ok || !submitted.hash) {
      return NextResponse.json(
        { error: "Transaction rejected", detail: submitted },
        { status: 502 },
      );
    }

    return NextResponse.json({
      hash: submitted.hash,
      explorerUrl: explorerUrl(submitted.hash),
      memo: CHALLENGE_CODE,
      amount: AMOUNT,
      destination,
      source: source.publicKey(),
      network: "testnet",
    });
  } catch (cause) {
    return NextResponse.json(
      { error: cause instanceof Error ? cause.message : String(cause) },
      { status: 500 },
    );
  }
}
