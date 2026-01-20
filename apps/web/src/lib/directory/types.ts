export interface City {
  id: string;
  slug: string;
  name_en: string;
  name_es: string | null;
  name_sr: string | null;
  name_fr: string | null;
  country_code: string;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  slug: string;
  name_en: string;
  name_es: string | null;
  name_sr: string | null;
  name_fr: string | null;
  description_en: string | null;
  description_es: string | null;
  description_sr: string | null;
  description_fr: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Business {
  id: string;
  user_id: string | null;
  city_id: string;
  category_id: string;
  slug: string;
  name: string;
  description_en: string | null;
  description_es: string | null;
  description_sr: string | null;
  description_fr: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  supported_languages: string[];
  logo_url: string | null;
  cover_image_url: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  city?: City;
  category?: Category;
}

export interface LanguageRecord {
  code: string;
  name_en: string;
  name_native: string;
  is_active: boolean;
  created_at: string;
}
