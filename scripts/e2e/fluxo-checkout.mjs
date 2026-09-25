/* ============================================================================
   Teste de ponta a ponta — sacola, migração, checkout e SEO
   ----------------------------------------------------------------------------
   Corre a loja contra a Storefront SIMULADA (./storefront-simulada.mjs), não
   contra a Hostinger: valida o comportamento do site, não o formato real da
   API. A validação real faz-se no Preview (docs/, roteiro de homologação).

     node scripts/e2e/fluxo-checkout.mjs            # next dev (StrictMode)
     node scripts/e2e/fluxo-checkout.mjs --prod     # next build + next start

   Capturas em E2E_OUT (por omissão, ./.e2e-capturas — fora do git).
   ========================================================================== */

import { spawn } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { chromium, devices } from "playwright";
import { CHANNEL_ID, VARIANT_ID, startStorefront } from "./storefront-simulada.mjs";

const PROD = process.argv.includes("--prod");
const PORT = 3100;
const BASE = `http://localhost:${PORT}`;
const OUT = process.env.E2E_OUT ?? path.resolve(".e2e-capturas");
const V1 = "hertmann:store:v1";
const V2 = "hertmann:store:v2";
const PENDING = "hertmann:checkout:pending";

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok: Boolean(ok), detail });
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const NEXT_BIN = path.resolve("node_modules/.bin/next");

/** Processo num grupo próprio, para que o fecho leve também os filhos do Next. */
function run(args, env) {
  return spawn(NEXT_BIN, args, {
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });
}

function stop(child) {
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    /* já terminou */
  }
}

async function waitForServer(url, timeout = 180_000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      if (res.ok) return;
    } catch {
      /* ainda a arrancar */
    }
    await sleep(1000);
  }
  throw new Error(`Servidor não respondeu em ${url}`);
}

