import Link from 'next/link';
import { Language, t, createDirectoryUrl } from '@/lib/i18n';
import { LanguageSelector } from './LanguageSelector';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface DirectoryHeaderProps {
  lang: Language;
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
}

export function DirectoryHeader({ lang, title, subtitle, breadcrumbs }: DirectoryHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <Link href={createDirectoryUrl(lang)} className="hover:text-blue-600">
                  {t('nav.directory', lang)}
                </Link>
                {breadcrumbs.map((item, index) => (
                  <span key={index} className="flex items-center gap-2">
                    <span>/</span>
                    {item.href ? (
                      <Link href={item.href} className="hover:text-blue-600">
                        {item.label}
                      </Link>
                    ) : (
                      <span className="text-gray-900">{item.label}</span>
                    )}
                  </span>
                ))}
              </nav>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="mt-1 text-gray-600">{subtitle}</p>}
          </div>
          <LanguageSelector currentLang={lang} />
        </div>
      </div>
    </header>
  );
}
