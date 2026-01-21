import { createClient } from '@supabase/supabase-js';
import type { Business, City, Category } from './types';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface SearchFilters {
  query?: string;
  citySlug?: string;
  categorySlug?: string;
  language?: string;
  verified?: boolean;
  hasWebsite?: boolean;
  hasPhone?: boolean;
  supportedLanguages?: string[];
  page?: number;
  limit?: number;
  sortBy?: 'relevance' | 'name' | 'newest' | 'rating';
}

export interface SearchResult {
  businesses: Business[];
  total: number;
  page: number;
  totalPages: number;
  filters: SearchFilters;
  suggestions?: string[];
}

export async function searchBusinesses(filters: SearchFilters): Promise<SearchResult> {
  const supabase = getSupabaseClient();
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('businesses')
    .select(`
      *,
      city:cities!inner(*),
      category:categories!inner(*)
    `, { count: 'exact' })
    .eq('is_active', true);

  // Text search
  if (filters.query && filters.query.trim()) {
    const searchTerm = filters.query.trim().toLowerCase();
    query = query.or(`name.ilike.%${searchTerm}%,description_en.ilike.%${searchTerm}%`);
  }

  // City filter
  if (filters.citySlug) {
    query = query.eq('city.slug', filters.citySlug);
  }

  // Category filter
  if (filters.categorySlug) {
    query = query.eq('category.slug', filters.categorySlug);
  }

  // Verified filter
  if (filters.verified) {
    query = query.eq('is_verified', true);
  }

  // Has website filter
  if (filters.hasWebsite) {
    query = query.not('website', 'is', null);
  }

  // Has phone filter
  if (filters.hasPhone) {
    query = query.not('phone', 'is', null);
  }

  // Supported languages filter
  if (filters.supportedLanguages && filters.supportedLanguages.length > 0) {
    query = query.overlaps('supported_languages', filters.supportedLanguages);
  }

  // Sorting
  switch (filters.sortBy) {
    case 'name':
      query = query.order('name', { ascending: true });
      break;
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    default:
      // Default: relevance (verified first, then by name)
      query = query.order('is_verified', { ascending: false }).order('name', { ascending: true });
  }

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Search error:', error);
    return {
      businesses: [],
      total: 0,
      page,
      totalPages: 0,
      filters,
    };
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    businesses: data || [],
    total,
    page,
    totalPages,
    filters,
  };
}

export async function getSearchSuggestions(query: string, limit = 5): Promise<string[]> {
  if (!query || query.length < 2) return [];

  const supabase = getSupabaseClient();
  const searchTerm = query.trim().toLowerCase();

  // Get business name suggestions
  const { data: businesses } = await supabase
    .from('businesses')
    .select('name')
    .ilike('name', `%${searchTerm}%`)
    .eq('is_active', true)
    .limit(limit);

  // Get category suggestions
  const { data: categories } = await supabase
    .from('categories')
    .select('name_en')
    .ilike('name_en', `%${searchTerm}%`)
    .eq('is_active', true)
    .limit(3);

  const suggestions: string[] = [];

  if (businesses) {
    suggestions.push(...businesses.map((b) => b.name));
  }

  if (categories) {
    suggestions.push(...categories.map((c) => c.name_en));
  }

  return [...new Set(suggestions)].slice(0, limit);
}

export async function getPopularSearches(citySlug?: string, limit = 10): Promise<string[]> {
  const supabase = getSupabaseClient();

  let query = supabase
    .from('search_queries')
    .select('normalized_query')
    .gt('results_count', 0)
    .order('created_at', { ascending: false })
    .limit(100);

  if (citySlug) {
    const { data: city } = await supabase
      .from('cities')
      .select('id')
      .eq('slug', citySlug)
      .single();

    if (city) {
      query = query.eq('city_id', city.id);
    }
  }

  const { data } = await query;

  if (!data) return [];

  // Count occurrences and return top queries
  const counts: Record<string, number> = {};
  data.forEach((row) => {
    if (row.normalized_query) {
      counts[row.normalized_query] = (counts[row.normalized_query] || 0) + 1;
    }
  });

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([query]) => query);
}

export function buildSearchUrl(
  lang: string,
  filters: SearchFilters
): string {
  const params = new URLSearchParams();

  if (filters.query) params.set('q', filters.query);
  if (filters.citySlug) params.set('city', filters.citySlug);
  if (filters.categorySlug) params.set('category', filters.categorySlug);
  if (filters.verified) params.set('verified', '1');
  if (filters.hasWebsite) params.set('website', '1');
  if (filters.hasPhone) params.set('phone', '1');
  if (filters.page && filters.page > 1) params.set('page', String(filters.page));
  if (filters.sortBy && filters.sortBy !== 'relevance') params.set('sort', filters.sortBy);

  const queryString = params.toString();
  return `/directory/${lang}/search${queryString ? `?${queryString}` : ''}`;
}

export function parseSearchParams(searchParams: URLSearchParams): SearchFilters {
  return {
    query: searchParams.get('q') || undefined,
    citySlug: searchParams.get('city') || undefined,
    categorySlug: searchParams.get('category') || undefined,
    verified: searchParams.get('verified') === '1',
    hasWebsite: searchParams.get('website') === '1',
    hasPhone: searchParams.get('phone') === '1',
    page: parseInt(searchParams.get('page') || '1', 10),
    sortBy: (searchParams.get('sort') as SearchFilters['sortBy']) || 'relevance',
  };
}
