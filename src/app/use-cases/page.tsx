import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Use Cases',
  description:
    'Where ArmadaKV fits: configuration, feature flags, reference data and policies that every region reads, written once and ordered by a single leader cluster.',
};

/** Line icons drawn with `currentColor`, matching the homepage feature cards. */
const icons = {
  config: (
    <>
      <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="10" cy="12" r="2" />
      <circle cx="18" cy="18" r="2" />
    </>
  ),
  flag: (
    <>
      <path d="M5 21V4" />
      <path d="M5 4h11l-2 4 2 4H5" />
    </>
  ),
  lookup: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.5 2.4 3.8 5.2 3.8 8.5s-1.3 6.1-3.8 8.5c-2.5-2.4-3.8-5.2-3.8-8.5S9.5 5.9 12 3.5Z" />
    </>
  ),
  policy: (
    <>
      <path d="M12 3 5 6v5c0 4.4 3 8.4 7 10 4-1.6 7-5.6 7-10V6l-7-3Z" />
      <rect x="9.5" y="10.5" width="5" height="4.5" rx="1" />
      <path d="M10.5 10.5V9a1.5 1.5 0 0 1 3 0v1.5" />
    </>
  ),
  coordination: (
    <>
      <path d="M7 7h10M7 7l3-3M7 7l3 3" />
      <path d="M17 17H7M17 17l-3-3M17 17l-3 3" />
    </>
  ),
  edge: (
    <>
      <path d="M3 21h18" />
      <path d="M5 21V10l7-5 7 5v11" />
      <path d="M10 21v-5h4v5" />
    </>
  ),
};

const useCases: {
  icon: keyof typeof icons;
  title: string;
  tagline: string;
  description: string;
  highlights: string[];
  link: { label: string; href: string };
}[] = [
  {
    icon: 'config',
    title: 'Configuration Distribution',
    tagline: 'One source of truth, close to every service',
    description:
      'Write configuration from wherever your tooling runs: any follower forwards the write to the leader cluster. Every region replicates it shortly after and serves it to local services without a cross-region hop, and services pick up changes by asking only for what changed since the revision they last saw.',
    highlights: [
      'Local reads in every region',
      'Atomic multi-key updates with transactions',
      'Incremental sync with min_mod_revision',
    ],
    link: { label: 'Read the User Guide', href: '/docs/main/user_guide/index' },
  },
  {
    icon: 'flag',
    title: 'Feature Flags',
    tagline: 'The same flags, read locally everywhere',
    description:
      'Keep flag definitions in their own table and read them on every request path from the nearest cluster. Progressive rollouts are just data: store per-region or per-cohort state as keys, and change it with a conditional write so concurrent edits cannot overwrite each other.',
    highlights: [
      'A table per flag namespace',
      'Compare-and-swap on mod revision for safe edits',
      'Flags keep being served if the leader is unreachable',
    ],
    link: { label: 'Transactions Guide', href: '/docs/main/user_guide/transactions' },
  },
  {
    icon: 'lookup',
    title: 'Reference & Lookup Data',
    tagline: 'Central writes, global reads',
    description:
      'Routing tables, rate-limit settings, tenant metadata: data read on every request but changed only occasionally. Followers trail the leader briefly, serve prefix and range queries locally, and keep serving if the leader becomes unreachable.',
    highlights: [
      'Read capacity grows per region, independently',
      'Replication lag tracked per table',
      'Prefix and range scans on Pebble',
    ],
    link: { label: 'Learn the Architecture', href: '/architecture' },
  },
  {
    icon: 'policy',
    title: 'Policy & Access-Rule Propagation',
    tagline: 'Centrally managed, locally enforced',
    description:
      'Distribute API-gateway policies or ACL rules from one leader cluster to every enforcement point. A change is committed by a Raft majority before any follower can pull it, and every cluster applies changes in the same order, under the same revision.',
    highlights: [
      'TLS on every gRPC endpoint, mTLS for replication',
      'Tokens guard the Tables and Maintenance APIs',
      'Compare revisions to see exactly what a region has applied',
    ],
    link: { label: 'Security Guide', href: '/docs/main/operations_guide/security' },
  },
  {
    icon: 'coordination',
    title: 'Coordination Metadata',
    tagline: 'Consistent state without a separate service',
    description:
      'Use transactions for compare-and-swap counters, ownership records or version stamps. Creation revisions give you create-if-absent, modification revisions give you optimistic concurrency. Every write goes to the leader cluster, so keep hot coordination close to it.',
    highlights: [
      'Atomic if / then / else transactions within a table',
      'create_revision == 0 means create only if absent',
      'Linearizable reads when you need the latest value',
    ],
    link: { label: 'Transactions Guide', href: '/docs/main/user_guide/transactions' },
  },
  {
    icon: 'edge',
    title: 'Edge & Intermittently Connected Sites',
    tagline: 'Keeps serving when the link drops',
    description:
      'Run a follower cluster in a store, a factory or a remote site. Reads stay local and keep working through WAN outages. When the link returns, the follower catches up from the leader’s log, or from a snapshot if it was away long enough.',
    highlights: [
      'Durable, resumable snapshot recovery',
      'Optional shared object store keeps recovery load off the leader',
      'Same Helm chart for leader and follower clusters',
    ],
    link: { label: 'Replication Guide', href: '/docs/main/operations_guide/replication' },
  },
];

