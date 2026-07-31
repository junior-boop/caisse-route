const FORMATEUR_MONTANT = new Intl.NumberFormat("fr-FR", { currency: "XAF", style: "currency", maximumFractionDigits: 0 });

export function formatMontant(amount: number) {
  return FORMATEUR_MONTANT.format(amount);
}
