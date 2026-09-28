/* ============================================================================
   E2E do painel administrativo — MODO SIMULADO
   ----------------------------------------------------------------------------
   Corre contra dados SIMULADOS (loja e banco em memória, lib/simulated/),
   não contra a Hostinger nem o Supabase. Valida o comportamento do painel e
   do site: acesso por papel, criar → completar → publicar → aparecer no
   site → despublicar, preços, variantes, imagens, pedidos, configuração.

     node scripts/e2e/admin-simulado.mjs            # next build + next start
     E2E_BASE=http://localhost:3200 node scripts/e2e/admin-simulado.mjs --sem-build

   Com um Chromium pré-instalado: PLAYWRIGHT_CHROMIUM_PATH=/caminho/chrome
   ========================================================================== */

import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { deflateSync } from "node:zlib";
import { chromium, devices } from "playwright";

const PORT = 3200;
const BASE = process.env.E2E_BASE ?? `http://localhost:${PORT}`;
const OUT = process.env.E2E_OUT ?? path.resolve(".e2e-capturas/admin");
const SKIP_BUILD = process.argv.includes("--sem-build");
const PASSWORD = "simulacao-local";

const env = {
  ADMIN_SIMULATION: "true",
  NEXT_PUBLIC_HOSTINGER_SALES_CHANNEL_ID: "scha_simulado",
  NEXT_PUBLIC_HOSTINGER_STOREFRONT_API_URL: `${BASE}/api/simulacao/storefront`,
};

