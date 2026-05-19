import Link from 'next/link';
import Image from 'next/image';

const features = [
  {
    icon: '🌐',
    title: 'Hub-and-Spoke Replication',
    description:
      'Distribute data globally from a single core cluster to multiple edge clusters. Armada handles replication automatically—no cross-cluster complexity.',
  },
  {
    icon: '☸️',
    title: 'Kubernetes Native',
    description:
      'Manage and monitor Armada just like any other Kubernetes deployment. First-class support via the official Armada Helm Chart.',
  },
  {
    icon: '⚡',
    title: 'High Read Throughput',
    description:
      'Built for read-heavy workloads. Serve sub-millisecond reads at the edge, making it ideal for configuration and feature data distribution.',
  },
  {
    icon: '🛡️',
    title: 'Fault-Tolerant',
    description:
      'Powered by the Raft consensus algorithm with data redundancy. Armada continues serving reads during network partitions and node outages.',
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-28 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/30 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-3xl">
          <div className="mb-6 flex justify-center">
            <Image
              src="/logos/svg/full-dark.svg"
              alt="Armada KV"
              width={320}
              height={280}
              priority
              style={{ height: 'auto' }}
            />
          </div>
          <p className="mb-6 text-xl font-medium text-blue-300 sm:text-2xl">
            Distributed Key-Value Store for Kubernetes
          </p>
          <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
            A distributed, eventually consistent KV store with a hub-and-spoke replication model.
            Built for Kubernetes, optimized for high read throughput and global data distribution.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/docs/main/quickstart"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-blue-900/40 transition-colors hover:bg-blue-500"
            >
              Get Started →
            </Link>
            <a
              href="https://github.com/armadakv/armada"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-600 px-6 py-3 text-base font-semibold text-slate-200 transition-colors hover:border-slate-400 hover:text-white"
            >
              <svg
                viewBox="0 0 16 16"
                width="18"
                height="18"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white px-6 py-20 dark:bg-slate-950">
        <div className="mx-auto max-w-screen-xl">
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Built for the edge
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-slate-500 dark:text-slate-400">
            Armada brings together the best of distributed systems and Kubernetes-native operations.
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900"
              >
                <span className="text-3xl" aria-hidden="true">
                  {feature.icon}
                </span>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Explore more */}
      <section className="border-t border-slate-100 bg-slate-50 px-6 py-16 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-screen-xl">
          <h2 className="mb-10 text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Learn more
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                href: '/use-cases',
                title: 'Use Cases',
                description:
                  'Config distribution, feature flags, edge caching — see where Armada fits in your stack.',
                cta: 'Explore use cases →',
              },
              {
                href: '/architecture',
                title: 'Architecture',
                description:
                  'Hub-and-spoke topology, multi-group Raft, MVCC versioning — understand how Armada works.',
                cta: 'See how it works →',
              },
              {
                href: '/ecosystem',
                title: 'Ecosystem',
                description:
                  'Official Go and Java clients, community tools, and the gRPC API surface.',
                cta: 'Browse the ecosystem →',
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-6 transition-colors hover:border-blue-400 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-blue-500"
              >
                <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 dark:text-slate-50 dark:group-hover:text-blue-400">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {item.description}
                </p>
                <span className="mt-auto text-sm font-medium text-blue-600 dark:text-blue-400">
                  {item.cta}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

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
