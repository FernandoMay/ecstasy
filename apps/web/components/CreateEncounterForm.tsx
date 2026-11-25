"use client";

import {
  TERMS_SCHEMA,
  shortHash,
  toHex,
  termsDigest,
  type Receipt,
  type TermsDocument,
} from "@ecstasy/stellar";
import Link from "next/link";
import { useState } from "react";
import { copyToClipboard, xlmToStroops } from "@/lib/format";
import { SettlementReceipt } from "./SettlementReceipt";
import { useWallet } from "./WalletProvider";

export function CreateEncounterForm() {
  const { config, address, service, connect } = useWallet();
  const [participant, setParticipant] = useState("");
  const [asset, setAsset] = useState(config.assetContractId);
  const [stake, setStake] = useState("0");
  const [minutes, setMinutes] = useState("60");
  const [title, setTitle] = useState("A private agreement");
  const [summary, setSummary] = useState("What we agree to, in our own words.");
  const [boundaries, setBoundaries] = useState("Respect the agreed time\nNo recording");
  const [locationHint, setLocationHint] = useState("");
  const [hash, setHash] = useState<string | null>(null);
  const [terms, setTerms] = useState<TermsDocument | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  function buildTerms(): TermsDocument {
    return {
      schema: TERMS_SCHEMA,
      title,
      summary,
      boundaries: boundaries.split("\n").map((line) => line.trim()).filter(Boolean),
      durationMinutes: Number(minutes),
      ...(locationHint.trim() ? { locationHint: locationHint.trim() } : {}),
      createdAt: new Date().toISOString(),
    };
  }

  async function previewHash() {
    setError(null);
    try {
      const document = buildTerms();
      const digest = await termsDigest(document);
      setTerms(document);
      setHash(toHex(digest));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }

  async function submit() {
    if (!address) {
      await connect();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      let document = terms;
      let digestHex = hash;
      if (!document || !digestHex) {
        document = buildTerms();
        digestHex = toHex(await termsDigest(document));
        setTerms(document);
        setHash(digestHex);
      }
      const result = await service.create({
        creator: address,
        participant: participant.trim(),
        assetContractId: asset.trim(),
        stake: xlmToStroops(stake),
        termsHash: Uint8Array.from(digestHex.match(/.{2}/g)!.map((pair) => parseInt(pair, 16))),
        expiresAt: BigInt(Math.floor(Date.now() / 1000) + Number(minutes) * 60),
      });
      setCreatedId(result.value.toString());
      setReceipt(result.receipt);
      if (typeof window !== "undefined" && document) {
        sessionStorage.setItem(`ecstasy:terms:${digestHex}`, JSON.stringify(document));
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h2>Create encounter</h2>
      <p className="muted small">
        Private terms stay in this browser. Only the SHA-256 commitment and the agreed state
        transition go on-chain.
      </p>

      <div className="field">
        <label className="label" htmlFor="participant">Participant address</label>
        <input
          id="participant"
          className="input mono"
          placeholder="G…"
          value={participant}
          onChange={(event) => setParticipant(event.target.value)}
        />
      </div>
      <div className="field">
        <label className="label" htmlFor="asset">Asset contract (escrow)</label>
        <input
          id="asset"
          className="input mono"
          placeholder="C…"
          value={asset}
          onChange={(event) => setAsset(event.target.value)}
        />
        <p className="muted small">Use {config.assetSymbol}. Leave the stake at 0 for no escrow.</p>
      </div>
      <div className="row">
        <div className="field" style={{ flex: 1 }}>
          <label className="label" htmlFor="stake">Stake ({config.assetSymbol})</label>
          <input id="stake" className="input" value={stake} onChange={(event) => setStake(event.target.value)} />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label className="label" htmlFor="minutes">Expiry (minutes)</label>
          <input id="minutes" className="input" value={minutes} onChange={(event) => setMinutes(event.target.value)} />
        </div>
      </div>
      <div className="field">
        <label className="label" htmlFor="title">Title</label>
        <input id="title" className="input" value={title} onChange={(event) => setTitle(event.target.value)} />
      </div>
      <div className="field">
        <label className="label" htmlFor="summary">Private summary</label>
        <textarea id="summary" className="textarea" value={summary} onChange={(event) => setSummary(event.target.value)} />
      </div>
      <div className="field">
        <label className="label" htmlFor="boundaries">Boundaries (one per line)</label>
        <textarea id="boundaries" className="textarea" value={boundaries} onChange={(event) => setBoundaries(event.target.value)} />
      </div>
      <div className="field">
        <label className="label" htmlFor="location">Coarse location hint (optional)</label>
        <input id="location" className="input" value={locationHint} onChange={(event) => setLocationHint(event.target.value)} />
      </div>

      <div className="row">
        <button className="btn" onClick={previewHash}>Preview terms hash</button>
        <button className="btn btn-primary" onClick={submit} disabled={busy}>
          {busy ? "Submitting…" : address ? "Create encounter" : "Connect & create"}
        </button>
      </div>

      {hash && (
        <div className="notice" style={{ marginTop: 18, marginBottom: 0 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="mono small">sha256 · {shortHash(hash)}</span>
            <button
              className="btn btn-small"
              onClick={async () => {
                if (!terms) return;
                await copyToClipboard(JSON.stringify(terms, null, 2));
                setCopied(true);
              }}
            >
              {copied ? "Copied ✓" : "Copy private terms"}
            </button>
          </div>
          <p className="small muted" style={{ marginBottom: 0, marginTop: 8 }}>
            Share these private terms through your own channel. The invitation link contains only
            the encounter id — never the terms.
          </p>
        </div>
      )}

      {error && <div className="notice error" style={{ marginTop: 18 }}>{error}</div>}
      {receipt && createdId && (
        <>
          <div style={{ height: 18 }} />
          <SettlementReceipt receipt={receipt} />
          <div className="row" style={{ marginTop: 14 }}>
            <Link className="btn btn-primary" href={`/encounter/${createdId}`}>
              Open encounter #{createdId} →
            </Link>
            <button
              className="btn"
              onClick={() =>
                copyToClipboard(`${window.location.origin}/encounter/${createdId}`)
              }
            >
              Copy invitation link
            </button>
          </div>
        </>
      )}
    </div>
  );
}
