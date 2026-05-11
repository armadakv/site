import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Ecosystem',
  description: 'Official client libraries, community tools, and integrations for ArmadaKV.',
};

const clients = [
  {
    name: 'armada-go',
    lang: 'Go',
    langColor: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
    description:
      'Official Go client library. Provides a high-level API for KV operations, table management, and watch streams.',
    href: 'https://github.com/armadakv/armada-go',
    note: 'Published under legacy regatta-go module path.',
  },
  {
    name: 'armada-java-core',
    lang: 'Java / JVM',
    langColor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    description:
      'Official low-level JVM client built on top of the generated gRPC stubs. Works with any JVM language.',
    href: 'https://github.com/armadakv/armada-java/tree/main/regatta-java-core',
    note: 'Artifact still published as regatta-java-core.',
  },
  {
    name: 'armada-java-spring-data',
    lang: 'Spring / JVM',
    langColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    description:
      'Spring Data integration for Armada. Use familiar Repository abstractions to interact with the KV store.',
    href: 'https://github.com/armadakv/armada-java/tree/main/regatta-java-spring-data',
    note: 'Artifact still published as regatta-java-spring-data.',
  },
];

const tools = [
  {
    name: 'regatta-console',
    category: 'Web UI',
    description:
      'Unofficial web console for querying and administering an Armada cluster. Browse tables, run queries, inspect cluster state.',
    href: 'https://github.com/coufalja/regatta-console',
    author: 'coufalja',
  },
  {
    name: 'regatta-client',
    category: 'CLI',
    description:
      'Unofficial command-line client for querying and manipulating the Armada store. Useful for ad-hoc inspection and scripting.',
    href: 'https://github.com/Tantalor93/regatta-client',
    author: 'Tantalor93',
  },
];

const protocol = [
  {
    title: 'KV service',
    description: 'Get, Put, Delete, and range scan. Supports prefix and range deletes.',
    href: '/docs/main/api',
  },
  {
    title: 'Tables service',
    description: 'Create, list, and delete tables dynamically without restarting the cluster.',
    href: '/docs/main/api',
  },
  {
    title: 'Transactions',
    description: 'Multi-key compare-and-swap transactions with conditional put and delete.',
    href: '/docs/main/user_guide/transactions',
  },
  {
    title: 'Maintenance service',
    description: 'Backup and restore individual tables over a streaming gRPC endpoint.',
    href: '/docs/main/operations_guide/backups',
  },
];

export default function EcosystemPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-slate-900 px-6 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 text-sm font-semibold tracking-widest text-blue-400 uppercase">
            Ecosystem
          </p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Libraries, tools, and integrations
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-400">
            Armada exposes a gRPC API. Everything here speaks that protocol — from official client
            libraries to community-built tools.
          </p>
        </div>
      </section>

      <div className="bg-white px-6 py-20 dark:bg-slate-950">
        <div className="mx-auto max-w-screen-xl space-y-20">
          {/* Official clients */}
          <section>
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Official Client Libraries
            </h2>
            <p className="mb-8 text-slate-500 dark:text-slate-400">
              Maintained by the Armada KV team. All clients wrap the gRPC API and handle connection
              management, retries, and TLS.
            </p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {clients.map((c) => (
                <a
                  key={c.name}
                  href={c.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-6 transition-colors hover:border-blue-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold text-slate-900 group-hover:text-blue-600 dark:text-slate-50 dark:group-hover:text-blue-400">
                      {c.name}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.langColor}`}>
                      {c.lang}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {c.description}
                  </p>
                  {c.note && (
                    <p className="text-xs text-slate-400 italic dark:text-slate-500">{c.note}</p>
                  )}
                  <div className="mt-auto flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <svg
                      viewBox="0 0 16 16"
                      width="12"
                      height="12"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                    </svg>
                    github.com/armadakv
                  </div>
                </a>
              ))}
            </div>
          </section>

          {/* Community tools */}
          <section>
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Community Tools
            </h2>
            <p className="mb-8 text-slate-500 dark:text-slate-400">
              Built by community contributors. Not officially maintained by the Armada team.
            </p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {tools.map((t) => (
                <a
                  key={t.name}
                  href={t.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-6 transition-colors hover:border-blue-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold text-slate-900 group-hover:text-blue-600 dark:text-slate-50 dark:group-hover:text-blue-400">
                      {t.name}
                    </span>
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      {t.category}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {t.description}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">by {t.author}</p>
                </a>
              ))}
            </div>
          </section>

          {/* Protocol / API surface */}
          <section>
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              gRPC API Surface
            </h2>
            <p className="mb-8 text-slate-500 dark:text-slate-400">
              Armada&apos;s wire protocol is gRPC + protobuf. Implement a client in any language
              with first-class gRPC support. These are the four main service areas.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {protocol.map((p) => (
                <Link
                  key={p.title}
                  href={p.href}
                  className="flex flex-col gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-5 transition-colors hover:border-blue-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500"
                >
                  <span className="font-semibold text-slate-900 dark:text-slate-50">{p.title}</span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {p.description}
                  </span>
                  <span className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                    View in docs →
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* Build your own */}
          <section className="rounded-2xl border border-slate-200 bg-slate-50 px-8 py-10 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-slate-50">
                  Building a new client or tool?
                </h2>
                <p className="max-w-xl text-sm text-slate-600 dark:text-slate-400">
                  The proto definitions live in the{' '}
                  <a
                    href="https://github.com/armadakv/armada/tree/master/proto"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    armada/proto
                  </a>{' '}
                  directory. Generate client stubs with protoc and the gRPC plugin for your
                  language. The full API reference is in the docs.
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                <a
                  href="https://github.com/armadakv/armada/tree/master/proto"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-white"
                >
                  Browse proto files
                </a>
                <Link
                  href="/docs/main/api"
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
                >
                  API Reference →
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-6 py-8 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-screen-xl flex-col items-center justify-between gap-4 text-sm text-slate-500 sm:flex-row dark:text-slate-400">
          <span>© {new Date().getFullYear()} Armada KV. Apache 2.0 License.</span>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/armadakv/armada"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-slate-900 dark:hover:text-slate-100"
            >
              GitHub
            </a>
            <Link
              href="/docs"
              className="transition-colors hover:text-slate-900 dark:hover:text-slate-100"
            >
              Docs
            </Link>
            <a
              href="https://github.com/armadakv/armada/blob/master/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-slate-900 dark:hover:text-slate-100"
            >
              License
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
