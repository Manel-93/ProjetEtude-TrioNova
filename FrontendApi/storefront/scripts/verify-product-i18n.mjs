import { getProductDisplayDescription, getProductDisplaySpecs } from '../src/utils/productLocale.js';

const products = [
  { name: 'Thermomètre infrarouge', slug: 'thermometre-infrarouge', description: 'Thermomètre sans contact rapide et précis pour usage médical', technicalSpecs: { poids: '150g', type: 'Infrarouge', portee: '5-10 cm' } },
  { name: 'Divan d\'Examen Inox', slug: 'divan-examen-inox', description: 'Table d\'examen robuste avec dossier réglable pour cabinets médicaux.', technicalSpecs: { structure: 'Acier inoxydable', revêtement: 'Similicuir lavable', largeur: '65 cm' } },
  { name: 'Échographe Portable Pro', slug: 'echographe-portable-pro', description: 'Système d\'imagerie par ultrasons haute résolution pour diagnostics rapides.', technicalSpecs: { écran: '15 pouces LED', autonomie: '3 heures', sondes: 'Convexe et Linéaire' } }
];

for (const p of products) {
  console.log('\n###', p.slug, 'AR');
  console.log('DESC:', getProductDisplayDescription(p, 'ar'));
  console.log('SPECS:', getProductDisplaySpecs(p, 'ar'));
  console.log('EN DESC:', getProductDisplayDescription(p, 'en').slice(0, 60));
}
