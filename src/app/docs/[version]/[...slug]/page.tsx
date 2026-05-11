import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  getManifest,
  getDocPage,
  getSidebarSections,
  getAdjacentPages,
  getDocHref,
  getDocSlugKey,
  canonicalDocSlug,
} from '@/lib/docs';
import DocsSidebar from '@/components/DocsSidebar';
import DocsContent from '@/components/DocsContent';

interface PageProps {
  params: Promise<{ version: string; slug: string[] }>;
}

export async function generateStaticParams() {
  const manifest = getManifest();
  const seen = new Set<string>();
  const result: { version: string; slug: string[] }[] = [];
  const addStaticParam = (version: string, slug: string[]) => {
    const key = `${version}:${slug.join('/')}`;
    if (seen.has(key)) return;
    seen.add(key);
    result.push({ version, slug });
  };

  for (const version of manifest.versions) {
    const pages = manifest.byVersion[version]?.pages ?? [];
    for (const page of pages) {
      addStaticParam(version, page.slug);

      const aliasSlug = canonicalDocSlug(page.slug);
      const staticParamSlug = aliasSlug.length === 0 ? ['index'] : aliasSlug;
      addStaticParam(version, staticParamSlug);
    }
    // Always include a fallback index entry per version even if no pages
    if (!pages.length) {
      addStaticParam(version, ['index']);
    }
  }

  return result;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { version, slug } = await params;
  const doc = getDocPage(version, slug);
  if (!doc) return { title: 'Not Found' };
  return {
    title: doc.page.title,
    description: `${doc.page.title} — Armada KV documentation (${version})`,
  };
}

function getGitHubEditUrl(version: string, file: string): string {
  const base = 'https://github.com/armadakv/armada';
  // file is like "src/generated/docs/main/quickstart.md"
  // We want the path relative to the repo root in the armada repo
  // Strip "src/generated/docs/<version>/" to get the docs path
  const prefix = `src/generated/docs/${version}/`;
  const docsPath = file.startsWith(prefix) ? file.slice(prefix.length) : file;
  // For the default branch use master; for semver tags use the tag name
  const refPart = version === 'main' ? 'master' : version;
  return `${base}/blob/${refPart}/docs/${docsPath}`;
}

export default async function DocsPage({ params }: PageProps) {
  const { version, slug } = await params;
  const manifest = getManifest();

  // Check version is valid
  if (!manifest.versions.includes(version)) {
    notFound();
  }

  const doc = getDocPage(version, slug);
  if (!doc) {
    // If version has no pages, show a friendly message
    const hasPages = (manifest.byVersion[version]?.pages?.length ?? 0) > 0;
    if (!hasPages) {
      return <EmptyVersion version={version} manifest={manifest} />;
    }
    notFound();
  }

  const canonicalSlugKey = getDocSlugKey(doc.page.slug);
  const requestedSlugKey = slug.join('/');
  if (requestedSlugKey !== canonicalSlugKey) {
    redirect(getDocHref(version, doc.page.slug));
  }

  const resolvedSlug = doc.page.slug;
  const sections = getSidebarSections(version);
  const { prev, next } = getAdjacentPages(version, resolvedSlug);
  const editUrl = getGitHubEditUrl(version, doc.page.file);

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-screen-xl flex-1">
        {/* Sidebar - hidden on mobile */}
        <div className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 border-r border-slate-200 lg:block dark:border-slate-800">
          <DocsSidebar
            sections={sections}
            currentSlug={resolvedSlug}
            currentVersion={version}
            versions={manifest.versions}
          />
        </div>

        {/* Main content */}
        <main className="min-w-0 flex-1 px-6 py-8 lg:px-10">
          {/* Breadcrumb */}
          <nav
            className="mb-6 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400"
            aria-label="Breadcrumb"
          >
            <Link
              href="/docs"
              className="transition-colors hover:text-slate-700 dark:hover:text-slate-200"
            >
              Docs
            </Link>
            <span>/</span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {version}
            </span>
            <span>/</span>
            <span className="max-w-xs truncate font-medium text-slate-700 dark:text-slate-200">
              {doc.page.title}
            </span>
          </nav>

          {/* Edit on GitHub */}
          <div className="mb-6 flex justify-end">
            <a
              href={editUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <svg
                viewBox="0 0 16 16"
                width="13"
                height="13"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              Edit on GitHub
            </a>
          </div>

          {/* Content */}
          <div className="max-w-3xl">
            <DocsContent content={doc.content} />
          </div>

          {/* Prev/Next navigation */}
          {(prev || next) && (
            <div className="mt-12 grid max-w-3xl grid-cols-2 gap-4 border-t border-slate-200 pt-8 dark:border-slate-800">
              {prev ? (
                <Link
                  href={getDocHref(version, prev.slug)}
                  className="group flex flex-col gap-1 rounded-lg border border-slate-200 p-4 transition-colors hover:border-blue-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-blue-500 dark:hover:bg-slate-800/50"
                >
                  <span className="text-xs text-slate-500 dark:text-slate-400">← Previous</span>
                  <span className="text-sm font-medium text-slate-700 transition-colors group-hover:text-blue-600 dark:text-slate-200 dark:group-hover:text-blue-400">
                    {prev.title}
                  </span>
                </Link>
              ) : (
                <div />
              )}
              {next ? (
                <Link
                  href={getDocHref(version, next.slug)}
                  className="group flex flex-col gap-1 rounded-lg border border-slate-200 p-4 text-right transition-colors hover:border-blue-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-blue-500 dark:hover:bg-slate-800/50"
                >
                  <span className="text-xs text-slate-500 dark:text-slate-400">Next →</span>
                  <span className="text-sm font-medium text-slate-700 transition-colors group-hover:text-blue-600 dark:text-slate-200 dark:group-hover:text-blue-400">
                    {next.title}
                  </span>
                </Link>
              ) : (
                <div />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function EmptyVersion({
  version,
  manifest,
}: {
  version: string;
  manifest: ReturnType<typeof getManifest>;
}) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="max-w-md text-center">
        <h1 className="mb-3 text-2xl font-bold text-slate-800 dark:text-slate-100">
          No documentation for {version}
        </h1>
        <p className="mb-8 text-slate-500 dark:text-slate-400">
          This version predates the documentation system. Try a newer version.
        </p>
        <Link
          href={getDocHref(manifest.defaultVersion, ['index'])}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
        >
          Go to latest docs
        </Link>
      </div>
    </div>
  );
}
