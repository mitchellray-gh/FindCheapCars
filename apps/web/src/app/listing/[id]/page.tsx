import { Metadata } from 'next';
import Link from 'next/link';
import ListingDetailClient from './ListingDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Listing #${id} - AutoFind`,
    description: `View details for listing #${id} on AutoFind.`,
  };
}

export default async function ListingPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back to Dashboard
      </Link>
      <ListingDetailClient id={Number(id)} />
    </div>
  );
}
