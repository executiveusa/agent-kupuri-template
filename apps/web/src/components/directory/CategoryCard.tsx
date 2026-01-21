import Link from 'next/link';
import { Language, getLocalizedName, getLocalizedDescription, createDirectoryUrl } from '@/lib/i18n';
import type { Category } from '@/lib/directory/types';
import {
  Utensils,
  Home,
  Scale,
  HeartPulse,
  Car,
  Wrench,
  Sparkles,
  Landmark,
  GraduationCap,
  Laptop,
  Folder,
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  utensils: Utensils,
  home: Home,
  scale: Scale,
  'heart-pulse': HeartPulse,
  car: Car,
  wrench: Wrench,
  sparkles: Sparkles,
  landmark: Landmark,
  'graduation-cap': GraduationCap,
  laptop: Laptop,
};

interface CategoryCardProps {
  category: Category & { business_count?: number };
  citySlug: string;
  lang: Language;
}

export function CategoryCard({ category, citySlug, lang }: CategoryCardProps) {
  const name = getLocalizedName(category, lang);
  const description = getLocalizedDescription(category, lang);
  const IconComponent = category.icon ? iconMap[category.icon] || Folder : Folder;
  
  return (
    <Link
      href={createDirectoryUrl(lang, citySlug, category.slug)}
      className="group block bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
          <IconComponent className="w-6 h-6 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {name}
          </h3>
          {description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{description}</p>
          )}
          {typeof category.business_count === 'number' && (
            <p className="text-sm text-gray-600 mt-2">
              {category.business_count} {category.business_count === 1 ? 'business' : 'businesses'}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