const fit = {
  good: [
    'Reads far outnumber writes, and happen in many regions.',
    'Writes can come from any region, as long as each one can afford a round trip to the leader.',
    'Readers can tolerate a short replication delay, or read linearizably at the leader when they cannot.',
    'You want a single authoritative write path with one ordered history.',
    'Your data fits a key-value model and splits naturally into tables.',
  ],
  caution: [
    'A hot write path needs local-database latency: every write is ordered by the leader cluster, so writes from other regions pay a round trip to it.',
    'You need transactions across tables: guarantees are scoped to a single table.',
    'You need change notifications pushed to you today: Watch is a proposal, poll with revision filters for now.',
    'The write path must fail over to another region automatically: the leader cluster is statically defined, so plan backups and restores instead.',
  ],
};

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
            Read everywhere, write in one place
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-400">
            Armada KV is built around one observation: a lot of shared data is read in every region
            but only needs to be written centrally. These are the scenarios where that model wins,
            and the ones where it does not.
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
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                    <svg
                      viewBox="0 0 24 24"
                      width="22"
                      height="22"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      {icons[uc.icon]}
                    </svg>
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

      {/* Writes from any region */}
      <section className="border-t border-slate-200 bg-slate-50 px-6 py-20 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-screen-lg">
          <h2 className="mb-3 text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
            Writes from any region
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-center text-slate-500 dark:text-slate-400">
            Applications do not need to know where the leader is. Every follower accepts writes and
            forwards them to the leader cluster. Each write pays a round trip to the leader, but
            forwarding is built for throughput, which makes global, infrequent writes practical.
          </p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                title: 'Same API everywhere',
                body: 'Put, DeleteRange and write transactions sent to a follower are forwarded to the leader over a shared gRPC connection. Read-only transactions stay local.',
              },
              {
                title: 'Read your own writes',
                body: 'The follower answers only after the write has come back through replication and is applied locally, so the client immediately reads what it wrote, at the same revision as the leader.',
              },
              {
                title: 'Batched, not serialized',
                body: 'A follower with writes waiting checks every 50 ms and pulls straight away instead of waiting for the next poll. One pull brings back everything committed since the last, so many concurrent writes are acknowledged by the same round trip.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950"
              >
                <h3 className="mb-2 font-semibold text-slate-900 dark:text-slate-50">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-200">What it costs:</span>{' '}
            a forwarded write takes roughly one round trip to the leader region, the leader&apos;s
            Raft commit, and the pull back. That is a good fit for profile and settings updates,
            configuration changes, admin actions or flag edits made from anywhere, and not for a hot
            write path.
          </p>
        </div>
      </section>

      {/* Fit */}
      <section className="border-t border-slate-200 bg-white px-6 py-20 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-screen-lg">
          <h2 className="mb-3 text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
            Is Armada the right fit?
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-center text-slate-500 dark:text-slate-400">
            The hub-and-spoke model is a deliberate trade-off. It is worth checking against your
            workload before you start.
          </p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {[
              {
                title: 'A great fit when',
                items: fit.good,
                mark: '✓',
                tone: 'text-emerald-600 dark:text-emerald-400',
              },
              {
                title: 'Think twice when',
                items: fit.caution,
                mark: '!',
                tone: 'text-amber-600 dark:text-amber-400',
              },
            ].map((col) => (
              <div
                key={col.title}
                className="rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900"
              >
                <h3 className="mb-4 font-semibold text-slate-900 dark:text-slate-50">
                  {col.title}
                </h3>
                <ul className="flex flex-col gap-3">
                  {col.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300"
                    >
                      <span
                        className={`mt-0.5 w-3 shrink-0 font-bold ${col.tone}`}
                        aria-hidden="true"
                      >
                        {col.mark}
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
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
