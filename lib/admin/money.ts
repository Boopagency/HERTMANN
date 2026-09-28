/* ============================================================================
   Dinheiro no painel — sempre em centavos por dentro, "1.234,56" por fora
   ========================================================================== */

/** Maior valor aceite: R$ 10.000.000,00. */
const MAX_MINOR = 1_000_000_000;

/**
 * "1.234,56", "1234,5", "1234", "R$ 1.234" → centavos. Sem vírgula, um
 * ponto seguido de exactamente três dígitos é separador de milhar
 * ("1.234" = mil duzentos e trinta e quatro); caso contrário, é decimal.
 * Devolve null para texto inválido, negativo ou com mais de 2 casas.
 */
export function parseMoney(input: unknown): number | null {
  if (typeof input !== "string") return null;
  let value = input.replace(/R\$|\s| /g, "");
  if (!value) return null;
  if (!/^\d[\d.,]*$/.test(value)) return null;

  if (value.includes(",")) {
    if (value.indexOf(",") !== value.lastIndexOf(",")) return null;
    value = value.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(value)) {
    value = value.replace(/\./g, "");
  }

  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ""] = value.split(".");
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(minor) || minor > MAX_MINOR) return null;
  return minor;
}

/** Centavos → texto para um campo de formulário ("1.234,56"). */
export function moneyInput(minor: number | null | undefined): string {
  if (minor === null || minor === undefined || !Number.isFinite(minor)) return "";
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(minor / 100);
}
