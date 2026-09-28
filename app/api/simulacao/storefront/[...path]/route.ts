import { NextResponse, type NextRequest } from "next/server";
import { simulationEnabled } from "@/lib/simulation";
import { simulatedStorefront } from "@/lib/simulated/storefront";

/* ============================================================================
   Storefront SIMULADA — só no modo simulado local (lib/simulation.ts)
   ----------------------------------------------------------------------------
   Responde com o mesmo contrato da Storefront API V2 a partir da loja em
   memória, para o site ler pelo cliente de sempre (lib/hostinger/client.ts)
   quando NEXT_PUBLIC_HOSTINGER_STOREFRONT_API_URL aponta para aqui. Não é a
   Hostinger. Fora do modo simulado responde 404.
   ========================================================================== */

export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" };
const notFound = () => new NextResponse(null, { status: 404, headers });

type Params = { params: Promise<{ path: string[] }> };

function list<T>(data: T[]) {
  return NextResponse.json({ count: data.length, data, limit: 100, offset: 0 }, { headers });
}

export async function GET(request: NextRequest, { params }: Params) {
  if (!simulationEnabled) return notFound();
  const [channels, , resource, id] = (await params).path;
  if (channels !== "channels") return notFound();
  const { products } = simulatedStorefront();

  if (resource === "products" && !id) return list(products.map((p) => p.product));
  if (resource === "products" && id) {
    const found = products.find((p) => p.product.id === id);
    return found ? NextResponse.json(found.product, { headers }) : notFound();
  }
  if (resource === "variants") {
    const ids = new Set([
      ...request.nextUrl.searchParams.getAll("product_ids[]"),
      ...request.nextUrl.searchParams.getAll("product_ids"),
    ]);
    return list(products.filter((p) => ids.size === 0 || ids.has(p.product.id)).flatMap((p) => p.variants));
  }
  return notFound();
}

/** Checkout simulado: sem pagamento, volta direto ao success_url. */
export async function POST(request: NextRequest, { params }: Params) {
  if (!simulationEnabled) return notFound();
  const [, , resource] = (await params).path;
  if (resource !== "checkout") return notFound();
  const body = (await request.json().catch(() => null)) as { success_url?: string } | null;
  if (!body?.success_url) return NextResponse.json({ message: "success_url obrigatório" }, { status: 422, headers });
  return NextResponse.json({ url: body.success_url, cart_token: "simulado" }, { headers });
}

export async function OPTIONS() {
  if (!simulationEnabled) return notFound();
  return new NextResponse(null, {
    status: 204,
    headers: { ...headers, "Access-Control-Allow-Methods": "GET, POST", "Access-Control-Allow-Headers": "Content-Type, Accept" },
  });
}
