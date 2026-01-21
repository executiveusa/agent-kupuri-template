'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Language, t, getLocalizedName } from '@/lib/i18n';
import { buildSearchUrl } from '@/lib/directory/search';
import type { City, Category } from '@/lib/directory/types';
import { Search, MapPin, Grid3X3, Filter, X } from 'lucide-react';

interface SearchFormProps {
  lang: Language;
  initialQuery?: string;
  initialCity?: string;
  initialCategory?: string;
  cities: City[];
  categories: Category[];
  compact?: boolean;
}

export function SearchForm({
  lang,
  initialQuery = '',
  initialCity = '',
  initialCategory = '',
  cities,
  categories,
  compact = false,
}: SearchFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [citySlug, setCitySlug] = useState(initialCity);
  const [categorySlug, setCategorySlug] = useState(initialCategory);
  const [showFilters, setShowFilters] = useState(false);

  const translations: Record<Language, Record<string, string>> = {
    en: {
      searchPlaceholder: 'Search businesses, services...',
      allCities: 'All Cities',
      allCategories: 'All Categories',
      search: 'Search',
      filters: 'Filters',
      clearFilters: 'Clear',
    },
    es: {
      searchPlaceholder: 'Buscar negocios, servicios...',
      allCities: 'Todas las Ciudades',
      allCategories: 'Todas las Categorías',
      search: 'Buscar',
      filters: 'Filtros',
      clearFilters: 'Limpiar',
    },
    sr: {
      searchPlaceholder: 'Претражи фирме, услуге...',
      allCities: 'Сви градови',
      allCategories: 'Све категорије',
      search: 'Претрага',
      filters: 'Филтери',
      clearFilters: 'Обриши',
    },
    fr: {
      searchPlaceholder: 'Rechercher entreprises, services...',
      allCities: 'Toutes les Villes',
      allCategories: 'Toutes les Catégories',
      search: 'Rechercher',
      filters: 'Filtres',
      clearFilters: 'Effacer',
    },
  };

  const txt = translations[lang];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = buildSearchUrl(lang, {
      query: query.trim() || undefined,
      citySlug: citySlug || undefined,
      categorySlug: categorySlug || undefined,
    });
    router.push(url);
  };

  const clearFilters = () => {
    setQuery('');
    setCitySlug('');
    setCategorySlug('');
  };

  const hasFilters = query || citySlug || categorySlug;

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={txt.searchPlaceholder}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Search className="w-5 h-5" />
        </button>
      </form>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <form onSubmit={handleSubmit}>
        {/* Main Search Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={txt.searchPlaceholder}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            />
          </div>

          {/* City Select */}
          <div className="relative sm:w-48">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <select
              value={citySlug}
              onChange={(e) => setCitySlug(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white cursor-pointer"
            >
              <option value="">{txt.allCities}</option>
              {cities.map((city) => (
                <option key={city.id} value={city.slug}>
                  {getLocalizedName(city, lang)}
                </option>
              ))}
            </select>
          </div>

          {/* Category Select */}
          <div className="relative sm:w-48">
            <Grid3X3 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <select
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white cursor-pointer"
            >
              <option value="">{txt.allCategories}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {getLocalizedName(category, lang)}
                </option>
              ))}
            </select>
          </div>

          {/* Search Button */}
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Search className="w-5 h-5" />
            <span className="hidden sm:inline">{txt.search}</span>
          </button>
        </div>

        {/* Active Filters */}
        {hasFilters && (
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500">{txt.filters}:</span>
            
            {query && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                "{query}"
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="hover:text-blue-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </span>
            )}
            
            {citySlug && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                <MapPin className="w-3 h-3" />
                {getLocalizedName(cities.find((c) => c.slug === citySlug)!, lang)}
                <button
                  type="button"
                  onClick={() => setCitySlug('')}
                  className="hover:text-green-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </span>
            )}
            
            {categorySlug && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                <Grid3X3 className="w-3 h-3" />
                {getLocalizedName(categories.find((c) => c.slug === categorySlug)!, lang)}
                <button
                  type="button"
                  onClick={() => setCategorySlug('')}
                  className="hover:text-purple-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              {txt.clearFilters}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
