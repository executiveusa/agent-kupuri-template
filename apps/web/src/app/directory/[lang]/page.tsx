import { notFound } from 'next/navigation';
import { Language, isValidLanguage, t } from '@/lib/i18n';
import { getCitiesWithBusinessCount } from '@/lib/directory/queries';
import { DirectoryHeader } from '@/components/directory/DirectoryHeader';
import { CityCard } from '@/components/directory/CityCard';

interface PageProps {
  params: Promise<{ lang: string }>;
}

export default async function CitiesPage({ params }: PageProps) {
  const { lang } = await params;
  
  if (!isValidLanguage(lang)) {
    notFound();
  }

  const cities = await getCitiesWithBusinessCount();

  return (
    <div>
      <DirectoryHeader
        lang={lang as Language}
        title={t('directory.title', lang as Language)}
        subtitle={t('directory.subtitle', lang as Language)}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {t('directory.selectCity', lang as Language)}
        </h2>
        
        {cities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">{t('directory.noCities', lang as Language)}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cities.map((city) => (
              <CityCard key={city.id} city={city} lang={lang as Language} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export async function generateStaticParams() {
  return [
    { lang: 'en' },
    { lang: 'es' },
    { lang: 'sr' },
    { lang: 'fr' },
  ];
}
