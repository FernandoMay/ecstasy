"use client";

import { isAssetConfigured, shortHash, type Receipt } from "@ecstasy/stellar";
import Link from "next/link";
import { useState } from "react";
import { copyToClipboard, xlmToStroops } from "@/lib/format";
import { HISTORY_KEY, addEncounterRef } from "@/lib/encounter-history";
import {
  commitmentBytes,
  commitmentForFields,
  type TermsCommitment,
  type TermsFormFields,
} from "@/lib/terms-form";
import { SettlementReceipt } from "./SettlementReceipt";
import { useWallet } from "./WalletProvider";

export function CreateEncounterForm() {
  const { config, address, service, connect } = useWallet();

  const [participant, setParticipant] = useState("");
  const [stake, setStake] = useState("0");
  const [minutes, setMinutes] = useState("60");
  const [title, setTitle] = useState("A private agreement");
  const [summary, setSummary] = useState("What we agree to, in our own words.");
  const [boundaries, setBoundaries] = useState("Respect the agreed time\nNo recording");
  const [locationHint, setLocationHint] = useState("");
  const [createdAt] = useState(() => new Date().toISOString());

  const [preview, setPreview] = useState<TermsCommitment | null>(null);
  const [submitted, setSubmitted] = useState<TermsCommitment | null>(null);
  const [dirty, setDirty] = useState(false);
  const [copied, setCopied] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [keepLocal, setKeepLocal] = useState(false);
  const [cleared, setCleared] = useState(false);

  const fields: TermsFormFields = {
    title,
    summary,
    boundariesText: boundaries,
    durationMinutes: minutes,
    locationHint,
  };
  const locked = submitted !== null;
  const assetReady = isAssetConfigured(config);

  function change(update: () => void) {
    if (locked) return;
    update();
    setPreview(null);
    setDirty(true);
    setCopied(false);
  }

  async function previewHash() {
    setError(null);
    try {
      setPreview(await commitmentForFields(fields, createdAt));
      setDirty(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }

  async function submit() {
    if (!address) {
      await connect();
      return;
    }
    if (!assetReady) {
      setError("NEXT_PUBLIC_ASSET_CONTRACT_ID is not configured for this network");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // Always recompute from the currently displayed form values. A preview
      // is a display snapshot and can never become the submitted commitment.
      const commitment = await commitmentForFields(fields, createdAt);
      const result = await service.create({
        creator: address,
        participant: participant.trim(),
        stake: xlmToStroops(stake),
        termsHash: commitmentBytes(commitment.hex),
        expiresAt: BigInt(Math.floor(Date.now() / 1000) + Number(minutes) * 60),
      });
      setSubmitted(commitment);
      setPreview(commitment);
      setDirty(false);
      setCreatedId(result.value.toString());
      setReceipt(result.receipt);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          HISTORY_KEY,
          addEncounterRef(window.localStorage.getItem(HISTORY_KEY), {
            id: result.value.toString(),
            role: "creator",
            addedAt: Date.now(),
          }),
        );
      }
      if (keepLocal && typeof window !== "undefined") {
        sessionStorage.setItem(`ecstasy:terms:${commitment.hex}`, JSON.stringify(commitment.terms));
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  const shownCommitment = submitted ?? preview;

  return (
    <div className="card">
      <h2>Create encounter</h2>
      <p className="muted small">
        Private terms stay in this browser. Only the SHA-256 commitment and the agreed state
        transition go on-chain. The form locks once terms are committed so the visible document and
        the submitted digest cannot diverge.
      </p>

      <div className="field">
        <label className="label" htmlFor="participant">Participant address</label>
        <input
          id="participant"
          className="input mono"
          placeholder="G…"
          value={participant}
          disabled={locked}
          onChange={(event) => change(() => setParticipant(event.target.value))}
        />
      </div>
      <div className="field">
        <label className="label" htmlFor="asset-contract">Asset contract (single escrow asset)</label>
        <input id="asset-contract" className="input mono" value={config.assetContractId} readOnly aria-readonly="true" />
        <p className="muted small">
          {assetReady
            ? `Pinned by this deployment (${config.assetSymbol}). A no-stake encounter is allowed.`
            : "Configure NEXT_PUBLIC_ASSET_CONTRACT_ID to enable escrow contracts."}
        </p>
      </div>
      <div className="row">
        <div className="field" style={{ flex: 1 }}>
          <label className="label" htmlFor="stake">Stake ({config.assetSymbol})</label>
          <input id="stake" className="input" value={stake} disabled={locked} onChange={(event) => change(() => setStake(event.target.value))} />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label className="label" htmlFor="minutes">Expiry (minutes)</label>
          <input id="minutes" className="input" value={minutes} disabled={locked} onChange={(event) => change(() => setMinutes(event.target.value))} />
        </div>
      </div>
      <div className="field">
        <label className="label" htmlFor="title">Title</label>
        <input id="title" className="input" value={title} disabled={locked} onChange={(event) => change(() => setTitle(event.target.value))} />
      </div>
      <div className="field">
        <label className="label" htmlFor="summary">Private summary</label>
        <textarea id="summary" className="textarea" value={summary} disabled={locked} onChange={(event) => change(() => setSummary(event.target.value))} />
      </div>
      <div className="field">
        <label className="label" htmlFor="boundaries">Boundaries (one per line)</label>
        <textarea id="boundaries" className="textarea" value={boundaries} disabled={locked} onChange={(event) => change(() => setBoundaries(event.target.value))} />
      </div>
      <div className="field">
        <label className="label" htmlFor="location">Coarse location hint (optional)</label>
        <input id="location" className="input" value={locationHint} disabled={locked} onChange={(event) => change(() => setLocationHint(event.target.value))} />
        <p className="muted small">Keep it optional and coarse. Do not enter a precise address or identifying detail.</p>
      </div>

      <div className="field">
        <label className="row small" style={{ gap: 8 }}>
          <input
            type="checkbox"
            checked={keepLocal}
            disabled={locked}
            onChange={(event) => setKeepLocal(event.target.checked)}
          />
          Keep a copy of these private terms in this browser session (local only, never uploaded)
        </label>
      </div>

      <div className="row">
        <button className="btn" onClick={previewHash} disabled={locked || busy}>Preview terms hash</button>
        <button className="btn btn-primary" onClick={submit} disabled={locked || busy || !assetReady}>
          {busy ? "Submitting…" : locked ? "Terms committed" : address ? "Create encounter" : "Connect & create"}
        </button>
      </div>

      {dirty && !preview && !locked && (
        <div className="notice" style={{ marginTop: 18 }}>
          Terms changed — preview again before creating.
        </div>
      )}

      {shownCommitment && (
        <div className="notice" style={{ marginTop: 18, marginBottom: 0 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="mono small">
              {submitted ? "submitted" : "preview"} · sha256 {shortHash(shownCommitment.hex)}
            </span>
            <button
              className="btn btn-small"
              onClick={async () => {
                await copyToClipboard(JSON.stringify(shownCommitment.terms, null, 2));
                setCopied(true);
              }}
            >
              {copied ? "Copied ✓" : "Copy private terms"}
            </button>
          </div>
          <p className="small muted" style={{ marginBottom: 0, marginTop: 8 }}>
            {submitted
              ? "These are the exact terms whose digest was submitted. Share them through your own channel; the invitation link contains only the encounter id."
              : "Share these private terms through your own channel. The invitation link contains only the encounter id — never the terms."}
          </p>
        </div>
      )}

      <div className="row" style={{ marginTop: 18 }}>
        <button
          className="btn btn-small"
          onClick={() => {
            if (typeof window === "undefined") return;
            Object.keys(sessionStorage)
              .filter((key) => key.startsWith("ecstasy:terms:"))
              .forEach((key) => sessionStorage.removeItem(key));
            setCleared(true);
          }}
        >
          Clear locally stored terms
        </button>
        {cleared && <span className="small success-text">Local copies removed</span>}
      </div>

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
              onClick={() => copyToClipboard(`${window.location.origin}/encounter/${createdId}`)}
            >
              Copy invitation link
            </button>
          </div>
        </>
      )}
    </div>
  );
}
