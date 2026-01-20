import { Language, getLocalizedDescription, LANGUAGE_NAMES, t } from '@/lib/i18n';
import type { Business } from '@/lib/directory/types';
import { MapPin, Phone, Mail, Globe, CheckCircle, Languages } from 'lucide-react';

interface BusinessCardProps {
  business: Business;
  lang: Language;
}

export function BusinessCard({ business, lang }: BusinessCardProps) {
  const description = getLocalizedDescription(business, lang);
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {business.logo_url ? (
          <img
            src={business.logo_url}
            alt={business.name}
            className="w-16 h-16 rounded-lg object-cover"
          />
        ) : (
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-400">
              {business.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">{business.name}</h3>
            {business.is_verified && (
              <span title={t('directory.verified', lang)}>
                <CheckCircle className="w-5 h-5 text-blue-500" />
              </span>
            )}
          </div>
          {description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{description}</p>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {business.address && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>{business.address}</span>
          </div>
        )}
        {business.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <a href={`tel:${business.phone}`} className="hover:text-blue-600">
              {business.phone}
            </a>
          </div>
        )}
        {business.email && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <a href={`mailto:${business.email}`} className="hover:text-blue-600">
              {business.email}
            </a>
          </div>
        )}
        {business.website && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <a
              href={business.website}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 truncate"
            >
              {business.website.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}
      </div>

      {business.supported_languages && business.supported_languages.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">{t('directory.languages', lang)}:</span>
            <div className="flex gap-1">
              {business.supported_languages.map((langCode) => (
                <span
                  key={langCode}
                  className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                  title={LANGUAGE_NAMES[langCode as keyof typeof LANGUAGE_NAMES]?.english || langCode}
                >
                  {langCode.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
