export function normalizeAllCaps(input) {
  if (input == null) return input;
  const str = String(input);
  const hasLetters = /[A-Za-z]/.test(str);
  if (!hasLetters) return str;
  if (str !== str.toUpperCase()) return str;

  const trimmed = str.trim();
  if (!trimmed) return str;

  const first = trimmed.slice(0, 1).toUpperCase();
  const rest = trimmed.slice(1).toLowerCase();
  return `${first}${rest}`;
}

export function normalizeAllCapsText(input) {
  if (input == null) return input;
  const str = String(input);
  const hasLetters = /[A-Za-z]/.test(str);
  if (!hasLetters) return str;
  if (str !== str.toUpperCase()) return str;

  const lower = str.toLowerCase();
  // Capitalize first letter of each sentence for readability.
  return lower.replace(/(^|[.!?]\s+)([a-z])/g, (m, p1, p2) => `${p1}${p2.toUpperCase()}`);
}
