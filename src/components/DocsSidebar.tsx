'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SidebarSection, DocPage } from '@/lib/docs';

interface DocsSidebarProps {
  sections: SidebarSection[];
  currentSlug: string[];
  currentVersion: string;
  versions: string[];
}

export default function DocsSidebar({
  sections,
  currentSlug,
  currentVersion,
  versions,
}: DocsSidebarProps) {
  const router = useRouter();
  const currentSlugKey = currentSlug.join('/');

  function handleVersionChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newVersion = e.target.value;
    // Try to navigate to same slug in new version, else fallback to index
    router.push(`/docs/${newVersion}/${currentSlugKey}`);
  }

  return (
    <aside className="flex min-w-0 flex-col gap-4">
      {/* Version selector */}
      <div>
        <p className="mb-2 px-2 text-xs font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500">
          Version
        </p>
        <select
          id="version-select"
          value={currentVersion}
          onChange={handleVersionChange}
          className="w-full cursor-pointer rounded-md border-0 bg-slate-100 px-2 py-1.5 font-mono text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-slate-800 dark:text-slate-300"
        >
          {versions.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-200 dark:border-slate-800" />

      {/* Navigation */}
      <nav className="flex flex-col gap-4">
        {sections.map((section) => (
          <SidebarSectionComponent
            key={section.title}
            section={section}
            currentSlugKey={currentSlugKey}
            version={currentVersion}
          />
        ))}
      </nav>
    </aside>
  );
}

function SidebarSectionComponent({
  section,
  currentSlugKey,
  version,
}: {
  section: SidebarSection;
  currentSlugKey: string;
  version: string;
}) {
  const isProposals = section.collapsible;

  return (
    <div>
      <div className="mb-1 px-2">
        <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
          {section.title}
        </span>
      </div>
      <ul className="flex flex-col gap-0.5">
        {section.pages.map((page) => (
          <SidebarLink
            key={page.slug.join('/')}
            page={page}
            version={version}
            isActive={page.slug.join('/') === currentSlugKey}
          />
        ))}
      </ul>
    </div>
  );
}

function SidebarLink({
  page,
  version,
  isActive,
}: {
  page: DocPage;
  version: string;
  isActive: boolean;
}) {
  const href = `/docs/${version}/${page.slug.join('/')}`;
  const label = getPageLabel(page);

  return (
    <li>
      <Link
        href={href}
        className={`flex items-center rounded-md px-2 py-1.5 text-sm transition-colors ${
          isActive
            ? 'bg-blue-50 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
        }`}
      >
        {label}
      </Link>
    </li>
  );
}

function getPageLabel(page: DocPage): string {
  // For section index pages, use a shorter label
  if (page.slug.length === 1) return page.title;
  if (page.slug[page.slug.length - 1] === 'index') return page.title;

  // For deeper pages use last segment
  const last = page.slug[page.slug.length - 1];
  // If title looks auto-generated (contains path slashes), prettify it
  if (page.title.includes('/')) {
    return last
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return page.title;
}
