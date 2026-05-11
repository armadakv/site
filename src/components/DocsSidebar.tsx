'use client';

import { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SidebarSection, SidebarSubsection, DocPage, getDocHref, getDocSlugKey } from '@/lib/docs';

const SCROLL_KEY = 'docs-sidebar-scroll';

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
  const currentSlugKey = getDocSlugKey(currentSlug);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Restore saved scroll position on mount
  useEffect(() => {
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved && scrollRef.current) {
      scrollRef.current.scrollTop = Number(saved);
    }
  }, []);

  // Save scroll position before each navigation
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const save = () => sessionStorage.setItem(SCROLL_KEY, String(el.scrollTop));
    el.addEventListener('click', save, { capture: true });
    return () => el.removeEventListener('click', save, { capture: true });
  }, []);

  function handleVersionChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newVersion = e.target.value;
    router.push(currentSlugKey ? `/docs/${newVersion}/${currentSlugKey}` : `/docs/${newVersion}`);
  }

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto px-4 py-8">
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
    </div>
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
  const indexIsActive = section.indexPage
    ? getDocSlugKey(section.indexPage.slug) === currentSlugKey
    : false;

  return (
    <div>
      {/* Section header — links to index page if one exists */}
      <div className="mb-0.5">
        {section.indexPage ? (
          <Link
            href={getDocHref(version, section.indexPage.slug)}
            className={`block rounded-md px-2 py-1.5 text-xs font-semibold tracking-wider uppercase transition-colors ${
              indexIsActive
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {section.title}
          </Link>
        ) : (
          <span className="block px-2 py-1.5 text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
            {section.title}
          </span>
        )}
      </div>

      {/* Sub-pages, indented */}
      {section.pages.length > 0 && (
        <ul className="flex flex-col gap-0.5 pl-2">
          {section.pages.map((page) => (
            <SidebarLink
              key={page.slug.join('/')}
              page={page}
              version={version}
              isActive={getDocSlugKey(page.slug) === currentSlugKey}
            />
          ))}
        </ul>
      )}

      {/* Subsections */}
      {section.subsections?.map((sub) => (
        <SidebarSubsectionComponent
          key={sub.title}
          subsection={sub}
          currentSlugKey={currentSlugKey}
          version={version}
        />
      ))}
    </div>
  );
}

function SidebarSubsectionComponent({
  subsection,
  currentSlugKey,
  version,
}: {
  subsection: SidebarSubsection;
  currentSlugKey: string;
  version: string;
}) {
  const indexIsActive = subsection.indexPage
    ? getDocSlugKey(subsection.indexPage.slug) === currentSlugKey
    : false;

  return (
    <div className="mt-1 pl-2">
      {/* Subsection header — same style as regular page links */}
      <div className="mb-0.5">
        {subsection.indexPage ? (
          <Link
            href={getDocHref(version, subsection.indexPage.slug)}
            className={`flex items-center rounded-md px-2 py-1.5 text-sm transition-colors ${
              indexIsActive
                ? 'bg-blue-50 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
            }`}
          >
            {subsection.title}
          </Link>
        ) : (
          <span className="block px-2 py-1.5 text-sm text-slate-600 dark:text-slate-400">
            {subsection.title}
          </span>
        )}
      </div>

      {/* Subsection pages, indented */}
      <ul className="flex flex-col gap-0.5 pl-2">
        {subsection.pages.map((page) => (
          <SidebarLink
            key={page.slug.join('/')}
            page={page}
            version={version}
            isActive={getDocSlugKey(page.slug) === currentSlugKey}
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
  const href = getDocHref(version, page.slug);

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
        {page.title}
      </Link>
    </li>
  );
}
