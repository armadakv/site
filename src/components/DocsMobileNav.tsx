'use client';

import { useState } from 'react';
import DocsSidebar from './DocsSidebar';
import { SidebarSection } from '@/lib/docs';

interface DocsMobileNavProps {
  sections: SidebarSection[];
  currentSlug: string[];
  currentVersion: string;
  versions: string[];
}

export default function DocsMobileNav({
  sections,
  currentSlug,
  currentVersion,
  versions,
}: DocsMobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile trigger bar */}
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-2 lg:hidden dark:border-slate-800 dark:bg-slate-950">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          aria-label="Open navigation"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
            />
          </svg>
          Navigation
        </button>
        <span className="text-slate-300 dark:text-slate-600">/</span>
        <span className="truncate text-sm text-slate-500 dark:text-slate-400">
          v{currentVersion}
        </span>
      </div>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 z-50 flex h-full w-72 flex-col bg-white shadow-xl transition-transform duration-200 lg:hidden dark:bg-slate-950 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Documentation
          </span>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label="Close navigation"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <DocsSidebar
            sections={sections}
            currentSlug={currentSlug}
            currentVersion={currentVersion}
            versions={versions}
          />
        </div>
      </div>
    </>
  );
}
