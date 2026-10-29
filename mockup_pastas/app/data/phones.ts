export const MAX_ADDITIONAL_PHONES = 20;

export function validatePhones(primary: unknown, additional: unknown = []) {
  if (typeof primary !== "string" || !primary.trim()) throw new Error("Ingresá el teléfono principal.");
  if (!Array.isArray(additional) || additional.length > MAX_ADDITIONAL_PHONES) throw new Error(`Podés guardar hasta ${MAX_ADDITIONAL_PHONES} teléfonos adicionales.`);
  const seen = new Set<string>();
  const numbers = [primary, ...additional].map((value, index) => {
    if (typeof value !== "string" || !value.trim() || value.length > 40 || !/\d/.test(value)) {
      throw new Error(index === 0 ? "Revisá el teléfono principal (máximo 40 caracteres)." : "Completá cada teléfono adicional o quitalo de la lista (máximo 40 caracteres).");
    }
    const number = value.trim();
    const key = number.replace(/\D/g, "");
    if (seen.has(key)) throw new Error("Hay teléfonos repetidos. Ingresá cada número una sola vez.");
    seen.add(key);
    return number;
  });
  return { phone: numbers[0], additionalPhones: numbers.slice(1) };
}
