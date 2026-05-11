import fs from 'fs';
import path from 'path';

export interface DocPage {
  slug: string[];
  title: string;
  file: string;
  description?: string;
  subtitle?: string;
  section?: string;
  subsection?: string;
  order?: number;
}

export interface SectionMeta {
  label: string;
  order: number;
}

export interface VersionDocs {
  pages: DocPage[];
  sections: Record<string, SectionMeta>;
  subsections: Record<string, SectionMeta>;
}

export interface DocsManifest {
  versions: string[];
  defaultVersion: string;
  byVersion: Record<string, VersionDocs>;
}

export interface SidebarSubsection {
  title: string;
  indexPage?: DocPage;
  pages: DocPage[];
}

export interface SidebarSection {
  title: string;
  indexPage?: DocPage;
  pages: DocPage[];
  subsections?: SidebarSubsection[];
}

let _manifest: DocsManifest | null = null;

export function getManifest(): DocsManifest {
  if (_manifest) return _manifest;
  const filePath = path.join(
    /*turbopackIgnore: true*/ process.cwd(),
    'src/generated/docs-manifest.json',
  );
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

  const candidates = getSlugCandidates(slug);
  const page = versionDocs.pages.find((p) => candidates.includes(p.slug.join('/')));
  if (!page) return null;

  const filePath = path.join(/*turbopackIgnore: true*/ process.cwd(), page.file);
  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, 'utf-8');
  return { content, page };
}

function getSlugCandidates(slug: string[]): string[] {
  const normalized = [...slug];
  const lastIndex = normalized.length - 1;
  normalized[lastIndex] = normalized[lastIndex].replace(/\.md$/, '');
  const exact = normalized.join('/');
  const candidates = [exact];

  if (normalized.at(-1) !== 'index') {
    candidates.push([...normalized, 'index'].join('/'));
  }

  return candidates;
}

/** Resolve section from frontmatter, falling back to slug-based heuristic for older docs. */
function resolveSection(page: DocPage): string {
  if (page.section) return page.section;
  const first = page.slug[0];
  if (first === 'user_guide') return 'user_guide';
  if (first === 'operations_guide') return 'operations_guide';
  if (first === 'proposals') return 'proposals';
  return 'overview';
}

export function getSidebarSections(version: string): SidebarSection[] {
  const manifest = getManifest();
  const versionDocs = manifest.byVersion[version];
  if (!versionDocs || !versionDocs.pages?.length) return [];

  const sectionRegistry = versionDocs.sections ?? {};
  const subsectionRegistry = versionDocs.subsections ?? {};

  // Group pages by section, then by subsection
  const bySection: Record<string, DocPage[]> = {};
  for (const page of versionDocs.pages) {
    const section = resolveSection(page);
    if (!bySection[section]) bySection[section] = [];
    bySection[section].push(page);
  }

  // Sort pages within each section by order, then alphabetically by title
  const sortPages = (pages: DocPage[]) =>
    [...pages].sort((a, b) => {
      const ao = a.order ?? 999;
      const bo = b.order ?? 999;
      if (ao !== bo) return ao - bo;
      return a.title.localeCompare(b.title);
    });

  // Determine section order: use registry order, fall back to alphabetical for unknowns
  const sectionKeys = Object.keys(bySection).sort((a, b) => {
    const ao = sectionRegistry[a]?.order ?? 999;
    const bo = sectionRegistry[b]?.order ?? 999;
    return ao - bo;
  });

  const result: SidebarSection[] = [];

  for (const sectionKey of sectionKeys) {
    const pages = bySection[sectionKey];
    if (!pages?.length) continue;

    const label = sectionRegistry[sectionKey]?.label ?? sectionKey;

    // Separate flat pages from subsection pages, and pull out the index page
    const allFlat: DocPage[] = [];
    const bySubsection: Record<string, DocPage[]> = {};

    for (const page of pages) {
      if (page.subsection) {
        if (!bySubsection[page.subsection]) bySubsection[page.subsection] = [];
        bySubsection[page.subsection].push(page);
      } else {
        allFlat.push(page);
      }
    }

    const sorted = sortPages(allFlat);
    const indexPage = sorted.find((p) => p.slug[p.slug.length - 1] === 'index');
    const flatPages = sorted.filter((p) => p.slug[p.slug.length - 1] !== 'index');

    // Sort subsections by their registry order
    const subsectionKeys = Object.keys(bySubsection).sort((a, b) => {
      const ao = subsectionRegistry[a]?.order ?? 999;
      const bo = subsectionRegistry[b]?.order ?? 999;
      return ao - bo;
    });

    const subsections: SidebarSubsection[] = subsectionKeys.map((key) => {
      const subSorted = sortPages(bySubsection[key]);
      const subIndex = subSorted.find((p) => p.slug[p.slug.length - 1] === 'index');
      const subPages = subSorted.filter((p) => p.slug[p.slug.length - 1] !== 'index');
      return {
        title: subsectionRegistry[key]?.label ?? key,
        indexPage: subIndex,
        pages: subPages,
      };
    });

    result.push({
      title: label,
      indexPage,
      pages: flatPages,
      subsections: subsections.length > 0 ? subsections : undefined,
    });
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
