import { NextResponse } from "next/server";
import { simulationEnabled } from "@/lib/simulation";
import { simulatedState } from "@/lib/simulated/store";

/** Imagens enviadas no modo simulado (em memória). Fora dele, 404. */
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!simulationEnabled) return new NextResponse(null, { status: 404 });
  const image = simulatedState().images.get((await params).id);
  if (!image) return new NextResponse(null, { status: 404 });
  return new NextResponse(Buffer.from(image.bytes), {
    headers: { "Content-Type": image.type, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}
