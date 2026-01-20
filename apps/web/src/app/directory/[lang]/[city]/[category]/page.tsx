import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Language, isValidLanguage, t, getLocalizedName, createDirectoryUrl } from '@/lib/i18n';
import {
  getCityBySlug,
  getCategoryBySlug,
  getBusinessesByCityAndCategory,
  getCities,
  getCategories,
} from '@/lib/directory/queries';
import { DirectoryHeader } from '@/components/directory/DirectoryHeader';
import { BusinessCard } from '@/components/directory/BusinessCard';
import { ArrowLeft } from 'lucide-react';

interface PageProps {
  params: Promise<{ lang: string; city: string; category: string }>;
}

export default async function BusinessesPage({ params }: PageProps) {
  const { lang, city: citySlug, category: categorySlug } = await params;
  
  if (!isValidLanguage(lang)) {
    notFound();
  }

  const [city, category] = await Promise.all([
    getCityBySlug(citySlug),
    getCategoryBySlug(categorySlug),
  ]);
  
  if (!city || !category) {
    notFound();
  }

  const businesses = await getBusinessesByCityAndCategory(citySlug, categorySlug);
  const cityName = getLocalizedName(city, lang as Language);
  const categoryName = getLocalizedName(category, lang as Language);

  return (
    <div>
      <DirectoryHeader
        lang={lang as Language}
        title={categoryName}
        subtitle={`${t('directory.businesses', lang as Language)} in ${cityName}`}
        breadcrumbs={[
          { label: cityName, href: createDirectoryUrl(lang as Language, citySlug) },
          { label: categoryName },
        ]}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {businesses.length} {t('directory.businesses', lang as Language)}
          </h2>
          <Link
            href={createDirectoryUrl(lang as Language, citySlug)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('directory.backToCategories', lang as Language)}
          </Link>
        </div>
        
        {businesses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">{t('directory.noBusinesses', lang as Language)}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {businesses.map((business) => (
              <BusinessCard key={business.id} business={business} lang={lang as Language} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export async function generateStaticParams() {
  const [cities, categories] = await Promise.all([getCities(), getCategories()]);
  const langs = ['en', 'es', 'sr', 'fr'];
  
  return langs.flatMap((lang) =>
    cities.flatMap((city) =>
      categories.map((category) => ({
        lang,
        city: city.slug,
        category: category.slug,
      }))
    )
  );
}