let passed = 0;
let failed = 0;
function check(label, ok, detail = "") {
  if (ok) passed++;
  else failed++;
  console.log(`${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const NEXT_BIN = path.resolve("node_modules/.bin/next");

function run(args) {
  return spawn(NEXT_BIN, args, { env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"], detached: true });
}

async function waitForServer(url, timeout = 120_000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(10_000) });
      if (res.status < 500) return;
    } catch {
      /* a arrancar */
    }
    await sleep(1000);
  }
  throw new Error(`Servidor não respondeu em ${url}`);
}

/** PNG válido gerado aqui (não é uma fotografia); `noise` torna-o grande. */
function tinyPng(size = 2, noise = false) {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr.set([8, 2, 0, 0, 0], 8);
  const raw = Buffer.alloc(size * (1 + size * 3));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size * 3; x++) {
      raw[y * (1 + size * 3) + 1 + x] = noise ? Math.floor(Math.random() * 256) : x % 3 === 0 ? 5 : 29;
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

async function login(page, email, password = PASSWORD) {
  await page.goto(`${BASE}/admin/entrar`);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
}

async function logout(page) {
  await page.getByRole("button", { name: "Sair" }).first().click();
  await page.waitForURL(/\/admin\/entrar/);
}

async function siteStatus(slug) {
  const res = await fetch(`${BASE}/produto/${slug}`, { signal: AbortSignal.timeout(30_000) });
  return res.status;
}

/** A revalidação por tag refaz a página no pedido seguinte; espera-se por ela. */
async function waitSiteStatus(slug, expected, timeout = 30_000) {
  const start = Date.now();
  let status = 0;
  while (Date.now() - start < timeout) {
    status = await siteStatus(slug);
    if (status === expected) return status;
    await sleep(1000);
  }
  return status;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  let server = null;

  if (!process.env.E2E_BASE) {
    if (!SKIP_BUILD) {
      console.log("A construir (next build, modo simulado)…");
      const build = run(["build"]);
      let log = "";
      build.stdout.on("data", (d) => (log += d));
      build.stderr.on("data", (d) => (log += d));
      const code = await new Promise((r) => build.on("exit", r));
      if (code !== 0) {
        console.error(log.slice(-3000));
        throw new Error("next build falhou");
      }
    }
    server = run(["start", "-p", String(PORT)]);
  }

  const browser = await chromium.launch(
    process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {},
  );

  try {
    await waitForServer(`${BASE}/admin/entrar`);
    console.log(`Servidor em ${BASE} (dados SIMULADOS)\n`);

    const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(`${m.text()} ${m.location()?.url ?? ""}`);
    });
    page.on("response", (r) => {
      if (r.status() >= 400) console.log(`  (resposta ${r.status()} ${r.url()})`);
    });

    /* --- Acesso ------------------------------------------------------ */
    const anon = await fetch(`${BASE}/admin/produtos`, { redirect: "manual" });
    check("sem sessão, /admin/produtos redireciona para entrar", anon.status === 307 && /\/admin\/entrar/.test(anon.headers.get("location") ?? ""));
    check("cabeçalhos de segurança no painel", anon.headers.get("x-frame-options") === "DENY" && /noindex/.test(anon.headers.get("x-robots-tag") ?? ""));

    await login(page, "editor@simulacao.local", "senha-errada");
    await page.getByText("E-mail ou senha incorretos.").waitFor();
    check("senha errada: mensagem genérica", true);

    await login(page, "fora@simulacao.local");
    await page.waitForURL(/sem-acesso/);
    check("conta sem papel → “sem acesso”", await page.getByText("Esta conta não tem acesso").isVisible());
    await page.getByRole("button", { name: "Sair" }).click();
    await page.waitForURL(/\/admin\/entrar/);

    await login(page, "leitura@simulacao.local");
    await page.waitForURL(`${BASE}/admin`);
    await page.goto(`${BASE}/admin/produtos`);
    check("leitura: sem botão “Novo produto”", (await page.getByRole("link", { name: "Novo produto" }).count()) === 0);
    await page.goto(`${BASE}/admin/produtos/novo`);
    check("leitura: /admin/produtos/novo volta à lista", page.url().endsWith("/admin/produtos"));
    await page.goto(`${BASE}/admin/produtos/sim_prod_anel_prata`);
    check("leitura: campos de preço desativados", await page.getByLabel(/^Preço de /).first().isDisabled());
    check("leitura: sem “Salvar preços e estoque”", (await page.getByRole("button", { name: "Salvar preços e estoque" }).count()) === 0);
    await page.goto(`${BASE}/admin/site`);
    check("leitura: configuração do site fechada", page.url().endsWith("/admin"));
    await logout(page);

    /* --- Editor: criar → completar → publicar ------------------------- */
    await login(page, "editor@simulacao.local");
    await page.waitForURL(`${BASE}/admin`);
    await page.screenshot({ path: path.join(OUT, "01-visao-geral.png"), fullPage: true });
    check("visão geral: pedidos a enviar = 1", (await page.getByRole("link", { name: /Pedidos a enviar/ }).innerText()).includes("1"));

    await page.getByRole("link", { name: "Novo produto" }).first().click();
    await page.waitForURL(/produtos\/novo/);
    await page.getByLabel("Nome do produto").fill("Anel Aurora em ouro 18k");
    check("endereço sugerido a partir do nome", (await page.getByLabel("Endereço no site").inputValue()) === "anel-aurora-em-ouro-18k");
    await page.getByLabel("Endereço no site").fill("aliança-perene");
    await page.getByLabel("Categoria").selectOption("aneis");
    await page.getByLabel("Coleção").selectOption("noturno");
    await page.getByLabel("Linha curta").fill("Solitário de linhas limpas");
    await page.getByLabel("Preço (R$)").fill("1.290,00");
    await page.getByLabel("Opção", { exact: true }).fill("Aro");
    await page.getByLabel("Valor da opção").fill("16");
    await page.getByLabel("SKU").fill("HM-AUR-16");
    await page.getByLabel("Quantidade em estoque").fill("3");
    await page.getByRole("button", { name: "Criar produto" }).click();
    await page.getByText("Use só letras minúsculas").waitFor();
    check("endereço inválido (acento) é recusado no servidor", true);
    await page.getByLabel("Endereço no site").fill("anel-aurora");
    await page.getByRole("button", { name: "Criar produto" }).click();
    await page.waitForURL(/\/admin\/produtos\/sim_prod_.*criado=1/);
    const productUrl = page.url().split("?")[0];
    check("produto criado e aberto", await page.getByText("Produto criado como rascunho").isVisible());
    check("nasce como rascunho", await page.getByText("Rascunho", { exact: true }).first().isVisible());
    check("rascunho não aparece no site (404)", (await siteStatus("anel-aurora")) === 404);

    // Ficha do site
    await page.getByLabel("Nome no site").fill("Aurora");
    await page.getByLabel("Descrição", { exact: true }).fill("Um solitário de linhas limpas, executado à mão.");
    await page.getByLabel("Material").fill("Ouro amarelo 18k");
    await page.getByLabel("Medidas").fill("Aro 2 mm");
    await page.getByLabel("Destaque na página inicial").check();
    await page.getByRole("button", { name: "Salvar ficha do site" }).click();
    await page.getByText("Ficha do site salva.").waitFor();
    check("ficha do site gravada", true);
    check("depois de gravar, “Destaque” continua marcado", await page.getByLabel("Destaque na página inicial").isChecked());

    // Imagem
    await page.locator('input[type="file"][name="image"]').setInputFiles({ name: "aurora.png", mimeType: "image/png", buffer: tinyPng() });
    await page.getByText("Imagem enviada.").first().waitFor({ timeout: 15_000 });
    check("imagem enviada e anexada", (await page.getByText("Principal", { exact: true }).count()) === 1);
    const big = tinyPng(1000, true);
    await page.locator('input[type="file"][name="image"]').setInputFiles({ name: "grande.png", mimeType: "image/png", buffer: big });
    await page.getByText("Imagem enviada.").first().waitFor({ timeout: 30_000 });
    await page.waitForFunction(() => document.querySelectorAll("ul li img").length >= 2, null, { timeout: 15_000 });
    check(`imagem de ${(big.length / 1024 / 1024).toFixed(1)} MB aceite (limite 4 MB)`, true);
    await page.locator('input[type="file"][name="image"]').setInputFiles({ name: "falsa.png", mimeType: "image/png", buffer: Buffer.from("<svg/>") });
    await page.getByText("Use JPEG, PNG, WebP ou GIF.").waitFor({ timeout: 15_000 });
    check("arquivo que não é imagem é recusado (assinatura)", true);

    // Variantes
    await page.getByRole("button", { name: "Adicionar variante" }).click();
    await page.getByLabel("Opção", { exact: true }).last().fill("Aro");
    await page.getByLabel("Valor", { exact: true }).fill("18");
    await page.getByLabel("Preço (R$)").last().fill("1.390,00");
    await page.getByRole("button", { name: "Adicionar", exact: true }).click();
    await page.getByText("Variante adicionada.").waitFor();
    check("variante adicionada", (await page.getByText("Aro: 18").count()) === 1);

    await page.getByLabel("Preço promocional de Aro: 16").fill("1.300,00");
    await page.getByRole("button", { name: "Salvar preços e estoque" }).click();
    check("promocional ≥ preço é recusado", await page.getByText("tem de ser menor que o preço").isVisible());
    await page.getByLabel("Preço de Aro: 16").fill("1.250,00");
    await page.getByLabel("Preço promocional de Aro: 16").fill("1.190,00");
    await page.getByRole("button", { name: "Salvar preços e estoque" }).click();
    await page.getByText("Preços e estoque salvos.").waitFor();
    check("preço e promoção gravados", (await page.getByLabel("Preço de Aro: 16").inputValue()) === "1.250,00");
    check("editor não vê excluir variante (só admin)", (await page.getByRole("button", { name: /^Excluir / }).count()) === 0);
    await page.screenshot({ path: path.join(OUT, "02-produto.png"), fullPage: true });

    // Publicar
    await page.getByRole("button", { name: "Publicar no site e na loja" }).click();
    await page.getByText("Publicado. A peça aparece no site").waitFor();
    check("publicado", await page.getByRole("link", { name: "Ver no site" }).isVisible());
    check("endereço travado com o produto publicado", await page.getByLabel("Endereço", { exact: true }).evaluate((el) => el.readOnly));

    /* --- Site público --------------------------------------------------- */
    check("publicado → /produto/anel-aurora responde 200", (await waitSiteStatus("anel-aurora", 200)) === 200);
    const site = await context.newPage();
    site.on("pageerror", (e) => errors.push(`site: ${e.message}`));
    await site.goto(`${BASE}/produto/anel-aurora`);
    await site.locator("h1").first().waitFor();
    check("site mostra o nome da ficha", (await site.locator("h1").first().innerText()).includes("Aurora"));
    await site.getByText(/R\$\s1\.190,00/).first().waitFor({ timeout: 20_000 });
    check("site mostra o preço promocional ao vivo (R$ 1.190,00)", true);
    check("site oferece as opções da loja (Aro 16 e 18)", (await site.getByText("18", { exact: true }).count()) > 0);
    check("site não mostra “Referência” vazia", (await site.getByText("Referência", { exact: true }).count()) === 0);
    const joias = await (await fetch(`${BASE}/joias`)).text();
    check("/joias lista a peça nova", joias.includes("/produto/anel-aurora"));
    const home = await (await fetch(`${BASE}/`)).text();
    check("destaque entra na vitrine da página inicial", home.includes("/produto/anel-aurora"));
    const colecao = await (await fetch(`${BASE}/colecoes/noturno`)).text();
    check("coleção Noturno inclui a peça", colecao.includes("/produto/anel-aurora"));
    const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
    check("sitemap inclui a peça", sitemap.includes("/produto/anel-aurora"));
    await site.screenshot({ path: path.join(OUT, "03-site-produto.png"), fullPage: false });
    await site.close();

    /* --- Despublicar --------------------------------------------------- */
    await page.goto(productUrl);
    await page.getByRole("button", { name: "Despublicar" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Despublicar" }).click();
    await page.getByText("Despublicado.").waitFor();
    check("despublicado → sai do site (404)", (await waitSiteStatus("anel-aurora", 404)) === 404);
    await logout(page);

    /* --- Admin: configuração do site e exclusão de variante ------------- */
    await login(page, "admin@simulacao.local");
    await page.waitForURL(`${BASE}/admin`);
    await page.goto(productUrl);
    check("admin vê excluir variante", (await page.getByRole("button", { name: /^Excluir / }).count()) === 2);
    await page.getByRole("button", { name: "Excluir Aro: 18" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Excluir variante" }).click();
    await page.getByText("Variante excluída.").waitFor();
    await page.getByText("Aro: 18", { exact: true }).waitFor({ state: "detached" });
    check("variante excluída", (await page.getByText("Aro: 18", { exact: true }).count()) === 0);

    await page.goto(`${BASE}/admin/site`);
    await page.getByLabel("Mostrar as peças de protótipo").click();
    await page.getByRole("button", { name: "Salvar" }).click();
    await page.getByText("Configuração do site salva.").waitFor();
    check("depois de gravar, o interruptor mostra o valor gravado", (await page.getByRole("switch").getAttribute("aria-checked")) === "false");
    let start = Date.now();
    let hidden = false;
    while (Date.now() - start < 30_000 && !hidden) {
      hidden = !(await (await fetch(`${BASE}/joias`)).text()).includes("/produto/alian");
      if (!hidden) await sleep(1000);
    }
    check("protótipos escondidos do site", hidden);
    check("peça de protótipo responde 404 quando escondida", (await waitSiteStatus("colar-meridiano", 404)) === 404);
    await page.getByLabel("Mostrar as peças de protótipo").click();
    await page.getByRole("button", { name: "Salvar" }).click();
    await page.getByText("Configuração do site salva.").waitFor();
    check("protótipos de volta", (await waitSiteStatus("colar-meridiano", 200)) === 200);

    /* --- Pedidos ------------------------------------------------------- */
    await page.goto(`${BASE}/admin/pedidos`);
    check("pedidos: 2 na lista", (await page.locator("tbody tr").count()) === 2);
    await page.getByRole("link", { name: /A enviar/ }).click();
    await page.waitForURL(/estado=a-enviar/);
    check("pedidos a enviar: 1", (await page.locator("tbody tr").count()) === 1);
    await page.getByRole("link", { name: "#1002" }).click();
    await page.waitForURL(/pedidos\/sim_order_1002/);
    check("detalhe do pedido: total R$ 324,90", await page.getByText(/R\$\s324,90/).first().isVisible());
    check("detalhe do pedido: endereço de entrega", await page.getByText("Rua Simulada, 100").isVisible());
    await page.screenshot({ path: path.join(OUT, "04-pedido.png"), fullPage: true });

    /* --- Celular -------------------------------------------------------- */
    const mobile = await browser.newContext({ ...devices["Pixel 7"] });
    await mobile.addCookies(await context.cookies());
    const m = await mobile.newPage();
    await m.goto(`${BASE}/admin/produtos`);
    await m.getByRole("button", { name: "Abrir menu" }).click();
    check("celular: menu em gaveta", await m.getByRole("link", { name: "Pedidos" }).isVisible());
    await m.waitForTimeout(600); // fim da animação da gaveta, para a captura
    const overflow = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check("celular: sem rolagem horizontal na página", overflow <= 0, `${overflow}px`);
    await m.screenshot({ path: path.join(OUT, "05-celular-menu.png") });
    await mobile.close();

    await logout(page);
    const after = await fetch(`${BASE}/admin`, { redirect: "manual" });
    check("depois de sair, /admin volta a pedir entrada", after.status === 307);

    check("sem erros de JavaScript no painel e no site", errors.length === 0, errors.slice(0, 3).join(" | "));
    await context.close();
  } catch (error) {
    failed++;
    console.error("✗ fluxo interrompido —", error);
  } finally {
    await browser.close();
    if (server) {
      try {
        process.kill(-server.pid, "SIGTERM");
      } catch {
        /* já terminou */
      }
    }
  }

  console.log(`\n${passed}/${passed + failed} verificações passaram (dados SIMULADOS).`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
