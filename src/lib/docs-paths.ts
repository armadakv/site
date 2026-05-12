/** Returns the canonical slug by removing a trailing `index` segment. */
export function canonicalDocSlug(slug: string[]): string[] {
  if (!slug.length) return [];
  if (slug[slug.length - 1] === 'index') return slug.slice(0, -1);
  return slug;
}

/** Returns a stable key for canonical slug comparisons and lookups. */
export function getDocSlugKey(slug: string[]): string {
  return canonicalDocSlug(slug).join('/');
}

/** Builds the docs URL path for a version + slug pair. */
export function getDocHref(version: string, slug: string[]): string {
  const base = `/docs/${version}`;
  return slug.length > 0 ? `${base}/${slug.join('/')}` : base;
}
