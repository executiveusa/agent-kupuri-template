import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Language, isValidLanguage, t, createDirectoryUrl } from '@/lib/i18n';
import { searchBusinesses, parseSearchParams, buildSearchUrl } from '@/lib/directory/search';
import { getCities, getCategories } from '@/lib/directory/queries';
import { DirectoryHeader } from '@/components/directory/DirectoryHeader';
import { BusinessCard } from '@/components/directory/BusinessCard';
import { SearchForm } from '@/components/directory/SearchForm';
import { ChatWidget } from '@/components/directory/ChatWidget';
import { ArrowLeft, ArrowRight, Search } from 'lucide-react';

interface PageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SearchPage({ params, searchParams }: PageProps) {
  const { lang } = await params;
  const rawSearchParams = await searchParams;
  
  if (!isValidLanguage(lang)) {
    notFound();
  }

  // Convert searchParams to URLSearchParams
  const urlParams = new URLSearchParams();
  Object.entries(rawSearchParams).forEach(([key, value]) => {
    if (typeof value === 'string') {
      urlParams.set(key, value);
    }
  });

  const filters = parseSearchParams(urlParams);
  const results = await searchBusinesses(filters);
  const [cities, categories] = await Promise.all([getCities(), getCategories()]);

  const translations: Record<Language, Record<string, string>> = {
    en: {
      title: 'Search Results',
      subtitle: filters.query ? `Results for "${filters.query}"` : 'Browse all businesses',
      noResults: 'No businesses found matching your criteria.',
      tryAgain: 'Try adjusting your filters or search terms.',
      resultsCount: `${results.total} result${results.total !== 1 ? 's' : ''} found`,
      page: 'Page',
      of: 'of',
      previous: 'Previous',
      next: 'Next',
    },
    es: {
      title: 'Resultados de Búsqueda',
      subtitle: filters.query ? `Resultados para "${filters.query}"` : 'Explorar todos los negocios',
      noResults: 'No se encontraron negocios que coincidan con sus criterios.',
      tryAgain: 'Intente ajustar sus filtros o términos de búsqueda.',
      resultsCount: `${results.total} resultado${results.total !== 1 ? 's' : ''} encontrado${results.total !== 1 ? 's' : ''}`,
      page: 'Página',
      of: 'de',
      previous: 'Anterior',
      next: 'Siguiente',
    },
    sr: {
      title: 'Резултати претраге',
      subtitle: filters.query ? `Резултати за "${filters.query}"` : 'Прегледајте све фирме',
      noResults: 'Нису пронађене фирме које одговарају вашим критеријумима.',
      tryAgain: 'Покушајте да прилагодите филтере или термине претраге.',
      resultsCount: `${results.total} резултат${results.total !== 1 ? 'а' : ''} пронађен${results.total !== 1 ? 'о' : ''}`,
      page: 'Страница',
      of: 'од',
      previous: 'Претходна',
      next: 'Следећа',
    },
    fr: {
      title: 'Résultats de Recherche',
      subtitle: filters.query ? `Résultats pour "${filters.query}"` : 'Parcourir toutes les entreprises',
      noResults: 'Aucune entreprise trouvée correspondant à vos critères.',
      tryAgain: 'Essayez d\'ajuster vos filtres ou termes de recherche.',
      resultsCount: `${results.total} résultat${results.total !== 1 ? 's' : ''} trouvé${results.total !== 1 ? 's' : ''}`,
      page: 'Page',
      of: 'sur',
      previous: 'Précédent',
      next: 'Suivant',
    },
  };

  const txt = translations[lang as Language];

  return (
    <div>
      <DirectoryHeader
        lang={lang as Language}
        title={txt.title}
        subtitle={txt.subtitle}
        breadcrumbs={[{ label: txt.title }]}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Form */}
        <div className="mb-8">
          <SearchForm
            lang={lang as Language}
            initialQuery={filters.query}
            initialCity={filters.citySlug}
            initialCategory={filters.categorySlug}
            cities={cities}
            categories={categories}
          />
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">{txt.resultsCount}</p>
          {results.totalPages > 1 && (
            <p className="text-sm text-gray-500">
              {txt.page} {results.page} {txt.of} {results.totalPages}
            </p>
          )}
        </div>

        {/* Results */}
        {results.businesses.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{txt.noResults}</h3>
            <p className="text-gray-500 mb-6">{txt.tryAgain}</p>
            <Link
              href={createDirectoryUrl(lang as Language)}
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('directory.backToCities', lang as Language)}
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {results.businesses.map((business) => (
                <BusinessCard
                  key={business.id}
                  business={business}
                  lang={lang as Language}
                />
              ))}
            </div>

            {/* Pagination */}
            {results.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4">
                {results.page > 1 && (
                  <Link
                    href={buildSearchUrl(lang, { ...filters, page: results.page - 1 })}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {txt.previous}
                  </Link>
                )}
                
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, results.totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (results.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (results.page <= 3) {
                      pageNum = i + 1;
                    } else if (results.page >= results.totalPages - 2) {
                      pageNum = results.totalPages - 4 + i;
                    } else {
                      pageNum = results.page - 2 + i;
                    }
                    
                    return (
                      <Link
                        key={pageNum}
                        href={buildSearchUrl(lang, { ...filters, page: pageNum })}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                          pageNum === results.page
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </Link>
                    );
                  })}
                </div>

                {results.page < results.totalPages && (
                  <Link
                    href={buildSearchUrl(lang, { ...filters, page: results.page + 1 })}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {txt.next}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Chat Widget */}
      <ChatWidget
        lang={lang as Language}
        city={filters.citySlug}
        category={filters.categorySlug}
      />
    </div>
  );
}
