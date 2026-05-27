/**
 * Correspondances catalogue (nom + description) FR → EN / AR par motifs produit.
 */

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

/** @type {Array<{ test: (n: string) => boolean, name: { en: string, ar: string }, desc: { en: string, ar: string } }>} */
export const CATALOG_MATCHERS = [
  {
    test: (n) => (n.includes('equipement') || n.includes('equipements')) && n.includes('medic'),
    name: { en: 'Medical equipment', ar: 'معدات طبية' },
    desc: {
      en: 'Professional medical equipment for clinics, practices and care facilities. CE-compliant quality.',
      ar: 'معدات طبية احترافية للعيادات والممارسات ومرافق الرعاية. جودة متوافقة مع معايير CE.'
    }
  },
  {
    test: (n) => n.includes('seringue') && n.includes('corps') && (n.includes('5ml') || n.includes('5 ml')),
    name: { en: '3-part 5 ml syringes', ar: 'محاقن ثلاثية القطع 5 مل' },
    desc: {
      en: 'Sterile 3-part syringes, 5 ml, for safe injections and clinical procedures.',
      ar: 'محاقن ثلاثية القطع معقمة 5 مل للحقن الآمن والإجراءات السريرية.'
    }
  },
  {
    test: (n) => (n.includes('gueridon') || n.includes('guerido')) && n.includes('inox'),
    name: { en: 'Stainless steel medical trolley', ar: 'عربة طبية من الفولاذ المقاوم للصدأ' },
    desc: {
      en: 'Sturdy stainless steel trolley for instruments and supplies in examination rooms.',
      ar: 'عربة متينة من الفولاذ المقاوم للصدأ للأدوات والمستلزمات في غرف الفحص.'
    }
  },
  {
    test: (n) => n.includes('table') && n.includes('examen') && (n.includes('electrique') || n.includes('electronique')),
    name: { en: 'Electric examination table', ar: 'طاولة فحص كهربائية' },
    desc: {
      en: 'Height-adjustable electric examination table for patient comfort and ergonomic care.',
      ar: 'طاولة فحص كهربائية قابلة للتعديل لراحة المريض ورعاية مريحة.'
    }
  },
  {
    test: (n) => n.includes('capteur') && n.includes('plan') && n.includes('radiolog'),
    name: { en: 'Radiology flat-panel detector', ar: 'مستشعر مسطح للأشعة' },
    desc: {
      en: 'High-resolution flat-panel detector for digital radiography and fast image acquisition.',
      ar: 'مستشعر مسطح عالي الدقة للتصوير الشعاعي الرقمي والتقاط سريع للصور.'
    }
  },
  {
    test: (n) => n.includes('thermometre') && n.includes('infrarouge'),
    name: { en: 'Infrared thermometer', ar: 'مقياس حرارة بالأشعة تحت الحمراء' },
    desc: {
      en: 'Fast, non-contact temperature measurement for clinics, hospitals and home care.',
      ar: 'قياس سريع للحرارة بدون تلامس للعيادات والمستشفيات والرعاية المنزلية.'
    }
  },
  {
    test: (n) =>
      n.includes('tensiometre') &&
      (n.includes('bras') || n.includes('brassard')) &&
      (n.includes('electrique') || n.includes('electronique')),
    name: { en: 'Upper-arm electronic blood pressure monitor', ar: 'جهاز قياس ضغط الدم الإلكتروني للذراع' },
    desc: {
      en: 'Automatic upper-arm blood pressure monitor with clear digital display and memory.',
      ar: 'جهاز آلي لضغط الدم على الذراع مع شاشة رقمية واضحة وذاكرة قياسات.'
    }
  },
  {
    test: (n) => n.includes('tensiometre') && !n.includes('bras') && !n.includes('brassard'),
    name: { en: 'Electronic blood pressure monitor', ar: 'جهاز قياس ضغط الدم الإلكتروني' },
    desc: {
      en: 'Reliable electronic blood pressure monitoring with intuitive operation.',
      ar: 'متابعة دقيقة لضغط الدم بجهاز إلكتروني سهل الاستخدام.'
    }
  },
  {
    test: (n) => n.includes('stethoscope'),
    name: { en: 'Professional stethoscope', ar: 'سماعة طبية احترافية' },
    desc: {
      en: 'Clear auscultation for cardiac and pulmonary examinations in daily practice.',
      ar: 'سماعة واضحة للفحوصات القلبية والرئوية في الممارسة اليومية.'
    }
  },
  {
    test: (n) => n.includes('echographe') && n.includes('portable'),
    name: { en: 'Premium portable ultrasound system', ar: 'جهاز موجات فوق صوتية محمول' },
    desc: {
      en: 'Portable ultrasound system for point-of-care imaging and rapid diagnostics.',
      ar: 'جهاز موجات فوق صوتية محمول للتصوير عند نقطة الرعاية والتشخيص السريع.'
    }
  },
  {
    test: (n) => n.includes('echographe'),
    name: { en: 'Ultrasound imaging system', ar: 'جهاز تصوير بالموجات فوق الصوتية' },
    desc: {
      en: 'Ultrasound platform for high-quality soft-tissue and vascular imaging.',
      ar: 'منصة موجات فوق صوتية لتصوير عالي الجودة للأنسجة الرخوة والأوعية.'
    }
  },
  {
    test: (n) => n.includes('negatoscope') && n.includes('led'),
    name: { en: 'LED X-ray film viewer', ar: 'عارض أشعة سينية LED' },
    desc: {
      en: 'Uniform LED backlight for reading radiographs with reduced eye strain.',
      ar: 'إضاءة LED موحدة لقراءة الأشعة السينية مع تقليل إجهاد العين.'
    }
  },
  {
    test: (n) => n.includes('lit') && n.includes('medicalise') && (n.includes('electrique') || n.includes('electronique')),
    name: { en: 'Electric medical bed', ar: 'سرير طبي كهربائي' },
    desc: {
      en: 'Electric medical bed with adjustable sections for patient care and recovery.',
      ar: 'سرير طبي كهربائي بأقسام قابلة للتعديل لرعاية المريض والتعافي.'
    }
  },
  {
    test: (n) => n.includes('lit') && n.includes('medicalise'),
    name: { en: 'Medical bed', ar: 'سرير طبي' },
    desc: {
      en: 'Comfortable medical bed for hospital wards and long-term care.',
      ar: 'سرير طبي مريح لأجنحة المستشفى والرعاية طويلة الأمد.'
    }
  },
  {
    test: (n) => n.includes('gants') && n.includes('nitrile'),
    name: { en: 'Powder-free nitrile gloves', ar: 'قفازات نتريل غير ممسحة' },
    desc: {
      en: 'Powder-free nitrile gloves for hygienic protection during examinations and procedures.',
      ar: 'قفازات نتريل خالية من البودرة للحماية الصحية أثناء الفحوصات والإجراءات.'
    }
  },
  {
    test: (n) => n.includes('masques') && n.includes('chirurgic'),
    name: { en: 'Surgical face masks', ar: 'كمامات جراحية' },
    desc: {
      en: 'Type IIR surgical masks for droplet protection in clinical settings.',
      ar: 'كمامات جراحية من النوع IIR للحماية من الرذاذ في البيئات السريرية.'
    }
  },
  {
    test: (n) => n.includes('otoscope') && n.includes('fibre') && n.includes('optique'),
    name: { en: 'LED fiber optic otoscope', ar: 'منظار أذن LED بالألياف البصرية' },
    desc: {
      en: 'Bright LED otoscope with fiber optic illumination for ear examinations.',
      ar: 'منظار أذن LED ساطع بإضاءة بالألياف البصرية لفحص الأذن.'
    }
  },
  {
    test: (n) => n.includes('otoscope') && n.includes('fibre'),
    name: { en: 'Fiber optic otoscope', ar: 'منظار أذن بالألياف البصرية' },
    desc: {
      en: 'Fiber optic otoscope for precise otoscopic examinations.',
      ar: 'منظار أذن بالألياف البصرية لفحوصات دقيقة للأذن.'
    }
  },
  {
    test: (n) => n.includes('glucometre'),
    name: { en: 'Blood glucose meter', ar: 'جهاز قياس سكر الدم' },
    desc: {
      en: 'Compact blood glucose meter for reliable capillary glucose monitoring.',
      ar: 'جهاز قياس سكر دم مدمج لمتابعة موثوقة للجلوكوز الشعري.'
    }
  },
  {
    test: (n) => n.includes('marteau') && n.includes('reflexe'),
    name: { en: 'Reflex hammer', ar: 'مطرقة انعكاس' },
    desc: {
      en: 'Neurological reflex hammer for tendon reflex assessment.',
      ar: 'مطرقة انعكاس عصبية لتقييم منعكسات الأوتار.'
    }
  },
  {
    test: (n) => n.includes('autoclave') && n.includes('classe') && n.includes('b'),
    name: { en: 'Class B autoclave 24 L', ar: 'معقم بخار فئة B' },
    desc: {
      en: 'Class B steam autoclave for validated sterilization of medical instruments.',
      ar: 'معقم بخار من الفئة B للتعقيم المعتمد للأدوات الطبية.'
    }
  },
  {
    test: (n) => n.includes('chaise') && n.includes('roulante'),
    name: { en: 'Wheelchair', ar: 'كرسي متحرك' },
    desc: {
      en: 'Durable wheelchair for patient mobility and daily transfers.',
      ar: 'كرسي متحرك متين لتنقل المرضى والنقل اليومي.'
    }
  },
  {
    test: (n) => n.includes('deambulateur'),
    name: { en: 'Walking frame (rollator)', ar: 'مشاية طبية (دعامة للمشي)' },
    desc: {
      en: 'Stable walking frame to support mobility and rehabilitation.',
      ar: 'مشاية مستقرة لدعم الحركة وإعادة التأهيل.'
    }
  },
  {
    test: (n) => n.includes('defibrillateur'),
    name: { en: 'Automated external defibrillator (AED)', ar: 'جهاز إزالة الرجفان (AED)' },
    desc: {
      en: 'AED designed for rapid intervention in cardiac emergencies with voice prompts.',
      ar: 'جهاز AED للتدخل السريع في حالات الطوارئ القلبية مع تعليمات صوتية.'
    }
  },
  {
    test: (n) => n.includes('concentrateur') && n.includes('oxygene'),
    name: { en: 'Oxygen concentrator', ar: 'مكثّف أكسجين طبي' },
    desc: {
      en: 'Continuous oxygen concentrator with quiet operation for home and clinical use.',
      ar: 'مكثّف أكسجين مستمر بتشغيل هادئ للاستخدام المنزلي والسريري.'
    }
  },
  {
    test: (n) => n.includes('oxymetre') || (n.includes('saturo') && n.includes('metre')),
    name: { en: 'Pulse oximeter', ar: 'مقياس تشبّع الأكسجين بالدم' },
    desc: {
      en: 'Instant SpO₂ and pulse rate readings on a compact fingertip device.',
      ar: 'قراءة فورية لتشبع الأكسجين والنبض على جهاز مدمج للإصبع.'
    }
  },
  {
    test: (n) => n.includes('pompe') && n.includes('vide'),
    name: { en: 'Medical suction pump', ar: 'مضخة شفط طبية' },
    desc: {
      en: 'Medical suction unit for airway secretions and surgical aspiration.',
      ar: 'وحدة شفط طبية لإفرازات الجهاز التنفسي والشفط الجراحي.'
    }
  },
  {
    test: (n) => n.includes('lampe') && (n.includes('scialytique') || n.includes('led')),
    name: { en: 'Surgical examination lamp', ar: 'مصباح فحص / جراحي LED' },
    desc: {
      en: 'High-intensity examination lamp with shadow-reduced illumination.',
      ar: 'مصباح فحص عالي الشدة بإضاءة مخففة للظلال.'
    }
  },
  {
    test: (n) => n.includes('balance') && n.includes('precision'),
    name: { en: 'Precision medical scale', ar: 'ميزان طبي دقيق' },
    desc: {
      en: 'Precision scale for accurate patient weighing in clinical settings.',
      ar: 'ميزان دقيق لوزن المرضى بدقة في البيئات السريرية.'
    }
  },
  {
    test: (n) => n.includes('scanner') || n.includes('tomographe'),
    name: { en: 'CT / imaging scanner', ar: 'ماسح التصوير المقطعي / التصوير' },
    desc: {
      en: 'Advanced medical imaging system for detailed sectional diagnostics.',
      ar: 'نظام تصوير طبي متقدم لتشخيصات مقطعية مفصلة.'
    }
  },
  {
    test: (n) => n.includes('radiologie') && n.includes('mobile'),
    name: { en: 'Mobile radiography unit', ar: 'وحدة تصوير شعاعي متنقلة' },
    desc: {
      en: 'Compact mobile radiography unit for emergency departments.',
      ar: 'وحدة تصوير شعاعي متنقلة مدمجة لأقسام الطوارئ.'
    }
  },
  {
    test: (n) => (n.includes('divan') || n.includes('table')) && n.includes('examen') && n.includes('inox'),
    name: { en: 'Stainless examination couch', ar: 'أريكة فحص من الفولاذ' },
    desc: {
      en: 'Robust examination couch with adjustable backrest for medical practices.',
      ar: 'أريكة فحص متينة بمسند ظهر قابل للتعديل للعيادات الطبية.'
    }
  },
  {
    test: (n) => n.includes('nettoyeur') && n.includes('ultrason'),
    name: { en: 'Ultrasonic cleaner 3 L', ar: 'منظّف بالموجات فوق الصوتية 3 ل' },
    desc: {
      en: 'Ultrasonic bath for pre-cleaning surgical instruments.',
      ar: 'حوض بالموجات فوق الصوتية للتنظيف الأولي للأدوات الجراحية.'
    }
  },
  {
    test: (n) => (n.includes('boite') || n.includes('boîte')) && n.includes('gants') && n.includes('nitrile'),
    name: { en: 'Nitrile gloves box (M)', ar: 'علبة قفازات نتريل (M)' },
    desc: {
      en: 'Latex-free examination gloves, highly resistant, powder-free.',
      ar: 'قفازات فحص خالية من اللاتكس، عالية المقاومة، غير ممسحة.'
    }
  },
  {
    test: (n) => n.includes('stethoscope') && n.includes('cardio'),
    name: { en: 'Cardiology stethoscope', ar: 'سماعة قلب' },
    desc: {
      en: 'High-sensitivity diagnostic instrument for cardiac auscultation.',
      ar: 'أداة تشخيص عالية الحساسية للتسمع القلبي.'
    }
  }
];

export function matchCatalog(product) {
  const n = norm(`${product?.name || ''} ${product?.slug || ''} ${product?.description || ''}`);
  return CATALOG_MATCHERS.find((m) => m.test(n)) || null;
}

export { norm };
