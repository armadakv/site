import type { Metadata } from 'next';
import Link from 'next/link';
import { TopologyAnimation } from '@/components/TopologyAnimation';
import WritePathAnimation from '@/components/WritePathAnimation';
import TablesAnimation from '@/components/TablesAnimation';
import RecoveryAnimation from '@/components/RecoveryAnimation';

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

            <TopologyAnimation />

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
                  cross-cluster round trip. Writes received by a follower are forwarded to the
                  leader, and acknowledged once the follower has applied them locally.
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
                  body: 'A 3-node cluster survives one node failure. A 5-node cluster survives two. Committed writes are not lost as long as a majority of nodes are reachable, which also makes rolling updates routine.',
                },
                {
                  title: 'Multi-group',
                  body: 'Each table is its own Raft group with its own leader and log, so tables commit independently and write throughput is not bottlenecked by a single log.',
                },
                {
                  title: 'QUIC transport',
                  body: 'Raft traffic and gossip-based peer discovery share a single QUIC (UDP) socket, with multiplexed streams between members and no static member list to maintain.',
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
                Data in Armada is organized into tables. Each table is its own Raft group with its
                own leader, its own revision counter and its own replication stream. When a node
                fails, only the tables whose leader was on that node pause for an election.
              </p>
            </div>
            <TablesAnimation />
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
                      'Each table has its own Raft group, so an election or a slow table does not hold up the others.',
                    ],
                    [
                      'Consistency scope',
                      'All API guarantees (transactions, linearizable reads, revisions) are scoped to a single table; there is no ordering across tables. Reads are served locally by default; a linearizable read is relative to the cluster that serves it.',
                    ],
                    [
                      'Lifecycle',
                      'Tables are created and deleted at runtime through the Tables API on the leader cluster. Follower clusters pick them up automatically.',
                    ],
                    [
                      'Replication unit',
                      'Each follower runs one replication stream per table, so lag and recovery are tracked, and happen, table by table.',
                    ],
                    [
                      'Storage engine',
                      'Table data is persisted in Pebble, an LSM-tree engine, using the V2 key schema: every version of a key is stored next to its revisions, latest first, for fast point reads and range scans.',
                    ],
                  ].map(([prop, detail]) => (
                    <tr key={prop} className="bg-white dark:bg-slate-950">
                      <td className="px-6 py-3 align-top font-medium whitespace-nowrap text-slate-800 dark:text-slate-200">
                        {prop}
                      </td>
                      <td className="px-6 py-3 text-slate-600 dark:text-slate-400">{detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Revisions and MVCC */}
          <section>
            <div className="mb-8 text-center">
              <h2 className="mb-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
                Revisions &amp; MVCC
              </h2>
              <p className="mx-auto max-w-2xl text-slate-500 dark:text-slate-400">
                Every write to a table gets the next revision of that table. Each key carries two of
                them, and because followers store the leader&apos;s revision rather than their own,
                the same write has the same revision in every cluster.
              </p>
            </div>

            {/* One key's history */}
            <div className="mb-8 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full min-w-[440px] text-sm">
                <caption className="bg-slate-50 px-6 py-3 text-left text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                  History of the key <code className="font-mono text-xs">flags/dark-mode</code>
                </caption>
                <thead className="bg-slate-100 dark:bg-slate-800">
                  <tr className="text-left text-slate-700 dark:text-slate-300">
                    <th className="px-6 py-2 font-semibold">Table revision</th>
                    <th className="px-6 py-2 font-semibold">Operation</th>
                    <th className="px-6 py-2 font-semibold">
                      <code className="font-mono text-xs">create_revision</code>
                    </th>
                    <th className="px-6 py-2 font-semibold">
                      <code className="font-mono text-xs">mod_revision</code>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-xs dark:divide-slate-800">
                  {[
                    ['12', 'Put "off"', '12', '12', ''],
                    ['30', 'Put "on"', '12', '30', ''],
                    ['41', 'Delete', '—', '—', 'the key is gone; it compares as revision 0'],
                    ['57', 'Put "on"', '57', '57', 'a new incarnation of the key'],
                  ].map(([rev, op, create, mod, note]) => (
                    <tr
                      key={rev}
                      className="bg-white text-slate-700 dark:bg-slate-950 dark:text-slate-300"
                    >
                      <td className="px-6 py-2 align-top">{rev}</td>
                      <td className="px-6 py-2 align-top">
                        {op}
                        {note && (
                          <span className="mt-0.5 block font-sans text-slate-500 dark:text-slate-400">
                            {note}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-2 align-top">{create}</td>
                      <td className="px-6 py-2 align-top">{mod}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {[
                {
                  title: 'Query by revision',
                  body: (
                    <>
                      <code className="font-mono text-xs">Range</code>,{' '}
                      <code className="font-mono text-xs">IterateRange</code> and transaction ranges
                      accept inclusive{' '}
                      <code className="font-mono text-xs">min_/max_mod_revision</code> and{' '}
                      <code className="font-mono text-xs">min_/max_create_revision</code> bounds
                      (zero means unbounded). Asking for{' '}
                      <code className="font-mono text-xs">min_mod_revision: 42</code> returns only
                      keys changed since revision 42. Filters are evaluated before any value is
                      read.
                    </>
                  ),
                },
                {
                  title: 'Compare-and-swap on revisions',
                  body: (
                    <>
                      Transactions can compare a key&apos;s{' '}
                      <code className="font-mono text-xs">CREATE</code> or{' '}
                      <code className="font-mono text-xs">MOD</code> revision, with etcd semantics.
                      &ldquo;<code className="font-mono text-xs">mod_revision == 30</code>&rdquo;
                      gives optimistic concurrency, and &ldquo;
                      <code className="font-mono text-xs">create_revision == 0</code>&rdquo; means
                      create only if absent.
                    </>
                  ),
                },
                {
                  title: 'History with a horizon',
                  body: (
                    <>
                      Older versions stay in Pebble until the table&apos;s GC horizon, which
                      advances as the leader compacts its Raft log and is carried to follower
                      clusters through replication. GC skips SST blocks that hold no expired
                      versions. See the{' '}
                      <Link
                        href="/docs/main/v2_key_schema"
                        className="text-blue-600 underline underline-offset-2 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        V2 key schema
                      </Link>
                      .
                    </>
                  ),
                },
                {
                  title: 'Next: Watch',
                  body: (
                    <>
                      There is no Watch API yet; clients poll with a revision filter.{' '}
                      <Link
                        href="/docs/main/proposals/007-watch-api"
                        className="text-blue-600 underline underline-offset-2 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        RFC 007
                      </Link>{' '}
                      proposes an etcd-style Watch that streams changes live and replays them from
                      these stored versions, on leader and follower clusters alike.
                    </>
                  ),
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
            <WritePathAnimation />
          </section>

          {/* Follower recovery */}
          <section>
            <div className="mb-8 text-center">
              <h2 className="mb-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
                When a Follower Falls Too Far Behind
              </h2>
              <p className="mx-auto max-w-2xl text-slate-500 dark:text-slate-400">
                A follower that was offline for longer than the leader keeps its log, back to the GC
                horizon, cannot catch up entry by entry. It recovers that table from a snapshot
                instead, and keeps serving reads from its existing data while it does.
              </p>
            </div>
            <RecoveryAnimation />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {[
                {
                  title: 'Full or incremental',
                  body: 'With a store configured, leaders export a full snapshot of each table periodically and an incremental one on every log compaction. A follower still inside an incremental snapshot’s range applies just the delta to its live shard; otherwise it loads a full one.',
                },
                {
                  title: 'Resumable, verified downloads',
                  body: 'Downloads of stored artefacts continue from fsynced checkpoints after a dropped connection, a restart or power loss, and are verified by size and SHA-256. A live snapshot is regenerated per request, so it starts over.',
                },
                {
                  title: 'Built aside, then swapped in',
                  body: 'The snapshot is loaded into a new shard whose replicas join as Raft learners and are promoted once caught up. Only then does it replace the serving shard. Every phase is recorded durably, so recovery picks up where it left off.',
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

          {/* CTA to docs */}
          <section className="rounded-2xl border border-blue-200 bg-blue-50 px-8 py-10 text-center dark:border-blue-900/40 dark:bg-blue-900/10">
            <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-slate-50">
              Want the full technical details?
            </h2>
            <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
              The Architecture doc covers Raft internals, the QUIC transport, the V2 key schema,
              MVCC revisions, and more.
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
