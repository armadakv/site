import { notFound, redirect } from 'next/navigation';
import { getManifest, getDocHref } from '@/lib/docs';

interface PageProps {
  params: Promise<{ version: string }>;
}

export default async function DocsVersionPage({ params }: PageProps) {
  const { version } = await params;
  const manifest = getManifest();

  if (!manifest.versions.includes(version)) {
    notFound();
  }

  const versionPages = manifest.byVersion[version]?.pages ?? [];
  // Prefer the root index page; fall back to the first page in the manifest
  const indexPage = versionPages.find((page) => page.slug.length === 1 && page.slug[0] === 'index');
  const targetSlug = indexPage?.slug ?? versionPages[0]?.slug ?? ['index'];

  redirect(getDocHref(version, targetSlug));
}
