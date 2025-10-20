export function normalizeActivityKey(raw) {
  if (!raw) return null;
  const normalized = raw
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9]+/g, '-') // non-alphanumeric to hyphen
    .replace(/^-+|-+$/g, ''); // trim leading/trailing hyphen

  return normalized || null;
}

export function buildDailyActivityKey(fallback) {
  return normalizeActivityKey(fallback);
}