async function control(storefrontUrl, body) {
  await fetch(storefrontUrl.replace(/\/v2$/, "/__control"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function checkouts(storefrontUrl) {
  return (await fetch(storefrontUrl.replace(/\/v2$/, "/__checkouts"))).json();
}

const readStore = (page) =>
  page.evaluate(
    ([v1, v2, pending]) => ({
      v1: localStorage.getItem(v1),
      v2: JSON.parse(localStorage.getItem(v2) ?? "null"),
      pending: localStorage.getItem(pending),
    }),
    [V1, V2, PENDING],
  );

async function flow(browser, storefront, label, contextOptions) {
  await control(storefront, { reset: true, inventory: 3 });
  // Movimento normal por omissão: é com ele que um erro de hidratação do
  // código aparece. (Com movimento reduzido há um aviso pré-existente no
  // CrystalMark do rodapé — ver docs/.)
  const context = await browser.newContext({
    ...contextOptions,
    ...(process.env.E2E_REDUCED ? { reducedMotion: "reduce" } : {}),
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    // Pedidos que o próprio teste faz falhar (API em baixo) não contam.
    if (m.type() !== "error" || /Failed to load resource/.test(m.text())) return;
    errors.push(m.text().slice(0, 200));
    if (process.env.E2E_DEBUG_CONSOLE) console.log(`[console.error @ ${page.url()}]\n${m.text().slice(0, 4000)}`);
  });
  const shot = (name) => page.screenshot({ path: path.join(OUT, `${label}-${name}.png`), caret: "initial" });

  // --- 1. Migração v1 → v2 -------------------------------------------------
  await page.goto(`${BASE}/sobre`);
  await page.evaluate((key) => {
    localStorage.clear();
    localStorage.setItem(
      key,
      JSON.stringify({
        bag: [
          { slug: "par-vertente", option: "16", quantity: 2 },
          { slug: "colar-noturno", quantity: 1 },
          { slug: "peca-que-ja-nao-existe", quantity: 1 },
        ],
        favourites: ["colar-noturno", "brinco-ponto"],
      }),
    );
  }, V1);
  await page.goto(`${BASE}/`);
  await page.getByRole("button", { name: /^Sacola, 3 peças$/ }).waitFor({ timeout: 60_000 });
  let store = await readStore(page);
  check(`${label}: migração grava a v2 e só então apaga a v1`, store.v2 && store.v1 === null);
  check(
    `${label}: migração preserva as 3 linhas (incl. peça inexistente) e as quantidades`,
    store.v2?.bag?.length === 3 &&
      store.v2.bag.find((l) => l.slug === "par-vertente")?.quantity === 2 &&
      store.v2.bag.every((l) => !l.variantId),
    JSON.stringify(store.v2?.bag),
  );
  check(`${label}: favoritos preservados`, store.v2?.favourites?.join() === "colar-noturno,brinco-ponto");

  await page.getByRole("button", { name: /^Sacola, 3 peças$/ }).click();
  const bag = page.getByRole("dialog", { name: "Sacola" });
  await bag.waitFor();
  const consultCount = await bag.getByText("Sob consulta", { exact: true }).count();
  check(`${label}: linhas legadas visíveis como "Sob consulta"`, consultCount === 2, `${consultCount} linhas`);
  check(
    `${label}: nota de que peças sob consulta ficam fora do total`,
    await bag.getByText("Peças sob consulta não entram no total nem no pagamento online.").isVisible(),
  );
  check(
    `${label}: sacola só com peças sob consulta não permite checkout`,
    await bag.getByRole("button", { name: "Finalizar compra" }).isDisabled(),
  );
  await shot("sacola-legada");
  await page.keyboard.press("Escape");

  // --- 2. Peça de protótipo -------------------------------------------------
  await page.goto(`${BASE}/produto/par-vertente`);
  const detail = page.locator("h1").first();
  await detail.waitFor();
  check(`${label}: protótipo mantém o preço editorial`, await page.getByText(/R\$\s16\.400/).first().isVisible());
  const consult = page.getByRole("link", { name: "Consultar disponibilidade" });
  check(`${label}: protótipo mostra "Consultar disponibilidade" → /contato`, (await consult.getAttribute("href")) === "/contato");
  check(`${label}: protótipo sem seletor de quantidade`, (await page.getByText("Quantidade", { exact: true }).count()) === 0);
  const ldPrototype = await page.$$eval('script[type="application/ld+json"]', (s) => s.map((x) => JSON.parse(x.textContent)));
  check(`${label}: JSON-LD do protótipo sem oferta`, ldPrototype.find((x) => x["@type"] === "Product")?.offers === undefined);
  await shot("produto-prototipo");

  // --- 3. Peça de homologação -----------------------------------------------
  await page.goto(`${BASE}/produto/homologacao-hostinger`);
  await page.getByText(/R\$\s299,90/).first().waitFor({ timeout: 60_000 });
  check(`${label}: preço Hostinger convertido de centavos (29990 → R$ 299,90)`, true);
  check(`${label}: preço anterior riscado (39990 → R$ 399,90)`, await page.locator("s", { hasText: /R\$\s399,90/ }).isVisible());
  const robots = await page.locator('meta[name="robots"]').getAttribute("content");
  check(`${label}: página de homologação noindex`, robots?.includes("noindex"));
  const ldLive = await page.$$eval('script[type="application/ld+json"]', (s) => s.map((x) => JSON.parse(x.textContent)));
  const offer = ldLive.find((x) => x["@type"] === "Product")?.offers;
  check(`${label}: JSON-LD com oferta real`, offer?.price === "299.90" && offer?.priceCurrency === "BRL", JSON.stringify(offer));

  const plus = page.getByRole("button", { name: "Aumentar quantidade", exact: true });
  for (let i = 0; i < 5; i++) if (await plus.isEnabled()) await plus.click();
  check(`${label}: quantidade limitada pelo estoque (3)`, await plus.isDisabled());
  await shot("produto-homologacao");
  await page.getByRole("button", { name: "Adicionar à sacola" }).click();
  await bag.waitFor();
  await bag.getByText(/R\$\s899,70/).first().waitFor({ timeout: 30_000 });
  check(`${label}: sacola com preço real × quantidade (3 × R$ 299,90)`, true);
  check(
    `${label}: total só conta as peças compráveis`,
    (await bag.locator("footer").innerText()).match(/R\$\s899,70/) !== null,
  );
  check(
    `${label}: "+" na sacola desactivado no limite do estoque`,
    await bag.getByRole("button", { name: "Aumentar quantidade de Homologação" }).isDisabled(),
  );
  await shot("sacola-mista");

  await page.reload();
  store = await readStore(page);
  const liveLine = store.v2?.bag?.find((l) => l.variantId === VARIANT_ID);
  check(`${label}: sacola persiste após recarregar (variantId + quantity)`, liveLine?.quantity === 3, JSON.stringify(liveLine));

  // --- 4. Checkout → cancelar ------------------------------------------------
  await page.getByRole("button", { name: /^Sacola,/ }).click();
  await bag.getByRole("button", { name: "Finalizar compra" }).click();
  await page.waitForURL(/127\.0\.0\.1:4010\/checkout\//, { timeout: 30_000 });
  const sent = (await checkouts(storefront)).at(-1);
  check(
    `${label}: checkout envia só as linhas compráveis`,
    sent?.items?.length === 1 && sent.items[0].variant_id === VARIANT_ID && sent.items[0].quantity === 3,
    JSON.stringify(sent?.items),
  );
  check(`${label}: success_url na origem actual, com ref`, /^http:\/\/localhost:3100\/checkout\/sucesso\?ref=.+/.test(sent?.success_url ?? ""), sent?.success_url);
  check(`${label}: cancel_url na origem actual`, sent?.cancel_url === `${BASE}/checkout/cancelado`);
  check(`${label}: locale enviado`, sent?.locale === "pt-BR");

  await page.click("#cancel");
  await page.waitForURL(/\/checkout\/cancelado/);
  await page.getByRole("heading", { name: "A compra não foi concluída." }).waitFor();
  store = await readStore(page);
  check(`${label}: cancelamento preserva a sacola inteira`, store.v2?.bag?.length === 4 && store.pending !== null);
  await shot("checkout-cancelado");
  await page.getByRole("button", { name: "Voltar à sacola" }).click();
  await bag.waitFor();
  check(`${label}: "Voltar à sacola" reabre a sacola`, await bag.isVisible());

  // --- 5. Checkout → pagar (Test Payment simulado) ---------------------------
  await bag.getByRole("button", { name: "Finalizar compra" }).click();
  await page.waitForURL(/127\.0\.0\.1:4010\/checkout\//, { timeout: 30_000 });
  await page.click("#pay");
  await page.waitForURL(/\/checkout\/sucesso\?ref=/);
  await page.getByRole("heading", { name: "Obrigado." }).waitFor();
  await page.waitForFunction((key) => !localStorage.getItem(key), PENDING, { timeout: 10_000 });
  store = await readStore(page);
  check(
    `${label}: sucesso retira só o que foi pago; peças sob consulta ficam`,
    store.v2?.bag?.length === 3 && !store.v2.bag.some((l) => l.variantId),
    JSON.stringify(store.v2?.bag),
  );
  await shot("checkout-sucesso");

  // --- 6. Sucesso aberto à mão não mexe na sacola ------------------------------
  await page.goto(`${BASE}/produto/homologacao-hostinger`);
  await page.getByRole("button", { name: "Adicionar à sacola" }).click();
  await bag.waitFor();
  await page.goto(`${BASE}/checkout/sucesso?ref=inventado`);
  await page.getByRole("heading", { name: "Obrigado." }).waitFor();
  await sleep(1500);
  store = await readStore(page);
  check(`${label}: /checkout/sucesso sem ref correspondente não esvazia nada`, store.v2?.bag?.some((l) => l.variantId === VARIANT_ID));

  // --- 7. Erros ---------------------------------------------------------------
  await control(storefront, { failCheckout: true });
  await page.goto(`${BASE}/`);
  await page.getByRole("button", { name: /^Sacola,/ }).click();
  await bag.getByRole("button", { name: "Finalizar compra" }).click();
  await bag.getByText("Não foi possível abrir o pagamento.", { exact: false }).waitFor({ timeout: 30_000 });
  store = await readStore(page);
  check(`${label}: falha no checkout mostra aviso e preserva a sacola`, store.v2?.bag?.some((l) => l.variantId === VARIANT_ID));
  await shot("sacola-erro-checkout");
  await page.keyboard.press("Escape");

  await control(storefront, { failCheckout: false, rejectLocale: true });
  const before = (await checkouts(storefront)).length;
  await page.getByRole("button", { name: /^Sacola,/ }).click();
  await bag.getByRole("button", { name: "Finalizar compra" }).click();
  await page.waitForURL(/127\.0\.0\.1:4010\/checkout\//, { timeout: 30_000 });
  const retried = (await checkouts(storefront)).slice(before);
  check(
    `${label}: locale recusado → nova tentativa sem locale`,
    retried.length === 2 && "locale" in retried[0] && !("locale" in retried[1]),
    JSON.stringify(retried.map((r) => r.locale ?? null)),
  );
  await control(storefront, { rejectLocale: false });

  await control(storefront, { inventory: 0 });
  await page.goto(`${BASE}/produto/homologacao-hostinger?esgotado`);
  await page.getByRole("button", { name: "Esgotado" }).waitFor({ timeout: 60_000 });
  check(`${label}: estoque 0 → "Esgotado", botão desactivado`, await page.getByRole("button", { name: "Esgotado" }).isDisabled());
  await control(storefront, { inventory: 3 });

  check(`${label}: sem erros de JavaScript nem de consola`, errors.length === 0, errors.join(" | "));
  await context.close();
}

/**
 * API em baixo desde o primeiro pedido: nem o servidor nem o navegador têm
 * leitura. A página tem de servir, sem permitir compra, e "Tentar novamente"
 * tem de recuperar quando a API volta.
 */
async function coldStartWithoutApi(browser, storefront) {
  await control(storefront, { reset: true, failReads: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/produto/homologacao-hostinger`);
  const retry = page.getByRole("button", { name: "Tentar novamente" });
  try {
    await retry.waitFor({ timeout: 60_000 });
    check(
      'API em baixo desde o arranque → "Preço indisponível de momento" e compra bloqueada',
      (await page.getByText("Preço indisponível de momento").isVisible()) &&
        (await page.getByRole("button", { name: "Indisponível" }).isDisabled()),
    );
    // caret: "initial" — o valor por omissão injecta estilo nos campos e, antes
    // da hidratação, isso aparece como diferença de atributos no React.
    await page.screenshot({ path: path.join(OUT, "desktop-produto-api-em-baixo.png"), caret: "initial" });
    await control(storefront, { failReads: false });
    await retry.click();
    await page.getByText(/R\$\s299,90/).first().waitFor({ timeout: 30_000 });
    check('"Tentar novamente" recupera preço e estoque quando a API volta', true);
  } catch (error) {
    check("API em baixo desde o arranque", false, String(error.message).split("\n")[0]);
  } finally {
    await control(storefront, { failReads: false });
    await context.close();
  }
}

const offerInHtml = async () => {
  const html = await (await fetch(`${BASE}/produto/homologacao-hostinger`)).text();
  return /"offers":\{"@type":"Offer","price":"299\.90"/.test(html);
};

/**
 * Depois de uma falha, a página em cache (ISR) pode ter sido refeita sem
 * dados comerciais; a interface não sofre (o navegador relê), mas o JSON-LD
 * fica sem oferta até à revalidação seguinte (60 s). Confirma-se que recupera.
 */
async function waitForHealthyPage() {
  const start = Date.now();
  while (Date.now() - start < 200_000) {
    if (await offerInHtml()) {
      check("depois de a API voltar, o HTML recupera a oferta (ISR)", true, `${Math.round((Date.now() - start) / 1000)} s`);
      return;
    }
    await sleep(5_000);
  }
  check("depois de a API voltar, o HTML recupera a oferta (ISR)", false, "sem oferta após 200 s");
}

/** API em baixo a meio da navegação: a página serve e nada se compra às cegas. */
async function outageWhileBrowsing(browser, storefront) {
  await control(storefront, { reset: true, inventory: 3, failReads: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/produto/homologacao-hostinger?falha`);
  await page.locator("h1").first().waitFor();
  const retry = page.getByRole("button", { name: "Tentar novamente" });
  const livePrice = page.getByText(/R\$\s299,90/).first();
  await Promise.any([
    retry.waitFor({ timeout: 45_000 }),
    livePrice.waitFor({ timeout: 45_000 }),
  ]).catch(() => {});
  if (await retry.isVisible()) {
    check(
      'API em baixo a meio da navegação → "Preço indisponível de momento", compra bloqueada',
      await page.getByRole("button", { name: "Indisponível" }).isDisabled(),
    );
    await control(storefront, { failReads: false });
    await retry.click();
    await livePrice.waitFor({ timeout: 30_000 });
    check('"Tentar novamente" recupera preço e estoque', true);
  } else {
    check("API em baixo a meio da navegação → serve a leitura do servidor (ISR)", await livePrice.isVisible());
  }
  await control(storefront, { failReads: false });
  await context.close();
}

async function seo() {
  const home = await fetch(`${BASE}/`);
  const html = await home.text();
  check("SEO: nenhuma referência a hertmann.com.br no HTML da home (excepto o e-mail de contacto)", !/https?:\/\/(www\.)?hertmann\.com\.br/.test(html));
  check("SEO: meta robots noindex", /<meta name="robots" content="noindex, nofollow"/.test(html));
  check("SEO: canónico na origem actual", html.includes(`<link rel="canonical" href="${BASE}"`));
  check("SEO: cabeçalho X-Robots-Tag", home.headers.get("x-robots-tag") === "noindex, nofollow");
  const robots = await (await fetch(`${BASE}/robots.txt`)).text();
  check("SEO: robots.txt não anuncia sitemap enquanto não indexável", !/sitemap/i.test(robots), robots.replace(/\n/g, " ⏎ "));
  const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  check("SEO: sitemap na origem actual", locs.length > 0 && locs.every((u) => u.startsWith(BASE)), `${locs.length} URLs`);
  check("SEO: sitemap não inclui a homologação", !locs.some((u) => u.includes("homologacao")));
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const storefront = await startStorefront({ port: 4010 });
  const env = {
    PORT: String(PORT),
    NEXT_TELEMETRY_DISABLED: "1",
    NEXT_PUBLIC_HOSTINGER_SALES_CHANNEL_ID: CHANNEL_ID,
    NEXT_PUBLIC_HOSTINGER_STOREFRONT_API_URL: storefront.url,
    NEXT_PUBLIC_HOSTINGER_HOMOLOGATION: "true",
  };

  if (PROD) {
    console.log("A construir (next build)…");
    const build = run(["build"], env);
    build.stdout.on("data", () => {});
    build.stderr.pipe(process.stderr);
    const code = await new Promise((r) => build.on("close", r));
    if (code !== 0) throw new Error(`next build falhou (${code})`);
  }

  // Sem leituras antigas da API em cache: o arranque sem API tem de ser real.
  await rm(path.resolve(".next/cache/fetch-cache"), { recursive: true, force: true });

  const server = run([PROD ? "start" : "dev", "-p", String(PORT)], env);
  server.stdout.on("data", () => {});
  server.stderr.on("data", (d) => process.env.E2E_VERBOSE && process.stderr.write(d));
  let browser;

  try {
    await waitForServer(`${BASE}/sobre`);
    console.log(`Servidor ${PROD ? "de produção" : "de desenvolvimento (StrictMode)"} em ${BASE}\n`);
    // Com um Chromium já instalado de outra versão do Playwright, indique-o em
    // PLAYWRIGHT_CHROMIUM_PATH em vez de descarregar navegadores.
    browser = await chromium.launch(
      process.env.PLAYWRIGHT_CHROMIUM_PATH
        ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
        : {},
    );

    await coldStartWithoutApi(browser, storefront.url);
    await waitForHealthyPage();

    const contexts = [
      ["desktop", { viewport: { width: 1440, height: 900 } }],
      ["mobile", { ...devices["Pixel 7"] }],
    ];
    for (const [label, options] of contexts) {
      try {
        await flow(browser, storefront.url, label, options);
      } catch (error) {
        check(`${label}: fluxo interrompido`, false, String(error.message).split("\n")[0]);
      }
    }
    await outageWhileBrowsing(browser, storefront.url);
    await seo();
  } finally {
    await browser?.close();
    stop(server);
    await storefront.close();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} verificações passaram.`);
  if (failed.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
