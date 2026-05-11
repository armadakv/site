import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Use Cases',
  description:
    'Explore the real-world scenarios where ArmadaKV excels — from edge configuration distribution to globally consistent feature flags.',
};

const useCases = [
  {
    icon: '⚙️',
    title: 'Configuration Distribution',
    tagline: 'One source of truth, everywhere',
    description:
      'Push application configuration from a central cluster to every edge location in real time. Services read config locally with sub-millisecond latency while the leader cluster handles all writes, keeping every region in sync automatically.',
    highlights: [
      'Zero-latency local reads at each edge',
      'Atomic updates via transactions',
      'Instant propagation on change',
    ],
    link: { label: 'Read the User Guide', href: '/docs/main/user_guide/index' },
  },
  {
    icon: '🚩',
    title: 'Feature Flags & A/B Testing',
    tagline: 'Ship safely at global scale',
    description:
      'Store feature flag state in Armada and read it at the edge with microsecond latency. Roll out features progressively region by region using the hub-and-spoke topology — the leader controls the rollout, followers serve it instantly.',
    highlights: [
      'Consistent flag state across all services in a region',
      'Per-table isolation for separate flag namespaces',
      'Watch for changes via gRPC streaming',
    ],
    link: { label: 'Explore the API', href: '/docs/main/api' },
  },
  {
    icon: '🗺️',
    title: 'Edge Data Caching',
    tagline: 'Global reads, central writes',
    description:
      "Armada's follower clusters act as read replicas that are always current. Use them to serve routing tables, rate-limit policies, or any lookup data that must be fast everywhere but only changes occasionally.",
    highlights: [
      'Asynchronous pull replication keeps followers current',
      'Read throughput scales independently per region',
      'Survives leader outages — followers keep serving',
    ],
    link: { label: 'Learn the Architecture', href: '/architecture' },
  },
  {
    icon: '🔒',
    title: 'Secrets & Policy Propagation',
    tagline: 'Centrally managed, locally enforced',
    description:
      "Distribute secrets metadata, API gateway policies, or ACL rules from a single secured leader cluster to all edge nodes. Armada's Raft-backed leader guarantees your writes are durable before any follower receives them.",
    highlights: [
      'Leader writes are fully durable before replication',
      'TLS everywhere — all inter-node and client traffic',
      'Kubernetes-native deployment fits existing RBAC models',
    ],
    link: {
      label: 'Deploying to Kubernetes',
      href: '/docs/main/operations_guide/deploying_to_kubernetes',
    },
  },
  {
    icon: '📊',
    title: 'Distributed Counters & Metadata',
    tagline: 'Consistent state without the complexity',
    description:
      'Use transactions to implement compare-and-swap counters, distributed leases, or lightweight coordination metadata. Armada gives you multi-key ACID transactions backed by Raft — no separate coordination service needed.',
    highlights: [
      'Multi-key transactions with compare-and-swap',
      'MVCC ensures snapshot-isolated reads',
      'Single binary, no external dependencies',
    ],
    link: { label: 'Transactions Guide', href: '/docs/main/user_guide/transactions' },
  },
  {
    icon: '🌍',
    title: 'Multi-Region Disaster Recovery',
    tagline: 'Always-on, even when regions fail',
    description:
      'Follower clusters replicate the full dataset asynchronously. If the leader region goes down, followers keep serving reads. Promotion of a follower to leader restores full write capacity with a single operational step.',
    highlights: [
      'No data loss on follower — full copy of all tables',
      'Reads continue during leader outages',
      'Operational runbooks in the docs',
    ],
    link: { label: 'Operations Guide', href: '/docs/main/operations_guide/index' },
  },
];

export default function UseCasesPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-slate-900 px-6 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 text-sm font-semibold tracking-widest text-blue-400 uppercase">
            Use Cases
          </p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Built for real-world distributed systems
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-400">
            Armada KV was designed around a single insight: most systems need fast local reads but
            only need to write centrally. Here are the scenarios where that model wins.
          </p>
        </div>
      </section>

      {/* Use case cards */}
      <section className="bg-white px-6 py-20 dark:bg-slate-950">
        <div className="mx-auto max-w-screen-xl">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {useCases.map((uc) => (
              <div
                key={uc.title}
                className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl" aria-hidden="true">
                    {uc.icon}
                  </span>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                      {uc.title}
                    </h2>
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      {uc.tagline}
                    </p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {uc.description}
                </p>
                <ul className="flex flex-col gap-1.5">
                  {uc.highlights.map((h) => (
                    <li
                      key={h}
                      className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
                    >
                      <span className="mt-0.5 text-blue-500" aria-hidden="true">
                        ✓
                      </span>
                      {h}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-2">
                  <Link
                    href={uc.link.href}
                    className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {uc.link.label} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-slate-200 bg-slate-50 px-6 py-16 text-center dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Ready to get started?
          </h2>
          <p className="mb-8 text-slate-500 dark:text-slate-400">
            Spin up a single-node Armada cluster in minutes and start exploring the API.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/docs/main/quickstart"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition-colors hover:bg-blue-500"
            >
              Quickstart Guide →
            </Link>
            <Link
              href="/architecture"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-white"
            >
              How it works
            </Link>
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
