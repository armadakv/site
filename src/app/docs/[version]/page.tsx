import type { Metadata } from 'next';
import { getManifest, getDocPage } from '@/lib/docs';
import DocsVersionPage from '../[version]/[...slug]/page';

export async function generateStaticParams() {
  const manifest = getManifest();
  return manifest.versions.map((version) => ({ version }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ version: string }>;
}): Promise<Metadata> {
  const { version } = await params;
  const doc = getDocPage(version, ['index']);
  if (!doc) return { title: 'Not Found' };
  return {
    title: doc.page.title,
    description: `${doc.page.title} — Armada KV documentation (${version})`,
  };
}

export default async function DocsVersionRootPage({
  params,
}: {
  params: Promise<{ version: string }>;
}) {
  const { version } = await params;
  return DocsVersionPage({ params: Promise.resolve({ version, slug: ['index'] }) });
}
