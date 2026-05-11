import { redirect } from 'next/navigation';
import { getManifest, getDocHref } from '@/lib/docs';

export default function DocsIndexPage() {
  const manifest = getManifest();

  // Pick the first version that actually has pages, falling back to defaultVersion
  const version =
    manifest.versions.find((v) => (manifest.byVersion[v]?.pages?.length ?? 0) > 0) ??
    manifest.defaultVersion;

  const versionPages = manifest.byVersion[version]?.pages;
  const firstSlug = versionPages?.length ? versionPages[0].slug : ['index'];
  redirect(getDocHref(version, firstSlug));
}
