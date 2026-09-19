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
 * Preços vindos da Hostinger chegam em centavos: `29990` é R$299,90.
 * Aqui os centavos são mostrados apenas quando existem, para que um valor
 * redondo continue a ler-se como no resto do catálogo.
 */
export function priceFromMinorUnits(
  amount: number,
  decimalDigits = 2,
  currencyCode = "BRL",
): string {
  const factor = 10 ** decimalDigits;
  const fraction = amount % factor !== 0 ? decimalDigits : 0;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction,
  }).format(amount / factor);
}

export function ordinal(index: number): string {
  return String(index + 1).padStart(2, "0");
}
