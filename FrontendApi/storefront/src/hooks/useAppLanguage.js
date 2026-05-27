import { useTranslation } from 'react-i18next';
import { resolveLanguage } from '../i18n/language.js';

/** Langue UI normalisée (fr | en | ar), stable pour les libellés produits/API. */
export function useAppLanguage() {
  const { i18n } = useTranslation();
  const lang = resolveLanguage(i18n.resolvedLanguage || i18n.language);
  return { lang, i18n };
}
