/* ============================================================================
   Storefront API SIMULADA — só para testes locais. NÃO é a Hostinger.
   ----------------------------------------------------------------------------
   Serve o contrato descrito nas instruções oficiais de Custom Storefront
   (ecommerce_getCustomStorefrontSetupInstructionsV1 e hostinger/api-mcp-server
   skills/headless/references/STORE.md): produtos e variantes do canal, preços
   em centavos em `prices[]`, e POST /checkout que devolve `{ url, cart_token }`.

   O formato exacto das respostas públicas NÃO foi verificado contra o schema
   oficial (api-ecommerce.hostinger.com/v2/docs.json, bloqueado no ambiente de
   desenvolvimento). As listas vêm embrulhadas em `data`, como na API de
   gestão; o cliente aceita os dois formatos.

   Os dados do produto são os do produto de teste da loja Hertmann, lidos pela
   API de gestão em 2026-09-25: R$ 399,90 com promoção a R$ 299,90.

   Inclui um "checkout" simulado com dois links — pagar (Test Payment
   simulado) e cancelar — que devolvem o navegador ao success_url/cancel_url.
   ========================================================================== */

import http from "node:http";

export const CHANNEL_ID = "scha_01M2XNKMQ4ZWZ2DY9ZD7MJ8FPK";
export const PRODUCT_ID = "prod_01M2XN4RWHN3YSHPJJMMRBF6SD";
export const VARIANT_ID = "variant_01M2XN4RY2MTVB57FTFBQ3BNM7";

const initialControl = () => ({
  inventory: 10,
  rejectLocale: false,
  failCheckout: false,
  failReads: false,
});

export function startStorefront({ port = 4010 } = {}) {
  let control = initialControl();
  const checkouts = [];
  const sessions = new Map();
  const origin = `http://127.0.0.1:${port}`;

  const product = () => ({
    id: PRODUCT_ID,
    title: "Anel Solitário de Prata com Zircônias",
    status: "published",
    thumbnail: null,
    type: "physical",
    variant_count: 1,
  });

  const variant = () => ({
    id: VARIANT_ID,
    product_id: PRODUCT_ID,
    title: "Anel Solitário de Prata com Zircônias",
    sku: null,
    options: [],
    prices: [
      {
        amount: 39990,
        sale_amount: 29990,
        currency_code: "brl",
        currency: { code: "brl", symbol: "R$", decimal_digits: 2, template: "R$$1" },
      },
    ],
    inventory_quantity: control.inventory,
    manage_inventory: true,
  });

  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
  };

  const json = (res, status, body) => {
    res.writeHead(status, { "Content-Type": "application/json", ...cors });
    res.end(JSON.stringify(body));
  };

  const readBody = (req) =>
    new Promise((resolve) => {
      let raw = "";
      req.on("data", (chunk) => (raw += chunk));
      req.on("end", () => {
        try {
          resolve(raw ? JSON.parse(raw) : {});
        } catch {
          resolve(null);
        }
      });
    });

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, origin);
    const path = url.pathname;

    if (req.method === "OPTIONS") {
      res.writeHead(204, cors);
      return res.end();
    }

    // --- Controlo do teste ---------------------------------------------------
    if (path === "/__control" && req.method === "POST") {
      const { reset, ...changes } = (await readBody(req)) ?? {};
      control = { ...(reset ? initialControl() : control), ...changes };
      if (reset) checkouts.length = 0;
      return json(res, 200, control);
    }
    if (path === "/__checkouts") return json(res, 200, checkouts);

    // --- Storefront V2 simulada ----------------------------------------------
    const channel = path.match(/^\/v2\/channels\/([^/]+)\/(.+)$/);
    if (channel) {
      const [, channelId, rest] = channel;
      if (channelId !== CHANNEL_ID) return json(res, 404, { message: "Sales channel not found" });

      if (req.method === "GET" && control.failReads) {
        return json(res, 503, { message: "Simulated outage" });
      }

      if (req.method === "GET" && rest === "products") {
        const limit = Number(url.searchParams.get("limit") ?? 15);
        if (limit > 100) return json(res, 400, { message: "limit max 100" });
        return json(res, 200, { data: [product()], meta: { current_page: 1, per_page: limit, total: 1 } });
      }

      if (req.method === "GET" && rest === `products/${PRODUCT_ID}`) {
        return json(res, 200, { data: product() });
      }

      if (req.method === "GET" && rest === "variants") {
        const limit = Number(url.searchParams.get("limit") ?? 15);
        if (limit > 100) return json(res, 400, { message: "limit max 100" });
        const ids = url.searchParams.getAll("product_ids[]");
        const data = ids.length === 0 || ids.includes(PRODUCT_ID) ? [variant()] : [];
        return json(res, 200, { data, meta: { current_page: 1, per_page: limit, total: data.length } });
      }

      if (req.method === "POST" && rest === "checkout") {
        const body = await readBody(req);
        checkouts.push(body);

        if (control.failCheckout) return json(res, 500, { message: "Simulated failure" });
        if (control.rejectLocale && body && "locale" in body) {
          return json(res, 422, { message: "The selected locale is invalid." });
        }

        const valid =
          body &&
          Array.isArray(body.items) &&
          body.items.length > 0 &&
          body.items.every((i) => i.variant_id === VARIANT_ID && Number.isInteger(i.quantity) && i.quantity > 0) &&
          typeof body.success_url === "string" &&
          typeof body.cancel_url === "string";
        if (!valid) return json(res, 422, { message: "Invalid checkout payload" });

        const token = `cart_simulado_${checkouts.length}`;
        sessions.set(token, body);
        return json(res, 200, { url: `${origin}/checkout/${token}`, cart_token: token });
      }

      return json(res, 404, { message: "Not found" });
    }

    // --- Checkout hospedado simulado ----------------------------------------
    const hosted = path.match(/^\/checkout\/(.+)$/);
    if (hosted && sessions.has(hosted[1])) {
      const session = sessions.get(hosted[1]);
      // Simula parâmetros acrescentados pelo checkout ao regressar.
      const success = new URL(session.success_url);
      success.searchParams.set("order", "simulado");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return res.end(`<!doctype html><meta charset="utf-8"><title>Checkout simulado</title>
        <h1>Checkout SIMULADO — não é a Hostinger</h1>
        <p id="items">${JSON.stringify(session.items)}</p>
        <a id="pay" href="${success}">Pagar com Test Payment (simulado)</a>
        <a id="cancel" href="${session.cancel_url}">Cancelar</a>`);
    }

    res.writeHead(404, cors);
    res.end();
  });

  return new Promise((resolve) => {
    server.listen(port, "127.0.0.1", () =>
      resolve({
        url: `${origin}/v2`,
        // O servidor do Next mantém ligações keep-alive; sem as fechar, o
        // close() esperaria por elas indefinidamente.
        close: () =>
          new Promise((done) => {
            server.close(done);
            server.closeAllConnections();
          }),
      }),
    );
  });
}
