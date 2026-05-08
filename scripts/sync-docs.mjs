#!/usr/bin/env node
/**
 * sync-docs.mjs
 *
 * Syncs versioned docs from the armada repository into:
 *   src/generated/docs/<version>/   — processed markdown (image paths rewritten)
 *   src/generated/docs-manifest.json — version + page index
 *   public/docs-static/<version>/   — static assets (images, etc.)
 *
 * Local dev:   reads from ../armada (sibling checkout)
 * CI/Netlify:  clones https://github.com/armadakv/armada.git into a temp dir
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = path.resolve(__dirname, '..');
const ARMADA_LOCAL = path.resolve(SITE_ROOT, '..', 'armada');
const ARMADA_REMOTE = 'https://github.com/armadakv/armada.git';
const CURRENT_RELEASE = 'v0.10.0';
const SEMVER_RE = /^v\d+\.\d+/;

function run(cmd, opts = {}) {
  return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], ...opts }).trim();
}

function runBinary(cmd) {
  return execSync(cmd, { stdio: ['pipe', 'pipe', 'pipe'], maxBuffer: 50 * 1024 * 1024 });
}

/** Returns the path to a usable armada git repo, plus a cleanup function. */
function getRepoPath() {
  if (fs.existsSync(path.join(ARMADA_LOCAL, '.git'))) {
    console.log('Using local armada repo:', ARMADA_LOCAL);
    return { repoPath: ARMADA_LOCAL, cleanup: () => {} };
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'armada-docs-'));
  console.log('Cloning armada repo (shallow) to:', tempDir);
  // Bare clone with partial object filter for speed on CI
  run(`git clone --filter=blob:none --no-checkout --bare ${ARMADA_REMOTE} ${tempDir}`);
  // Fetch all semver tags
  run(`git -C ${tempDir} fetch --tags`);
  return {
    repoPath: tempDir,
    cleanup: () => fs.rmSync(tempDir, { recursive: true, force: true }),
  };
}

/** List all semver tags, newest first, preceded by 'main'. */
function getVersions(repoPath) {
  let raw = '';
  try {
    raw = run(`git -C ${repoPath} tag`);
  } catch {
    // no tags is fine
  }
  const tags = raw
    .split('\n')
    .filter((t) => SEMVER_RE.test(t.trim()))
    .map((t) => t.trim())
    .sort((a, b) => {
      const pa = a.replace(/^v/, '').split(/[.\-]/).map(Number);
      const pb = b.replace(/^v/, '').split(/[.\-]/).map(Number);
      for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const d = (pb[i] || 0) - (pa[i] || 0);
        if (d !== 0) return d;
      }
      return 0;
    });
  return ['main', ...tags];
}

/** List all files inside docs/ at the given git ref. */
function listDocsFiles(repoPath, ref) {
  try {
    const out = run(`git -C ${repoPath} ls-tree -r --name-only "${ref}" -- docs/`);
    return out.split('\n').filter((f) => f.length > 0);
  } catch {
    return [];
  }
}

/** Read a text file from git at the given ref. Returns null on error. */
function readTextAtRef(repoPath, ref, filePath) {
  try {
    return run(`git -C ${repoPath} show "${ref}:${filePath}"`, { maxBuffer: 10 * 1024 * 1024 });
  } catch {
    return null;
  }
}

/** Read a binary file from git at the given ref. Returns null on error. */
function readBinaryAtRef(repoPath, ref, filePath) {
  try {
    return runBinary(`git -C ${repoPath} show "${ref}:${filePath}"`);
  } catch {
    return null;
  }
}

/**
 * Parse YAML front-matter from markdown content.
 * Returns { data, content } where content is UNCHANGED (frontmatter is not stripped).
 * Only handles simple scalar values (string/number); nested objects are ignored.
 */
