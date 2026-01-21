import Link from 'next/link';
import { Language, getLocalizedName, createDirectoryUrl } from '@/lib/i18n';
import type { City } from '@/lib/directory/types';
import { MapPin } from 'lucide-react';

interface CityCardProps {
  city: City & { business_count?: number };
  lang: Language;
}

export function CityCard({ city, lang }: CityCardProps) {
  const name = getLocalizedName(city, lang);
  
  return (
    <Link
      href={createDirectoryUrl(lang, city.slug)}
      className="group block bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
          <MapPin className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {name}
          </h3>
          {city.region && (
            <p className="text-sm text-gray-500 mt-0.5">{city.region}, {city.country_code}</p>
          )}
          {typeof city.business_count === 'number' && (
            <p className="text-sm text-gray-600 mt-2">
              {city.business_count} {city.business_count === 1 ? 'business' : 'businesses'}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
