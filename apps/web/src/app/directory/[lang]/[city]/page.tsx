import { notFound } from 'next/navigation';
import { Language, isValidLanguage, t, getLocalizedName } from '@/lib/i18n';
import { getCityBySlug, getCategoriesWithBusinessCount, getCities } from '@/lib/directory/queries';
import { DirectoryHeader } from '@/components/directory/DirectoryHeader';
import { CategoryCard } from '@/components/directory/CategoryCard';

interface PageProps {
  params: Promise<{ lang: string; city: string }>;
}

export default async function CategoriesPage({ params }: PageProps) {
  const { lang, city: citySlug } = await params;
  
  if (!isValidLanguage(lang)) {
    notFound();
  }

  const city = await getCityBySlug(citySlug);
  
  if (!city) {
    notFound();
  }

  const categories = await getCategoriesWithBusinessCount(citySlug);
  const cityName = getLocalizedName(city, lang as Language);

  return (
    <div>
      <DirectoryHeader
        lang={lang as Language}
        title={cityName}
        subtitle={t('directory.selectCategory', lang as Language)}
        breadcrumbs={[
          { label: cityName },
        ]}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {t('directory.allCategories', lang as Language)}
        </h2>
        
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">{t('directory.noCategories', lang as Language)}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                citySlug={citySlug}
                lang={lang as Language}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export async function generateStaticParams() {
  const cities = await getCities();
  const langs = ['en', 'es', 'sr', 'fr'];
  
  return langs.flatMap((lang) =>
    cities.map((city) => ({
      lang,
      city: city.slug,
    }))
  );
}
