/** Langues prises en charge par la vitrine (codes ISO courts). */
export const SUPPORTED_LANGUAGES = [
  { code: 'fr', label: 'FR' },
  { code: 'en', label: 'EN' },
  { code: 'ar', label: 'AR' }
];

const SUPPORTED_CODES = SUPPORTED_LANGUAGES.map((l) => l.code);
const STORAGE_KEY = 'althea_lang';

/** Normalise fr-FR, en-US, ar-SA → fr | en | ar */
export function resolveLanguage(lng) {
  const raw = String(lng || 'fr').toLowerCase().split('-')[0];
  return SUPPORTED_CODES.includes(raw) ? raw : 'fr';
}

export function isRtlLanguage(lng) {
  return resolveLanguage(lng) === 'ar';
}

export function isActiveLanguage(currentLng, code) {
  return resolveLanguage(currentLng) === code;
}

export function applyDocumentLanguage(lng) {
  if (typeof document === 'undefined') return;
  const code = resolveLanguage(lng);
  document.documentElement.lang = code;
  document.documentElement.dir = isRtlLanguage(code) ? 'rtl' : 'ltr';
}

/** Langue persistée (prioritaire au premier chargement). */
export function getStoredLanguage() {
  if (typeof localStorage === 'undefined') return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored && SUPPORTED_CODES.includes(stored) ? stored : null;
}

export async function changeAppLanguage(i18n, code) {
  const next = resolveLanguage(code);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, next);
  }
  await i18n.changeLanguage(next);
  applyDocumentLanguage(next);
}
