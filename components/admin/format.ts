import { priceFromMinorUnits } from "@/lib/format";

/** Centavos → "R$ 1.234,56". O mesmo conversor que o site usa. */
export function money(minor: number | null | undefined, currency = "BRL", digits = 2): string {
  if (minor === null || minor === undefined) return "—";
  return priceFromMinorUnits(minor, digits, currency);
}

const dateFormat = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
const dateTimeFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

export function date(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : dateFormat.format(d);
}

export function dateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : dateTimeFormat.format(d);
}
