const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Preços em joalheria não pedem centavos — pedem clareza. */
export function price(value: number): string {
  return brl.format(value);
}

/**
 * Valores da Hostinger chegam em unidades mínimas da moeda (centavos):
 * `12900` é R$ 129,00. Nunca passar um destes a `price()`, que espera reais
 * inteiros — o resultado sairia cem vezes maior. Um valor inválido devolve
 * "—" em vez de um preço errado.
 */
export function priceFromMinorUnits(
  amount: number,
  decimalDigits = 2,
  currencyCode = "BRL",
): string {
  if (!Number.isSafeInteger(amount) || !Number.isInteger(decimalDigits) || decimalDigits < 0) {
    return "—";
  }

  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currencyCode.toUpperCase(),
      minimumFractionDigits: decimalDigits,
      maximumFractionDigits: decimalDigits,
    }).format(amount / 10 ** decimalDigits);
  } catch {
    return "—";
  }
}

/**
 * O mesmo valor como decimal exacto em texto ("129.00"), sem aritmética de
 * vírgula flutuante — para o JSON-LD e para comparações.
 */
export function minorUnitsToDecimal(amount: number, decimalDigits = 2): string {
  const digits = String(Math.abs(Math.trunc(amount))).padStart(decimalDigits + 1, "0");
  const whole = digits.slice(0, digits.length - decimalDigits);
  const fraction = decimalDigits > 0 ? `.${digits.slice(-decimalDigits)}` : "";
  return `${amount < 0 ? "-" : ""}${whole}${fraction}`;
}

export function ordinal(index: number): string {
  return String(index + 1).padStart(2, "0");
}
