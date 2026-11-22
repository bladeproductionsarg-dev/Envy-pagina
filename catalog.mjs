// Catálogo de venta directa de ENVY. Importes en pesos argentinos por unidad.
export const tiers = [
  { from: 1, price: 20000 },
  { from: 6, price: 17500 },
  { from: 15, price: 15000 },
];
export const deliveryZones = ["Ciudad Autónoma de Buenos Aires"];
export function unitPrice(quantity) {
  return (
    tiers.findLast((tier) => quantity >= tier.from)?.price ?? tiers[0].price
  );
}
