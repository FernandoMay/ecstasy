"use client";

import {
  describeContractError,
  parseEncounterId,
  shortAddress,
  statusName,
  type Encounter,
  type Receipt,
} from "@ecstasy/stellar";
import { useCallback, useEffect, useState } from "react";
import { AfterglowSlider } from "./AfterglowSlider";
import { ConsentSheet } from "./ConsentSheet";
import { EncounterTimeline } from "./EncounterTimeline";
import { ExplorerEvidence } from "./ExplorerEvidence";
import { SettlementReceipt } from "./SettlementReceipt";
import { StakePanel } from "./StakePanel";
import { TermsHashBadge } from "./TermsHashBadge";
import { useWallet } from "./WalletProvider";
import { withRetry } from "@/lib/retry";
import { availableActions } from "@/lib/action-policy";

function message(cause: unknown): string {
  const raw = cause instanceof Error ? cause.message : String(cause);
  return describeContractError(raw)?.message ?? raw;
}

export function EncounterWorkspace({ id }: { id: string }) {
  const { address, service, config, connect } = useWallet();
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [busy, setBusy] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState(false);
  const [scores, setScores] = useState<{ creator?: number; participant?: number }>({});

  const refresh = useCallback(async (): Promise<boolean> => {
    let parsed: bigint;
    try {
      parsed = parseEncounterId(id);
    } catch (cause) {
      setReadError(message(cause));
      setStale(false);
      return false;
    }
    try {
      const next = await withRetry(() => service.read(parsed), {
        attempts: 3,
        delaysMs: [300, 700],
      });
      setEncounter(next);
      setReadError(null);
      setStale(false);
      setPendingConfirm(false);
      return true;
    } catch (cause) {
      // Preserve the last known state: a receipt can succeed while a
      // subsequent read fails. Report it as stale, never as confirmed.
      setReadError(message(cause));
      setStale(true);
      return false;
    }
  }, [service, id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!encounter || statusName(encounter.status) !== "Settled") return;
    (async () => {
      try {
        const [creator, participant] = await Promise.all([
          service.getAfterglow(parseEncounterId(id), encounter.creator),
          service.getAfterglow(parseEncounterId(id), encounter.participant),
        ]);
        setScores({ creator, participant });
      } catch {
        // Optional read; the action flow remains usable.
      }
    })();
  }, [encounter, service, id]);

  async function run(action: () => Promise<{ receipt: Receipt }>) {
    setBusy(true);
    setError(null);
    try {
      const result = await action();
      setReceipt(result.receipt);
      setPendingConfirm(true);
      const confirmed = await refresh();
      if (!confirmed) {
        setError("Transaction submitted, but the state read failed. Showing last known state — retry to confirm.");
      }
    } catch (cause) {
      setError(message(cause));
    } finally {
      setBusy(false);
    }
  }

  if (!encounter) {
    return (
      <div className="card" style={{ marginTop: 40 }}>
        <h2>Encounter #{id}</h2>
        <p className="muted">{readError ? "Could not load encounter." : "Loading on-chain state…"}</p>
        {readError && <div className="notice error">{readError}</div>}
        {readError && (
          <button className="btn" onClick={refresh} disabled={busy}>
            Retry read
          </button>
        )}
      </div>
    );
  }

  const status = statusName(encounter.status);
  const isCreator = Boolean(address && address === encounter.creator);
  const isParticipant = Boolean(address && address === encounter.participant);
  const isParty = isCreator || isParticipant;
  const afterglowSubmitted = isCreator
    ? scores.creator !== undefined
    : scores.participant !== undefined;
  const actions = availableActions({
    status,
    role: isCreator ? "creator" : isParticipant ? "participant" : "viewer",
    creatorCompleted: encounter.creator_completed,
    participantCompleted: encounter.participant_completed,
    afterglowSubmitted,
  });
  const encounterId = parseEncounterId(id);

  return (
    <>
      <div className="section-title">Encounter #{id}</div>
      <div className="grid">
        <div className="card">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h2 style={{ margin: 0 }}>Agreement state</h2>
            <span className={`badge status-${status.toLowerCase()}`}>{status}</span>
          </div>
          <div style={{ height: 16 }} />
          <EncounterTimeline encounter={encounter} />
          <div style={{ height: 20 }} />
          <dl className="kv">
            <dt>Creator</dt>
            <dd>
              {shortAddress(encounter.creator)}
              {isCreator && " (you)"}
            </dd>
            <dt>Participant</dt>
            <dd>
              {shortAddress(encounter.participant)}
              {isParticipant && " (you)"}
            </dd>
            <dt>Expires</dt>
            <dd>{new Date(Number(encounter.expires_at) * 1000).toLocaleString()}</dd>
            <dt>Commitment</dt>
            <dd><TermsHashBadge hash={encounter.terms_hash} /></dd>
            <dt>Marker</dt>
            <dd className="small">
              {encounter.settlement_marker
                ? shortAddress(Buffer.from(encounter.settlement_marker).toString("hex"))
                : "—"}
            </dd>
          </dl>
        </div>

        <div>
          <StakePanel
            stake={encounter.stake}
            asset={encounter.asset}
            symbol={config.assetSymbol}
          />
          <div style={{ height: 18 }} />
          <ExplorerEvidence contractId={config.contractId} />
        </div>
      </div>

      {(stale || pendingConfirm) && (
        <div className="notice" style={{ marginTop: 20 }}>
          {pendingConfirm
            ? "Transaction submitted — waiting for a confirmed state read."
            : "State read failed. Showing last known on-chain state."}
          <button className="btn btn-small" style={{ marginLeft: 12 }} onClick={refresh} disabled={busy}>
            Retry read
          </button>
        </div>
      )}

      {error && (
        <div className="notice error" style={{ marginTop: 20 }}>
          {error}
        </div>
      )}

      <div className="section-title">Actions</div>
      <div className="grid">
        {!address && (
          <div className="card">
            <h3>Wallet required</h3>
            <p className="muted small">Connect Freighter to act on this encounter.</p>
            <button className="btn btn-primary" onClick={connect}>
              Connect wallet
            </button>
          </div>
        )}

        {actions.includes("accept") && (
          <ConsentSheet
            encounter={encounter}
            disabled={busy}
            onAccept={() => run(() => service.accept(address!, encounterId))}
            onDecline={() => run(() => service.decline(address!, encounterId))}
          />
        )}

        {status === "Created" && actions.includes("cancel") && (
          <div className="card">
            <h3>Invitation pending</h3>
            <p className="muted small">
              Share the private terms out-of-band and the invitation link. The participant must
              verify the hash and consent before completion is possible.
            </p>
            <button className="btn btn-danger" disabled={busy} onClick={() => run(() => service.cancel(address!, encounterId))}>
              Cancel invitation
            </button>
          </div>
        )}

        {status === "Accepted" && actions.includes("complete") && (
          <div className="card">
            <h3>Complete</h3>
            <p className="muted small">
              Both parties must record completion before settlement. Your completion is recorded
              on-chain; the private event itself is not.
            </p>
            <div className="row">
              <button className="btn btn-primary" disabled={busy} onClick={() => run(() => service.complete(address!, encounterId))}>
                {encounter.creator_completed && isCreator || encounter.participant_completed && isParticipant
                  ? "Completed ✓"
                  : "Record completion"}
              </button>
              <button className="btn btn-danger" disabled={busy} onClick={() => run(() => service.cancel(address!, encounterId))}>
                Cancel
              </button>
            </div>
            <p className="muted small" style={{ marginTop: 12 }}>
              Either party may cancel an open encounter; any escrow is refunded to the creator.
            </p>
          </div>
        )}

        {actions.includes("settle") && (
          <div className="card">
            <h3>Settle</h3>
            <p className="muted small">
              Terminal transition. Releases escrow to the participant and blocks any further state
              change. Double settlement is rejected by the contract.
            </p>
            <button className="btn btn-primary" disabled={busy} onClick={() => run(() => service.settle(address!, encounterId))}>
              Settle encounter
            </button>
          </div>
        )}

        {status === "Settled" && isParty && (
          <>
            <AfterglowSlider
              disabled={busy}
              alreadySubmitted={!actions.includes("afterglow")}
              onSubmit={(score) => run(() => service.afterglow(address!, encounterId, score))}
            />
            <div className="card">
              <h3>Afterglow received</h3>
              <dl className="kv">
                <dt>Creator</dt>
                <dd>{scores.creator === undefined ? "not submitted" : `${scores.creator}/100`}</dd>
                <dt>Participant</dt>
                <dd>{scores.participant === undefined ? "not submitted" : `${scores.participant}/100`}</dd>
              </dl>
            </div>
          </>
        )}

        {actions.includes("expire") && (
          <div className="card">
            <h3>Expired</h3>
            <p className="muted small">
              The expiry timestamp passed before completion. Finalize the on-chain refund to the
              creator with a permissionless transaction.
            </p>
            <button className="btn" disabled={busy} onClick={() => run(() => service.expire(encounterId))}>
              Finalize expiry & refund
            </button>
          </div>
        )}

        {status === "Cancelled" && (
          <div className="card">
            <h3>Cancelled</h3>
            <p className="muted small">Terminal state. Any escrow was refunded to the creator.</p>
          </div>
        )}
      </div>

      {receipt && (
        <>
          <div className="section-title">Receipt</div>
          <SettlementReceipt receipt={receipt} />
        </>
      )}
    </>
  );
}
