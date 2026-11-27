import Link from 'next/link';
import Image from 'next/image';
import { TopologyBackdrop } from '@/components/TopologyAnimation';

/** Small line icons in the site palette; `currentColor` follows the card's text colour. */
const icon = {
  hub: (
    <>
      <circle cx="12" cy="7" r="3" />
      <circle cx="5" cy="18" r="2" />
      <circle cx="12" cy="19" r="2" />
      <circle cx="19" cy="18" r="2" />
      <path d="M10.5 9.5 6 16.3M12 10v7M13.5 9.5 18 16.3" strokeDasharray="2 2" />
    </>
  ),
  local: (
    <>
      <path d="M12 21s-6-5.6-6-10.5a6 6 0 0 1 12 0C18 15.4 12 21 12 21Z" />
      <circle cx="12" cy="10.5" r="2.2" />
    </>
  ),
  raft: (
    <>
      <path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z" />
      <path d="m4 12 8 4.5 8-4.5" />
      <path d="m4 16.5 8 4.5 8-4.5" />
    </>
  ),
  revisions: (
    <>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
      <path d="M3 4v4h4" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  recovery: (
    <>
      <path d="M12 3 5 6v5c0 4.4 3 8.4 7 10 4-1.6 7-5.6 7-10V6l-7-3Z" />
      <path d="M9 12.5 11 14.5 15 10" />
    </>
  ),
  kubernetes: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 3.5v6M12 14.5v6M3.5 12h6M14.5 12h6M6 6l4.2 4.2M13.8 13.8 18 18M18 6l-4.2 4.2M10.2 13.8 6 18" />
    </>
  ),
};

const features: { icon: keyof typeof icon; title: string; description: string }[] = [
  {
    icon: 'hub',
    title: 'Hub-and-Spoke Replication',
    description:
      'One leader cluster takes every write. Follower clusters in any number of regions pull changes asynchronously, and new ones can be added at any time without touching the leader.',
  },
  {
    icon: 'local',
    title: 'Local Reads Everywhere',
    description:
      'Reads are served by the cluster next to your application, with no cross-region round trip. Writes sent to a follower are forwarded to the leader for you.',
  },
  {
    icon: 'raft',
    title: 'Raft in Every Cluster',
    description:
      'Each cluster runs multi-group Raft, one group per table. A write is acknowledged only once a majority has it, and every table elects and fails over on its own.',
  },
  {
    icon: 'revisions',
    title: 'Revisions & Transactions',
    description:
      'An etcd-style API: every key carries creation and modification revisions. Fetch only what changed since revision N, or make a write conditional with a transaction.',
  },
  {
    icon: 'recovery',
    title: 'Durable Follower Recovery',
    description:
      'A follower that falls too far behind recovers from a snapshot, optionally via a shared object store, resuming interrupted downloads and serving reads until the new data is swapped in.',
  },
  {
    icon: 'kubernetes',
    title: 'Kubernetes Native',
    description:
      'Deploy with the official Helm chart and operate Armada like any other Kubernetes workload, with Prometheus metrics built in.',
  },
];

const HELM = `helm repo add armada https://armadakv.github.io/armada-helm
helm install armada armada/armada`;

const GO = `import client "github.com/armadakv/client/go"

c, _ := client.New(client.WithEndpoints("armada:8443")) // TLS options omitted
flags := c.Table("config")

flags.Put(ctx, "flags/dark-mode", "on")

// Later: fetch only the keys changed since the last revision you saw.
resp, _ := flags.Get(ctx, "flags/", client.WithPrefix(), client.WithMinModRev(seen+1))
for _, kv := range resp.Kvs {
	fmt.Println(string(kv.Key), string(kv.Value), kv.ModRevision)
}`;

function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900 dark:bg-slate-950">
      <div className="border-b border-slate-700 px-4 py-2 text-xs font-medium text-slate-400">
        {title}
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-slate-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-28 text-center">
        <TopologyBackdrop />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/30 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-3xl">
          <Link
            href="/docs/main/changelog"
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-600 bg-slate-900/60 px-3 py-1 text-xs font-medium text-slate-300 transition-colors hover:border-slate-400 hover:text-white"
          >
            <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              v0.4.0
            </span>
            Release notes →
          </Link>
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
            A geographically distributed, etcd-style key-value store. One leader cluster orders
            every write with Raft; follower clusters in every region replicate it asynchronously and
            serve reads locally.
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
            Built for read-heavy, multi-region data
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-slate-500 dark:text-slate-400">
            Configuration, feature flags and reference data that every region needs, consistently
            ordered and close to the applications that read it.
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
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
                    {icon[feature.icon]}
                  </svg>
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

      {/* Try it */}
      <section className="border-t border-slate-100 bg-white px-6 py-20 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto grid max-w-screen-xl grid-cols-1 items-start gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              From install to first read
            </h2>
            <p className="mb-4 leading-relaxed text-slate-600 dark:text-slate-400">
              Install the leader with Helm, create a table, and talk to it with the Go client or any
              gRPC client. Followers are the same chart, pointed at the leader.
            </p>
            <p className="mb-8 leading-relaxed text-slate-600 dark:text-slate-400">
              Polling with a revision filter is how you sync changes today; a streaming Watch API is
              proposed for a future release.
            </p>
            <div className="flex flex-wrap gap-4 text-sm font-medium">
              <Link
                href="/docs/main/quickstart"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Quickstart →
              </Link>
              <Link
                href="/docs/main/api"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                API reference →
              </Link>
              <Link
                href="/ecosystem"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Client libraries →
              </Link>
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-4 lg:col-span-3">
            <CodeBlock title="Kubernetes" code={HELM} />
            <CodeBlock title="Go" code={GO} />
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
