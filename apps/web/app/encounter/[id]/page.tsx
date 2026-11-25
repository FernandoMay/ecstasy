"use client";

import { EncounterWorkspace } from "@/components/EncounterWorkspace";
import { useParams } from "next/navigation";

export default function EncounterPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id ?? "");
  return <EncounterWorkspace id={id} />;
}
