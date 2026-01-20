import { createClient } from '@supabase/supabase-js';
import type { City, Category, Business } from './types';

function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function getCities(): Promise<City[]> {
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .eq('is_active', true)
    .order('name_en', { ascending: true });

  if (error) {
    console.error('Error fetching cities:', error);
    return [];
  }

  return data || [];
}

export async function getCityBySlug(slug: string): Promise<City | null> {
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching city:', error);
    return null;
  }

  return data;
}

export async function getCategories(): Promise<Category[]> {
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return data || [];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching category:', error);
    return null;
  }

  return data;
}

export async function getBusinessesByCityAndCategory(
  citySlug: string,
  categorySlug: string
): Promise<Business[]> {
  const supabase = getSupabaseServerClient();
  
  // First get the city and category IDs
  const [city, category] = await Promise.all([
    getCityBySlug(citySlug),
    getCategoryBySlug(categorySlug),
  ]);

  if (!city || !category) {
    return [];
  }

  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('city_id', city.id)
    .eq('category_id', category.id)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching businesses:', error);
    return [];
  }

  return data || [];
}

export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from('businesses')
    .select(`
      *,
      city:cities(*),
      category:categories(*)
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching business:', error);
    return null;
  }

  return data;
}

export async function getCategoriesWithBusinessCount(citySlug: string): Promise<(Category & { business_count: number })[]> {
  const supabase = getSupabaseServerClient();
  
  const city = await getCityBySlug(citySlug);
  if (!city) {
    return [];
  }

  // Get all categories
  const categories = await getCategories();
  
  // Get business counts for each category in this city
  const categoriesWithCounts = await Promise.all(
    categories.map(async (category) => {
      const { count, error } = await supabase
        .from('businesses')
        .select('*', { count: 'exact', head: true })
        .eq('city_id', city.id)
        .eq('category_id', category.id)
        .eq('is_active', true);

      return {
        ...category,
        business_count: error ? 0 : (count || 0),
      };
    })
  );

  return categoriesWithCounts;
}

export async function getCitiesWithBusinessCount(): Promise<(City & { business_count: number })[]> {
  const supabase = getSupabaseServerClient();
  
  const cities = await getCities();
  
  const citiesWithCounts = await Promise.all(
    cities.map(async (city) => {
      const { count, error } = await supabase
        .from('businesses')
        .select('*', { count: 'exact', head: true })
        .eq('city_id', city.id)
        .eq('is_active', true);

      return {
        ...city,
        business_count: error ? 0 : (count || 0),
      };
    })
  );

  return citiesWithCounts;
}
