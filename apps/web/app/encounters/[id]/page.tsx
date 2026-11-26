"use client";

import { EncounterWorkspace } from "@/components/EncounterWorkspace";
import { useParams } from "next/navigation";

export default function EncounterDetailPage() {
  const params = useParams<{ id: string }>();
  return <EncounterWorkspace id={String(params?.id ?? "")} />;
}
