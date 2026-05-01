import fs from 'fs';
import path from 'path';

export interface DocPage {
  slug: string[];
  title: string;
  file: string;
}

export interface VersionDocs {
  pages: DocPage[];
}

export interface DocsManifest {
  versions: string[];
  defaultVersion: string;
  byVersion: Record<string, VersionDocs>;
}

export interface SidebarSection {
  title: string;
  pages: DocPage[];
  collapsible?: boolean;
}

let _manifest: DocsManifest | null = null;

export function getManifest(): DocsManifest {
  if (_manifest) return _manifest;
  const filePath = path.join(process.cwd(), 'src/generated/docs-manifest.json');
  _manifest = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as DocsManifest;
  return _manifest;
}

export function getDocPage(
  version: string,
  slug: string[],
): { content: string; page: DocPage } | null {
  const manifest = getManifest();
  const versionDocs = manifest.byVersion[version];
  if (!versionDocs || !versionDocs.pages?.length) return null;

  const slugKey = slug.join('/');
  const page = versionDocs.pages.find((p) => p.slug.join('/') === slugKey);
  if (!page) return null;

  const filePath = path.join(process.cwd(), page.file);
  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, 'utf-8');
  return { content, page };
}

const TOP_LEVEL_SLUGS = new Set([
  'index',
  'quickstart',
  'architecture',
  'api',
  'ecosystem',
  'changelog',
  'contributing',
]);

const SECTION_MAP: Record<string, string> = {
  user_guide: 'User Guide',
  operations_guide: 'Operations Guide',
  proposals: 'Proposals',
};

export function getSidebarSections(version: string): SidebarSection[] {
  const manifest = getManifest();
  const versionDocs = manifest.byVersion[version];
  if (!versionDocs || !versionDocs.pages?.length) return [];

  const topLevel: DocPage[] = [];
  const sections: Record<string, DocPage[]> = {};

  for (const page of versionDocs.pages) {
    const first = page.slug[0];
    if (TOP_LEVEL_SLUGS.has(first)) {
      topLevel.push(page);
    } else if (SECTION_MAP[first]) {
      if (!sections[first]) sections[first] = [];
      sections[first].push(page);
    } else {
      topLevel.push(page);
    }
  }

  // Sort top-level by a preferred order
  const topOrder = [
    'index',
    'quickstart',
    'architecture',
    'api',
    'ecosystem',
    'changelog',
    'contributing',
  ];
  topLevel.sort((a, b) => {
    const ai = topOrder.indexOf(a.slug[0]);
    const bi = topOrder.indexOf(b.slug[0]);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const result: SidebarSection[] = [];

  if (topLevel.length > 0) {
    result.push({ title: 'Overview', pages: topLevel });
  }

  const sectionOrder = ['user_guide', 'operations_guide', 'proposals'];
  for (const key of sectionOrder) {
    if (sections[key]?.length) {
      result.push({
        title: SECTION_MAP[key],
        pages: sections[key],
        collapsible: key === 'proposals',
      });
    }
  }

  return result;
}

export function getAdjacentPages(
  version: string,
  slug: string[],
): { prev: DocPage | null; next: DocPage | null } {
  const manifest = getManifest();
  const versionDocs = manifest.byVersion[version];
  if (!versionDocs || !versionDocs.pages?.length) {
    return { prev: null, next: null };
  }

  const slugKey = slug.join('/');
  const pages = versionDocs.pages;
  const idx = pages.findIndex((p) => p.slug.join('/') === slugKey);
  if (idx === -1) return { prev: null, next: null };

  return {
    prev: idx > 0 ? pages[idx - 1] : null,
    next: idx < pages.length - 1 ? pages[idx + 1] : null,
  };
}
