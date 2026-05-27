import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './locales/fr.json';
import en from './locales/en.json';
import ar from './locales/ar.json';
import {
  applyDocumentLanguage,
  getStoredLanguage,
  resolveLanguage
} from './language.js';

const resources = {
  fr: { translation: fr },
  en: { translation: en },
  ar: { translation: ar }
};

const initialLanguage = getStoredLanguage() || resolveLanguage(
  typeof navigator !== 'undefined' ? navigator.language : 'fr'
);

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: 'fr',
  supportedLngs: ['fr', 'en', 'ar'],
  load: 'languageOnly',
  nonExplicitSupportedLngs: true,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
  returnEmptyString: false
});

applyDocumentLanguage(i18n.language);

i18n.on('languageChanged', (lng) => {
  applyDocumentLanguage(lng);
});

export { resolveLanguage, changeAppLanguage, SUPPORTED_LANGUAGES, isActiveLanguage } from './language.js';
export default i18n;
