import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Architecture',
  description:
    'Understand how ArmadaKV works — hub-and-spoke topology, Raft consensus within clusters, asynchronous cross-cluster replication, and tables.',
};

export default function ArchitecturePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-slate-900 px-6 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 text-sm font-semibold tracking-widest text-blue-400 uppercase">
            Architecture
          </p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Simple model, strong guarantees
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-400">
            Armada&apos;s design is deliberately constrained. One leader cluster owns writes. Many
            follower clusters serve reads. Raft makes each cluster fault-tolerant. The result is a
            system that is easy to reason about and operate.
          </p>
        </div>
      </section>

      <div className="bg-white px-6 py-20 dark:bg-slate-950">
        <div className="mx-auto max-w-screen-lg space-y-20">
          {/* Hub and spoke */}
          <section>
            <div className="mb-10 text-center">
              <h2 className="mb-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
                Hub-and-Spoke Topology
              </h2>
              <p className="mx-auto max-w-2xl text-slate-500 dark:text-slate-400">
                There is always exactly one leader cluster. Any number of follower clusters attach
                to it and replicate its data asynchronously. New followers can be added at any time
                without touching the leader.
              </p>
            </div>

            {/* Topology diagram */}
            <div className="mx-auto mb-10 flex max-w-xl flex-col items-center">
              <svg
                viewBox="0 0 420 280"
                className="w-full max-w-lg"
                aria-label="Hub-and-spoke topology diagram"
              >
                {/* Spoke lines */}
                <line
                  x1="210"
                  y1="100"
                  x2="60"
                  y2="210"
                  stroke="#334155"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                />
                <line
                  x1="210"
                  y1="100"
                  x2="210"
                  y2="230"
                  stroke="#334155"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                />
                <line
                  x1="210"
                  y1="100"
                  x2="360"
                  y2="210"
                  stroke="#334155"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                />
                {/* Leader node */}
                <polygon
                  points="210,50 250,75 250,125 210,150 170,125 170,75"
                  fill="#1e3a5f"
                  stroke="#3b82f6"
                  strokeWidth="2"
                />
                <circle cx="210" cy="100" r="10" fill="#3b82f6" />
                <text
                  x="210"
                  y="170"
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="12"
                  fontFamily="system-ui"
                >
                  Leader
                </text>
                {/* Follower nodes */}
                <polygon
                  points="60,185 85,198 85,222 60,235 35,222 35,198"
                  fill="#1e293b"
                  stroke="#475569"
                  strokeWidth="1.5"
                />
                <circle cx="60" cy="210" r="7" fill="#64748b" />
                <text
                  x="60"
                  y="252"
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="11"
                  fontFamily="system-ui"
                >
                  Follower
                </text>
                <polygon
                  points="210,205 235,218 235,242 210,255 185,242 185,218"
                  fill="#1e293b"
                  stroke="#475569"
                  strokeWidth="1.5"
                />
                <circle cx="210" cy="230" r="7" fill="#64748b" />
                <text
                  x="210"
                  y="272"
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="11"
                  fontFamily="system-ui"
                >
                  Follower
                </text>
                <polygon
                  points="360,185 385,198 385,222 360,235 335,222 335,198"
                  fill="#1e293b"
                  stroke="#475569"
                  strokeWidth="1.5"
                />
                <circle cx="360" cy="210" r="7" fill="#64748b" />
                <text
                  x="360"
                  y="252"
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="11"
                  fontFamily="system-ui"
                >
                  Follower
                </text>
              </svg>
              <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-500">
                Dashed lines = asynchronous pull replication
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="mb-2 font-semibold text-slate-900 dark:text-slate-50">
                  Leader cluster
                </h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  Accepts all writes. Uses Raft internally to replicate each write across its nodes
                  before acknowledging the client. Acts as the single source of truth for the entire
                  topology.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="mb-2 font-semibold text-slate-900 dark:text-slate-50">
                  Follower clusters
                </h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  Pull changes from the leader asynchronously. Serve all reads locally with no
                  cross-cluster round trip. Writes received by a follower are transparently
                  forwarded to the leader.
                </p>
              </div>
            </div>
          </section>

          {/* Raft */}
          <section>
            <div className="mb-8 text-center">
              <h2 className="mb-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
                Raft Within Each Cluster
              </h2>
              <p className="mx-auto max-w-2xl text-slate-500 dark:text-slate-400">
                Every cluster — leader or follower — runs multi-group Raft internally. A write is
                only confirmed once a majority of nodes have persisted it. This makes each cluster
                independently fault-tolerant.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {[
                {
                  title: 'Majority quorum',
                  body: 'A 3-node cluster survives one node failure. A 5-node cluster survives two. Raft guarantees no data loss as long as a majority of nodes are reachable.',
                },
                {
                  title: 'Multi-group',
                  body: 'Each table is its own Raft group. This allows write throughput to scale with the number of tables rather than being bottlenecked by a single log.',
                },
                {
                  title: 'QUIC transport',
                  body: 'Inter-node replication uses a QUIC-based transport for low-latency, multiplexed streams between cluster members — no head-of-line blocking.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900"
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
          </section>

          {/* Tables */}
          <section>
            <div className="mb-8 text-center">
              <h2 className="mb-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
                Tables — Isolated Keyspaces
              </h2>
              <p className="mx-auto max-w-2xl text-slate-500 dark:text-slate-400">
                Data in Armada is organized into tables. Each table is an independent namespace with
                its own Raft group and its own replication stream. Tables can be created and deleted
                dynamically without affecting other tables.
              </p>
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                      Property
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                      Detail
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {[
                    [
                      'Isolation',
                      'Each table has its own Raft group — a failure in one table does not affect others.',
                    ],
                    [
                      'Consistency scope',
                      'All API guarantees (linearizable reads, transactions) are scoped to a single table.',
                    ],
                    [
                      'Replication unit',
                      'The cross-cluster replication stream is per-table, enabling fine-grained follower lag monitoring.',
                    ],
                    [
                      'Storage engine',
                      'Table data is persisted in Pebble (an LSM-tree storage engine), providing efficient range scans.',
                    ],
                    [
                      'MVCC',
                      'Writes are stamped with a monotonically increasing version derived from the Raft log index, enabling snapshot-isolated reads.',
                    ],
                  ].map(([prop, detail]) => (
                    <tr key={prop} className="bg-white dark:bg-slate-950">
                      <td className="px-6 py-3 font-medium whitespace-nowrap text-slate-800 dark:text-slate-200">
                        {prop}
                      </td>
                      <td className="px-6 py-3 text-slate-600 dark:text-slate-400">{detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Replication flow */}
          <section>
            <div className="mb-8 text-center">
              <h2 className="mb-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
                Write Path, End to End
              </h2>
              <p className="mx-auto max-w-2xl text-slate-500 dark:text-slate-400">
                From a client write to a follower read — here&apos;s what happens at each step.
              </p>
            </div>
            <ol className="relative ml-4 border-l-2 border-slate-200 dark:border-slate-800">
              {[
                {
                  n: '1',
                  title: 'Client sends a Put to the leader',
                  body: 'The write arrives at any leader node via gRPC. If the receiving node is not the Raft leader for that table, it forwards internally.',
                },
                {
                  n: '2',
                  title: 'Raft replicates within the leader cluster',
                  body: 'The entry is appended to the Raft log and replicated to a majority of leader nodes. Once committed, the FSM applies it to Pebble.',
                },
                {
                  n: '3',
                  title: 'Leader acknowledges the client',
                  body: 'The gRPC response is sent only after the write is durably committed by a quorum. No data loss on leader failure.',
                },
                {
                  n: '4',
                  title: 'Followers poll for new log entries',
                  body: "Each follower maintains a replication stream per table, pulling committed entries from the leader's LogServer over gRPC.",
                },
                {
                  n: '5',
                  title: 'Follower proposes entries into its own Raft',
                  body: 'The follower re-proposes each entry into its own per-table Raft group. Raft replicates within the follower cluster too.',
                },
                {
                  n: '6',
                  title: 'Local client reads from the follower',
                  body: 'Reads at the follower are served from its local Pebble store — zero cross-cluster latency.',
                },
              ].map((step) => (
                <li key={step.n} className="mb-8 ml-6">
                  <span className="absolute -left-3.5 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white ring-4 ring-white dark:ring-slate-950">
                    {step.n}
                  </span>
                  <h3 className="mb-1 font-semibold text-slate-900 dark:text-slate-50">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          {/* CTA to docs */}
          <section className="rounded-2xl border border-blue-200 bg-blue-50 px-8 py-10 text-center dark:border-blue-900/40 dark:bg-blue-900/10">
            <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-slate-50">
              Want the full technical details?
            </h2>
            <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
              The Architecture doc covers Raft internals, the QUIC transport fork, MVCC versioning,
              and more.
            </p>
            <Link
              href="/docs/main/architecture"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
            >
              Deep-dive Architecture Docs →
            </Link>
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
