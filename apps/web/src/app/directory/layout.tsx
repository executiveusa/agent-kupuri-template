import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Business Directory',
  description: 'Find local businesses in your city',
};

export default function DirectoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
