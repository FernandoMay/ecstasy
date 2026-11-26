"use client";

import { statusNameOf } from "@ecstasy/stellar";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  HISTORY_KEY,
  parseHistory,
  removeEncounterRef,
  roleLabel,
  type EncounterRef,
} from "@/lib/encounter-history";
import { useWallet } from "./WalletProvider";
import { ACTIVITY_KEY, diffStatuses, mergeActivity, parseActivity, type ActivityItem } from "@/lib/activity";

/** Local inbox of encounters. Statuses are read live from the contract. */
export function EncounterHistory() {
  const { service } = useWallet();
  const [refs, setRefs] = useState<EncounterRef[]>([]);
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setRefs(parseHistory(window.localStorage.getItem(HISTORY_KEY)));
    setActivity(parseActivity(window.localStorage.getItem(ACTIVITY_KEY)));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (event: StorageEvent) => {
      if (event.key === HISTORY_KEY) setRefs(parseHistory(event.newValue));
      if (event.key === ACTIVITY_KEY) setActivity(parseActivity(event.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        refs.map(async (ref) => {
          try {
            const encounter = await service.read(BigInt(ref.id));
            return [ref.id, statusNameOf(encounter.status)] as const;
          } catch {
            return [ref.id, "unknown"] as const;
          }
        }),
      );
      if (cancelled) return;
      const current = Object.fromEntries(entries);
      setStatuses(current);
      if (typeof window === "undefined") return;
      const raw = window.localStorage.getItem(ACTIVITY_KEY);
      const baselineRaw = window.localStorage.getItem("ecstasy:activity-baseline");
      let baseline: Record<string, string> = {};
      try {
        baseline = baselineRaw ? (JSON.parse(baselineRaw) as Record<string, string>) : {};
      } catch {
        baseline = {};
      }
      const diff = diffStatuses(baseline, current);
      if (diff.items.length) {
        window.localStorage.setItem(ACTIVITY_KEY, mergeActivity(raw, diff.items));
        setActivity(parseActivity(mergeActivity(raw, diff.items)));
      }
      window.localStorage.setItem("ecstasy:activity-baseline", JSON.stringify(diff.next));
    })();
    return () => {
      cancelled = true;
    };
  }, [refs, service]);

  function remove(id: string) {
    if (typeof window === "undefined") return;
    const next = removeEncounterRef(window.localStorage.getItem(HISTORY_KEY), id);
    window.localStorage.setItem(HISTORY_KEY, next);
    setRefs(parseHistory(next));
  }

  if (refs.length === 0) {
    return (
      <div className="card">
        <h2>Mis encuentros</h2>
        <p className="muted small">
          Aún no hay encuentros en este navegador. Crea uno o abre una invitación para que aparezca
          aquí. Este índice es local: no contiene términos privados y el contrato sigue siendo la
          fuente de verdad del estado.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Mis encuentros</h2>
      <p className="muted small">Índice local de encuentros creados o abiertos en este navegador.</p>
      {activity.length > 0 && (
        <>
          <h3>Actividad reciente</h3>
          <ul className="muted small">
            {activity.slice(0, 5).map((item, index) => (
              <li key={`${item.id}-${item.at}-${index}`}>
                Encounter #{item.id}: {item.from} → {item.to} ({new Date(item.at).toLocaleString()})
              </li>
            ))}
          </ul>
          <div style={{ height: 14 }} />
        </>
      )}
      <div className="grid">
        {refs.map((ref) => (
          <div className="card" key={ref.id} style={{ padding: 16 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <strong>Encounter #{ref.id}</strong>
              <span className={`badge status-${(statuses[ref.id] ?? "unknown").toLowerCase()}`}>
                {statuses[ref.id] ?? "leyendo…"}
              </span>
            </div>
            <p className="muted small" style={{ marginTop: 10 }}>
              Rol: {roleLabel(ref.role)} · añadido {new Date(ref.addedAt).toLocaleString()}
            </p>
            <div className="row" style={{ marginTop: 10 }}>
              <Link className="btn btn-small" href={`/encounter/${ref.id}`}>
                Abrir →
              </Link>
              <button className="btn btn-small btn-danger" onClick={() => remove(ref.id)}>
                Quitar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
