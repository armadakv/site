import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Ecosystem',
  description: 'Official client libraries, community tools, and integrations for ArmadaKV.',
};

const CLIENT_REPO = 'https://github.com/armadakv/client';

type Client = {
  name: string;
  lang: string;
  langColor: string;
  description: string;
  /** Packages, each shown as an install line. */
  packages: { label?: string; install: string }[];
  href?: string;
  planned?: boolean;
};

const clients: Client[] = [
  {
    name: 'Go',
    lang: 'Go',
    langColor: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
    description:
      'Idiomatic Go client for KV reads and writes, transactions, revision filters and table management. Optional plugins add Prometheus metrics, OpenTelemetry tracing, and zap or logrus logging.',
    packages: [
      { install: 'go get github.com/armadakv/client/go' },
      {
        label: 'plugins',
        install: 'github.com/armadakv/client/go/plugin/{rprom,rotel,rzap,rlogrus}',
      },
    ],
    href: `${CLIENT_REPO}/tree/main/go`,
  },
  {
    name: 'Java / JVM',
    lang: 'JVM',
    langColor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    description:
      'Client for any JVM language, with a Spring Data KeyValue integration for Repository-style access and JUnit / Testcontainers helpers for running a real Armada in tests.',
    packages: [
      { label: 'client', install: 'io.armadakv:armada-java-core' },
      { label: 'Spring', install: 'io.armadakv:armada-java-spring-data' },
      { label: 'tests', install: 'io.armadakv:armada-java-test' },
      { label: 'stubs', install: 'io.armadakv:armada-java-grpc' },
    ],
    href: `${CLIENT_REPO}/tree/main/java`,
  },
  {
    name: 'Python',
    lang: 'Python',
    langColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    description:
      'A native Python client is planned. Until then, any Python gRPC toolchain can generate stubs from the proto files.',
    packages: [],
    planned: true,
  },
  {
    name: 'Rust',
    lang: 'Rust',
    langColor: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    description:
      'A Rust client is planned. Until then, tonic or any Rust gRPC toolchain can generate stubs from the proto files.',
    packages: [],
    planned: true,
  },
];

const uiClients = [
  {
    name: 'armada-console',
    category: 'Web UI',
    description:
      'Web dashboard for Armada: browse and edit keys across tables, create and manage tables, and monitor nodes and cluster metrics. Pre-built binaries for Linux and macOS.',
    href: 'https://github.com/armadakv/console',
  },
];

const cliClients = [
  {
    name: 'arq',
    category: 'Data plane',
    description:
      'Query CLI for application data: get (by key, prefix or range, with counts, keys-only, streaming and linearizable reads), put, delete, and transactions in the familiar etcdctl cmp / then / else style.',
    href: '/docs/main/operations_guide/cli/arq',
  },
  {
    name: 'arctl',
    category: 'Control plane',
    description:
      'Administration CLI: create, list and delete tables, and back up or restore them. Keeps operational commands separate from application data access.',
    href: '/docs/main/operations_guide/cli/arctl',
  },
];

const GITHUB_ICON =
  'M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z';

function RepoLink({ href }: { href: string }) {
  return (
    <div className="mt-auto flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
      <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden="true">
        <path d={GITHUB_ICON} />
      </svg>
      {href.replace('https://github.com/', '').replace('/tree/main/', '/')}
    </div>
  );
}

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
            <p className="mb-8 max-w-3xl text-slate-500 dark:text-slate-400">
              Maintained by the Armada KV team in the{' '}
              <a
                href={CLIENT_REPO}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                armadakv/client
              </a>{' '}
              monorepo. The Go and JVM SDKs are built from the same pinned copy of the protocol and
              checked by a shared conformance suite against Armada release images.
            </p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {clients.map((c) => {
                const body = (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-base font-semibold text-slate-900 group-hover:text-blue-600 dark:text-slate-50 dark:group-hover:text-blue-400">
                        {c.name}
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        {c.planned && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                            Coming soon
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.langColor}`}
                        >
                          {c.lang}
                        </span>
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {c.description}
                    </p>
                    {c.packages.length > 0 && (
                      <ul className="space-y-1.5">
                        {c.packages.map((pkg) => (
                          <li key={pkg.install} className="flex items-center gap-2">
                            {pkg.label && (
                              <span className="w-14 shrink-0 text-xs text-slate-500 dark:text-slate-400">
                                {pkg.label}
                              </span>
                            )}
                            <code className="block min-w-0 flex-1 overflow-x-auto rounded-md bg-slate-900 px-3 py-1.5 font-mono text-xs whitespace-nowrap text-slate-100 dark:bg-slate-950">
                              {pkg.install}
                            </code>
                          </li>
                        ))}
                      </ul>
                    )}
                    {c.href && <RepoLink href={c.href} />}
                  </>
                );
                return c.href ? (
                  <a
                    key={c.name}
                    href={c.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-6 transition-colors hover:border-blue-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500"
                  >
                    {body}
                  </a>
                ) : (
                  <div
                    key={c.name}
                    className="flex flex-col gap-4 rounded-xl border border-dashed border-slate-300 p-6 dark:border-slate-700"
                  >
                    {body}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Graphical & CLI clients */}
          <section>
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Graphical &amp; CLI Clients
            </h2>
            <p className="mb-8 text-slate-500 dark:text-slate-400">
              First-class tools for interacting with Armada — from a browser-based console to
              purpose-built CLI binaries for query and administration workflows.
            </p>

            <h3 className="mb-4 text-sm font-semibold tracking-widest text-slate-400 uppercase">
              Web Console
            </h3>
            <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2">
              {uiClients.map((t) => (
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
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                      {t.category}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {t.description}
                  </p>
                  <RepoLink href={t.href} />
                </a>
              ))}
            </div>

            <h3 className="mb-4 text-sm font-semibold tracking-widest text-slate-400 uppercase">
              CLI Tools
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {cliClients.map((t) => (
                <Link
                  key={t.name}
                  href={t.href}
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
                  <span className="mt-auto text-xs font-medium text-blue-600 dark:text-blue-400">
                    CLI reference →
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
                  directory; the client monorepo vendors a copy pinned to an Armada release.
                  Generate stubs with protoc or buf and the gRPC plugin for your language. Note that
                  the wire package is still named{' '}
                  <code className="font-mono text-xs">regatta.v1</code> for compatibility.
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
