'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Language, SUPPORTED_LANGUAGES, LANGUAGE_NAMES, t } from '@/lib/i18n';

interface LanguageSelectorProps {
  currentLang: Language;
}

export function LanguageSelector({ currentLang }: LanguageSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = (newLang: Language) => {
    // Replace the language segment in the URL
    const segments = pathname.split('/');
    const langIndex = segments.findIndex((seg) => SUPPORTED_LANGUAGES.includes(seg as Language));
    
    if (langIndex !== -1) {
      segments[langIndex] = newLang;
      router.push(segments.join('/'));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">{t('language.select', currentLang)}:</span>
      <div className="flex gap-1">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <button
            key={lang}
            onClick={() => handleLanguageChange(lang)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              lang === currentLang
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
            title={LANGUAGE_NAMES[lang].english}
          >
            {LANGUAGE_NAMES[lang].native}
          </button>
        ))}
      </div>
    </div>
  );
}
