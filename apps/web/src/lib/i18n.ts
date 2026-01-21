export type Language = 'en' | 'es' | 'sr' | 'fr';

export const SUPPORTED_LANGUAGES: Language[] = ['en', 'es', 'sr', 'fr'];

export const LANGUAGE_NAMES: Record<Language, { english: string; native: string }> = {
  en: { english: 'English', native: 'English' },
  es: { english: 'Spanish', native: 'Español' },
  sr: { english: 'Serbian', native: 'Српски' },
  fr: { english: 'French', native: 'Français' },
};

export function isValidLanguage(lang: string): lang is Language {
  return SUPPORTED_LANGUAGES.includes(lang as Language);
}

export function getDefaultLanguage(): Language {
  return 'en';
}

// UI Translations
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.directory': 'Directory',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.signin': 'Sign In',
    'nav.signup': 'Sign Up',
    
    // Directory
    'directory.title': 'Business Directory',
    'directory.subtitle': 'Find local businesses in your city',
    'directory.selectCity': 'Select a City',
    'directory.selectCategory': 'Select a Category',
    'directory.allCities': 'All Cities',
    'directory.allCategories': 'All Categories',
    'directory.businesses': 'Businesses',
    'directory.noBusinesses': 'No businesses found in this category.',
    'directory.noCities': 'No cities available.',
    'directory.noCategories': 'No categories available.',
    'directory.viewAll': 'View All',
    'directory.backToCities': 'Back to Cities',
    'directory.backToCategories': 'Back to Categories',
    'directory.searchPlaceholder': 'Search businesses...',
    'directory.featured': 'Featured',
    'directory.verified': 'Verified',
    'directory.languages': 'Languages',
    'directory.contact': 'Contact',
    'directory.website': 'Website',
    'directory.phone': 'Phone',
    'directory.email': 'Email',
    'directory.address': 'Address',
    
    // Language selector
    'language.select': 'Select Language',
    'language.current': 'Current Language',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.retry': 'Retry',
    'common.close': 'Close',
    'common.open': 'Open',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.more': 'More',
    'common.less': 'Less',
  },
  es: {
    // Navigation
    'nav.home': 'Inicio',
    'nav.directory': 'Directorio',
    'nav.about': 'Acerca de',
    'nav.contact': 'Contacto',
    'nav.signin': 'Iniciar Sesión',
    'nav.signup': 'Registrarse',
    
    // Directory
    'directory.title': 'Directorio de Negocios',
    'directory.subtitle': 'Encuentra negocios locales en tu ciudad',
    'directory.selectCity': 'Selecciona una Ciudad',
    'directory.selectCategory': 'Selecciona una Categoría',
    'directory.allCities': 'Todas las Ciudades',
    'directory.allCategories': 'Todas las Categorías',
    'directory.businesses': 'Negocios',
    'directory.noBusinesses': 'No se encontraron negocios en esta categoría.',
    'directory.noCities': 'No hay ciudades disponibles.',
    'directory.noCategories': 'No hay categorías disponibles.',
    'directory.viewAll': 'Ver Todo',
    'directory.backToCities': 'Volver a Ciudades',
    'directory.backToCategories': 'Volver a Categorías',
    'directory.searchPlaceholder': 'Buscar negocios...',
    'directory.featured': 'Destacado',
    'directory.verified': 'Verificado',
    'directory.languages': 'Idiomas',
    'directory.contact': 'Contacto',
    'directory.website': 'Sitio Web',
    'directory.phone': 'Teléfono',
    'directory.email': 'Correo',
    'directory.address': 'Dirección',
    
    // Language selector
    'language.select': 'Seleccionar Idioma',
    'language.current': 'Idioma Actual',
    
    // Common
    'common.loading': 'Cargando...',
    'common.error': 'Ocurrió un error',
    'common.retry': 'Reintentar',
    'common.close': 'Cerrar',
    'common.open': 'Abrir',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.search': 'Buscar',
    'common.filter': 'Filtrar',
    'common.sort': 'Ordenar',
    'common.more': 'Más',
    'common.less': 'Menos',
  },
  sr: {
    // Navigation
    'nav.home': 'Почетна',
    'nav.directory': 'Директоријум',
    'nav.about': 'О нама',
    'nav.contact': 'Контакт',
    'nav.signin': 'Пријава',
    'nav.signup': 'Регистрација',
    
    // Directory
    'directory.title': 'Пословни директоријум',
    'directory.subtitle': 'Пронађите локалне фирме у вашем граду',
    'directory.selectCity': 'Изаберите град',
    'directory.selectCategory': 'Изаберите категорију',
    'directory.allCities': 'Сви градови',
    'directory.allCategories': 'Све категорије',
    'directory.businesses': 'Фирме',
    'directory.noBusinesses': 'Нема фирми у овој категорији.',
    'directory.noCities': 'Нема доступних градова.',
    'directory.noCategories': 'Нема доступних категорија.',
    'directory.viewAll': 'Погледај све',
    'directory.backToCities': 'Назад на градове',
    'directory.backToCategories': 'Назад на категорије',
    'directory.searchPlaceholder': 'Претражи фирме...',
    'directory.featured': 'Истакнуто',
    'directory.verified': 'Верификовано',
    'directory.languages': 'Језици',
    'directory.contact': 'Контакт',
    'directory.website': 'Веб сајт',
    'directory.phone': 'Телефон',
    'directory.email': 'Имејл',
    'directory.address': 'Адреса',
    
    // Language selector
    'language.select': 'Изаберите језик',
    'language.current': 'Тренутни језик',
    
    // Common
    'common.loading': 'Учитавање...',
    'common.error': 'Дошло је до грешке',
    'common.retry': 'Покушај поново',
    'common.close': 'Затвори',
    'common.open': 'Отвори',
    'common.save': 'Сачувај',
    'common.cancel': 'Откажи',
    'common.search': 'Претрага',
    'common.filter': 'Филтер',
    'common.sort': 'Сортирај',
    'common.more': 'Више',
    'common.less': 'Мање',
  },
  fr: {
    // Navigation
    'nav.home': 'Accueil',
    'nav.directory': 'Annuaire',
    'nav.about': 'À propos',
    'nav.contact': 'Contact',
    'nav.signin': 'Connexion',
    'nav.signup': 'Inscription',
    
    // Directory
    'directory.title': 'Annuaire des Entreprises',
    'directory.subtitle': 'Trouvez des entreprises locales dans votre ville',
    'directory.selectCity': 'Sélectionnez une Ville',
    'directory.selectCategory': 'Sélectionnez une Catégorie',
    'directory.allCities': 'Toutes les Villes',
    'directory.allCategories': 'Toutes les Catégories',
    'directory.businesses': 'Entreprises',
    'directory.noBusinesses': 'Aucune entreprise trouvée dans cette catégorie.',
    'directory.noCities': 'Aucune ville disponible.',
    'directory.noCategories': 'Aucune catégorie disponible.',
    'directory.viewAll': 'Voir Tout',
    'directory.backToCities': 'Retour aux Villes',
    'directory.backToCategories': 'Retour aux Catégories',
    'directory.searchPlaceholder': 'Rechercher des entreprises...',
    'directory.featured': 'En vedette',
    'directory.verified': 'Vérifié',
    'directory.languages': 'Langues',
    'directory.contact': 'Contact',
    'directory.website': 'Site Web',
    'directory.phone': 'Téléphone',
    'directory.email': 'E-mail',
    'directory.address': 'Adresse',
    
    // Language selector
    'language.select': 'Sélectionner la Langue',
    'language.current': 'Langue Actuelle',
    
    // Common
    'common.loading': 'Chargement...',
    'common.error': 'Une erreur est survenue',
    'common.retry': 'Réessayer',
    'common.close': 'Fermer',
    'common.open': 'Ouvrir',
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.search': 'Rechercher',
    'common.filter': 'Filtrer',
    'common.sort': 'Trier',
    'common.more': 'Plus',
    'common.less': 'Moins',
  },
};

export function t(key: string, lang: Language = 'en'): string {
  return translations[lang]?.[key] ?? translations.en[key] ?? key;
}

export function getLocalizedName<T extends { name_en: string; name_es?: string | null; name_sr?: string | null; name_fr?: string | null }>(
  item: T,
  lang: Language
): string {
  switch (lang) {
    case 'es':
      return item.name_es || item.name_en;
    case 'sr':
      return item.name_sr || item.name_en;
    case 'fr':
      return item.name_fr || item.name_en;
    default:
      return item.name_en;
  }
}

export function getLocalizedDescription<T extends { description_en?: string | null; description_es?: string | null; description_sr?: string | null; description_fr?: string | null }>(
  item: T,
  lang: Language
): string | null {
  switch (lang) {
    case 'es':
      return item.description_es || item.description_en || null;
    case 'sr':
      return item.description_sr || item.description_en || null;
    case 'fr':
      return item.description_fr || item.description_en || null;
    default:
      return item.description_en || null;
  }
}

// Helper to create language-aware URLs
export function createDirectoryUrl(lang: Language, city?: string, category?: string): string {
  let url = `/directory/${lang}`;
  if (city) {
    url += `/${city}`;
    if (category) {
      url += `/${category}`;
    }
  }
  return url;
}
