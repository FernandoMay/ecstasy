"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { statusNameOf } from "@ecstasy/stellar";
import { HISTORY_KEY, parseHistory, suggestedAction } from "@/lib/encounter-history";
import { useWallet } from "@/components/WalletProvider";

interface Pending {
  id: string;
  status: string;
  action: string;
  role: string;
}

export default function NotificationsPage() {
  const { service } = useWallet();
  const [items, setItems] = useState<Pending[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const refs = parseHistory(
        typeof window === "undefined" ? null : window.localStorage.getItem(HISTORY_KEY),
      );
      const pending = await Promise.all(
        refs.map(async (ref) => {
          try {
            const encounter = await service.read(BigInt(ref.id));
            const status = statusNameOf(encounter.status);
            const action = suggestedAction(status, ref.role);
            return action ? { id: ref.id, status, action, role: ref.role } : null;
          } catch {
            return null;
          }
        }),
      );
      if (!cancelled) setItems(pending.filter((item) => item !== null) as Pending[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [service]);

  return (
    <>
      <section className="hero" style={{ paddingTop: 36 }}>
        <h1>
          Notificaciones<span>Acciones pendientes, sin contenido privado</span>
        </h1>
        <p>
          Derivadas del estado on-chain de tus encuentros. Cada aviso lleva directamente a la acción
          correspondiente; nunca incluye términos privados.
        </p>
      </section>
      <div className="card">
        <h2>Pendiente de tu acción</h2>
        {items.length === 0 ? (
          <p className="muted small">No hay acciones pendientes para las identidades de este navegador.</p>
        ) : (
          <div className="grid">
            {items.map((item) => (
              <div className="card" key={item.id} style={{ padding: 16 }}>
                <strong>Encounter #{item.id}</strong>
                <p className="muted small" style={{ marginTop: 8 }}>
                  Estado: {item.status} · rol: {item.role}
                </p>
                <Link className="btn btn-small btn-primary" href={`/encounters/${item.id}`}>
                  {item.action} →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
