import { redirect } from 'next/navigation';
import { getDefaultLanguage } from '@/lib/i18n';

export default function DirectoryIndexPage() {
  redirect(`/directory/${getDefaultLanguage()}`);
}
