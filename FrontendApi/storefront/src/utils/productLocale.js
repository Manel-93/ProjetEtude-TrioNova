/**
 * Libellés vitrine : noms, descriptions et fiches techniques (FR en base → EN / AR).
 */
import { resolveLanguage } from '../i18n/language.js';
import {
  DESCRIPTION_PHRASES,
  PRODUCT_SPEC_KEYS,
  PRODUCT_SPEC_VALUES
} from '../i18n/productSpecs.js';
import { getSlugTranslation } from '../i18n/productSlugTranslations.js';
import { matchCatalog, norm } from './productCatalogI18n.js';
import { translateSpecText } from '../i18n/specTokenTranslate.js';

function langCode(lng) {
  return resolveLanguage(lng);
}

function lookupSpecMap(map, key, lng) {
  const id = norm(key).replace(/\s+/g, '_');
  const entry = map[id];
  if (!entry) return null;
  if (lng === 'en') return entry.en;
  if (lng === 'ar') return entry.ar;
  return null;
}

function translateDescriptionFallback(desc, lng) {
  if (lng === 'fr' || !desc) return null;
  const nd = norm(desc);
  const matched = DESCRIPTION_PHRASES.filter((p) => nd.includes(p.fr));
  if (!matched.length) return null;
  return matched.map((p) => (lng === 'en' ? p.en : p.ar)).join(' ');
}

export function getProductDisplayName(product, lng) {
  if (!product?.name) return '';
  const l = langCode(lng);
  if (l === 'fr') return product.name;

  if (l === 'en' && product.nameEn) return product.nameEn;
  if (l === 'ar' && product.nameAr) return product.nameAr;

  const match = matchCatalog(product);
  if (match) return l === 'en' ? match.name.en : match.name.ar;

  return product.name;
}

export function getProductDisplayDescription(product, lng) {
  const desc = product?.description;
  if (!desc) return '';
  const l = langCode(lng);
  if (l === 'fr') return desc;

  const slugTr = getSlugTranslation(product.slug, l);
  if (slugTr?.description?.[l]) return slugTr.description[l];

  if (l === 'en' && product.descriptionEn) return product.descriptionEn;
  if (l === 'ar' && product.descriptionAr) return product.descriptionAr;

  const match = matchCatalog(product);
  if (match) return l === 'en' ? match.desc.en : match.desc.ar;

  const partial = translateDescriptionFallback(desc, l);
  if (partial) return partial;

  const tokenized = translateSpecText(desc, l);
  if (norm(tokenized) !== norm(desc)) return tokenized;

  return desc;
}

function parseTechnicalSpecs(raw) {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }
  return typeof raw === 'object' ? raw : null;
}

export function translateSpecLabel(key, lng) {
  const l = langCode(lng);
  if (l === 'fr') return key;
  const tr = lookupSpecMap(PRODUCT_SPEC_KEYS, key, l);
  if (tr) return tr;
  return translateSpecText(key, l);
}

export function translateSpecValue(value, lng) {
  const l = langCode(lng);
  const raw = String(value ?? '');
  if (l === 'fr') return raw;

  const exact = lookupSpecMap(PRODUCT_SPEC_VALUES, raw, l);
  if (exact) return exact;

  let out = raw;
  for (const [id, entry] of Object.entries(PRODUCT_SPEC_VALUES)) {
    const frPhrase = id.replace(/_/g, ' ');
    if (norm(out).includes(frPhrase)) {
      const rep = l === 'en' ? entry.en : entry.ar;
      out = out.replace(new RegExp(frPhrase, 'gi'), rep);
    }
  }
  return translateSpecText(out, l);
}

export function getProductDisplaySpecs(product, lng) {
  const l = langCode(lng);

  const slugTr = getSlugTranslation(product?.slug, l);
  if (slugTr?.specs?.[l]?.length) {
    return slugTr.specs[l].map(([key, value]) => ({ key, value }));
  }

  const raw = parseTechnicalSpecs(product?.technicalSpecs);
  if (!raw) return [];

  if (raw.fr || raw.en || raw.ar) {
    const block = raw[l] || raw.fr || raw.en || raw.ar;
    if (block && typeof block === 'object' && !Array.isArray(block)) {
      return Object.entries(block)
        .filter(([k]) => !['fr', 'en', 'ar', 'i18n'].includes(k))
        .map(([key, value]) => ({
          key: translateSpecLabel(key, l),
          value: translateSpecValue(value, l)
        }));
    }
  }

  const reserved = new Set(['fr', 'en', 'ar', 'i18n']);
  const entries = Object.entries(raw).filter(([k]) => !reserved.has(k));
  const result = [];

  for (const [key, value] of entries) {
    if (value && typeof value === 'object' && (value.fr || value.en || value.ar)) {
      const hasLocale = value[l] != null && String(value[l]).trim() !== '';
      const localized = hasLocale ? value[l] : value.fr || value.en || value.ar || '';
      result.push({
        key: translateSpecLabel(key, l),
        value: hasLocale ? String(localized) : translateSpecValue(localized, l)
      });
      continue;
    }
    result.push({
      key: translateSpecLabel(key, l),
      value: translateSpecValue(value, l)
    });
  }

  return result;
}