function parseFrontmatter(content) {
  if (!content.startsWith('---\n') && !content.startsWith('---\r\n')) {
    return { data: {}, content };
  }
  const afterOpen = content.indexOf('\n') + 1;
  const rest = content.slice(afterOpen);
  const closeMatch = rest.match(/^---[ \t]*$/m);
  if (!closeMatch) return { data: {}, content };

  const yaml = rest.slice(0, closeMatch.index);
  const data = {};
  for (const line of yaml.split('\n')) {
    const m = line.match(/^([\w-]+):\s*(.+)$/);
    if (m) {
      // Strip optional surrounding quotes
      data[m[1]] = m[2].trim().replace(/^(['"])(.*)\1$/, '$2');
    }
  }
  return { data, content };
}

/** Extract the first H1 heading from markdown content. */
function extractTitle(content) {
  const m = content.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : null;
}

/** Convert a docs-relative file path to a slug array (without .md). */
function fileToSlug(relPath) {
  return relPath.replace(/\.md$/, '').split('/');
}

/**
 * Rewrite image references and relative markdown links in a doc's content.
 *
 * @param {string} content    - Raw markdown text
 * @param {string} relPath    - Path relative to docs/ root, e.g. "user_guide/index.md"
 * @param {string} version    - Version string, e.g. "v0.10.0" or "main"
 */
function rewriteContent(content, relPath, version) {
  const fileDir = path.posix.dirname(relPath); // e.g. "user_guide" or "."

  // --- Rewrite static asset references (images) ---
  // Handles: static/foo.png  ./static/foo.png  ../static/foo.png  ../../static/foo.png
  content = content.replace(
    /!\[([^\]]*)\]\(((?:\.\.\/)*(?:\.\/)?static\/([^)"'\s]+))((?:\s+"[^"]*")?)\)/g,
    (_match, alt, _href, imgFile, title) => {
      return `![${alt}](/docs-static/${version}/${imgFile}${title})`;
    },
  );

  // --- Rewrite relative markdown/page links ---
  content = content.replace(/\[([^\]]*)\]\(([^)]+)\)/g, (match, text, href) => {
    // Leave absolute URLs, anchors, mailto, and already-absolute paths alone
    if (/^(https?:|mailto:|#|\/)/.test(href)) return match;

    const hashIdx = href.indexOf('#');
    const hrefPath = hashIdx >= 0 ? href.slice(0, hashIdx) : href;
    const anchor = hashIdx >= 0 ? href.slice(hashIdx) : '';

    if (!hrefPath) return match; // anchor-only link

    // Leave links to image/binary files alone (already handled by img regex above)
    if (/\.(png|jpg|jpeg|gif|svg|webp|ico|pdf)$/i.test(hrefPath)) return match;

    // Resolve the href relative to the current file's directory within docs/
    let resolved;
    if (fileDir === '.') {
      resolved = hrefPath;
    } else {
      resolved = path.posix.normalize(path.posix.join(fileDir, hrefPath));
    }

    // If it resolves outside docs/ root, leave it unchanged
    if (resolved.startsWith('..')) return match;

    // Strip .md extension if present
    resolved = resolved.replace(/\.md$/, '');

    return `[${text}](/docs/${version}/${resolved}${anchor})`;
  });

  return content;
}

async function main() {
  const { repoPath, cleanup } = getRepoPath();

  try {
    const versions = getVersions(repoPath);
    console.log('Versions found:', versions.join(', '));

    const manifest = {
      versions,
      defaultVersion: 'main', // resolved below after processing
      byVersion: {},
    };

    for (const version of versions) {
      // For local bare repos (CI), "main" may be refs/heads/main
      const refs =
        version === 'main'
          ? ['main', 'master', 'origin/main', 'origin/master', 'v2', 'origin/v2', 'HEAD']
          : [version, `refs/tags/${version}`];

      let allFiles = [];
      let usedRef = null;
      for (const ref of refs) {
        allFiles = listDocsFiles(repoPath, ref);
        if (allFiles.length > 0) {
          usedRef = ref;
          break;
        }
      }

      if (allFiles.length === 0) {
        console.warn(`No docs files found for ${version}, skipping`);
        continue;
      }

      const mdFiles = allFiles.filter((f) => f.endsWith('.md'));
      const staticFiles = allFiles.filter((f) => f.startsWith('docs/static/'));

      console.log(
        `Processing ${version} (ref: ${usedRef}): ${mdFiles.length} md files, ${staticFiles.length} static files`,
      );

      const pages = [];

      // Process and write markdown files
      for (const fullPath of mdFiles) {
        const relPath = fullPath.slice('docs/'.length); // e.g. "quickstart.md"
        const content = readTextAtRef(repoPath, usedRef, fullPath);
        if (content === null) {
          console.warn(`  Could not read ${fullPath}, skipping`);
          continue;
        }

        const rewritten = rewriteContent(content, relPath, version);
        const { data: fm } = parseFrontmatter(content);
        const title =
          fm.title ||
          fm.sidebar_label ||
          extractTitle(content) ||
          relPath.replace(/\.md$/, '');
        const slug = fileToSlug(relPath);

        const outPath = path.join(SITE_ROOT, 'src', 'generated', 'docs', version, relPath);
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, rewritten, 'utf8');

        /** @type {{ slug: string[], title: string, file: string, description?: string }} */
        const pageEntry = {
          slug,
          title,
          file: path.posix.join('src', 'generated', 'docs', version, relPath),
        };
        if (fm.description) pageEntry.description = fm.description;
        pages.push(pageEntry);
      }

      // Copy binary static assets
      for (const fullPath of staticFiles) {
        const relPath = fullPath.slice('docs/static/'.length); // e.g. "topology.png"
        const data = readBinaryAtRef(repoPath, usedRef, fullPath);
        if (data === null) {
          console.warn(`  Could not read ${fullPath}, skipping`);
          continue;
        }
        const outPath = path.join(SITE_ROOT, 'public', 'docs-static', version, relPath);
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, data);
      }

      manifest.byVersion[version] = { pages };
    }

    // Resolve defaultVersion: latest semver tag with pages, falling back to 'main'
    const versionsWithPages = versions.filter((v) => manifest.byVersion[v]?.pages?.length > 0);
    manifest.versions = versionsWithPages;
    const latestTag = versionsWithPages.find((v) => v !== 'main');
    manifest.defaultVersion = latestTag ?? 'main';

    // Write manifest
    const manifestPath = path.join(SITE_ROOT, 'src', 'generated', 'docs-manifest.json');
    fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
    console.log('\nManifest written to:', path.relative(SITE_ROOT, manifestPath));
    console.log('Versions in manifest:', Object.keys(manifest.byVersion).join(', '));
    for (const [v, { pages }] of Object.entries(manifest.byVersion)) {
      console.log(`  ${v}: ${pages.length} pages`);
    }
  } finally {
    cleanup();
  }
}

main().catch((err) => {
  console.error('sync-docs failed:', err.message || err);
  process.exit(1);
});
