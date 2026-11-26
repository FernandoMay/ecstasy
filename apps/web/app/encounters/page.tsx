"use client";

import { EncounterHistory } from "@/components/EncounterHistory";

export default function EncountersPage() {
  return (
    <>
      <section className="hero" style={{ paddingTop: 36 }}>
        <h1>
          Mis encuentros<span>Índice local, estado on-chain</span>
        </h1>
        <p>
          Accede rápido a los encuentros que creaste o abriste. El estado mostrado se lee en cada
          visita desde el contrato; los términos privados nunca se guardan aquí.
        </p>
      </section>
      <EncounterHistory />
    </>
  );
}
