'use client';

import { useRef, useState } from 'react';
import {
  along,
  alongPath,
  ease,
  fitHeaderLabels,
  flash,
  particlePool,
  polyline,
  prog,
  setAttrs,
  span,
  svgEl,
  THEME_CLASSES,
  useCompact,
  useTimeline,
  V,
  type Pt,
} from '@/lib/svgAnim';

/**
 * "Write path, end to end": one Put travels from a client, through the leader cluster's Raft
 * group, to two follower clusters and finally to a local read; then a write made at a follower
 * is forwarded to the leader and comes back through replication. The step list on the right is
 * the narrative; the animation highlights the step it is currently showing.
 */

const STEPS = [
  {
    at: 0,
    title: 'Client sends a Put to the leader',
    body: 'The write arrives at any leader node via gRPC. If that node is not the Raft leader for the table, the proposal is forwarded to the Raft leader internally.',
  },
  {
    at: 3.2,
    title: 'Raft replicates within the leader cluster',
    body: 'The entry is appended to the Raft log and replicated to the other nodes. Once a majority has it, it is committed and applied to Pebble with the next revision.',
  },
  {
    at: 6.6,
    title: 'Leader acknowledges the client',
    body: 'The gRPC response is sent only after the write is committed by a quorum, so an acknowledged write survives the loss of any single node.',
  },
  {
    at: 8.6,
    title: 'Followers poll for new log entries',
    body: "Each follower keeps a replication stream per table and pulls committed entries from the leader's Log service over gRPC, on its own schedule.",
  },
  {
    at: 11.8,
    title: 'Follower proposes entries into its own Raft',
    body: 'The follower re-proposes each entry into its own per-table Raft group, keeping the leader’s revision, so the same write has the same revision in every cluster.',
  },
  {
    at: 15,
    title: 'Local client reads from the follower',
    body: 'Reads at the follower are served from its local Pebble store, with zero cross-cluster latency.',
  },
  {
    at: 19.5,
    title: 'Writes at a follower are forwarded to the leader',
    body: 'A follower never orders writes itself. It forwards the Put to the leader cluster, then answers its client only once the write has been pulled back and applied locally, so that client can read its own write.',
  },
];
const LOOP = 28.5;

const stepAt = (t: number) => STEPS.reduce((acc, s, i) => (t >= s.at ? i : acc), 0);

type Anchor = 'start' | 'middle' | 'end';
type Spot = [number, number, Anchor];

interface WPLayout {
  viewBox: [number, number];
  leaderBox: [number, number, number, number];
  leaderC: Pt;
  leaderGap: number;
  writer: Pt;
  /** The write travels from the client's edge to node 1's edge. */
  putFrom: Pt;
  putTo: Pt;
  writerNote: Spot;
  commitNote: Spot;
  pullLabel: Spot;
  fwdNote: Spot;
  followerGap: number;
  followers: {
    box: [number, number, number, number];
    c: Pt;
    name: string;
    /** Replication spoke, from the follower cluster up to the leader cluster. */
    spoke: Pt[];
    client: Pt;
    okNote: Spot;
  }[];
}

const WIDE: WPLayout = {
  viewBox: [800, 540],
  leaderBox: [210, 40, 470, 140],
  leaderC: [445, 104],
  leaderGap: 140,
  writer: [90, 104],
  putFrom: [142, 104],
  putTo: [284, 104],
  writerNote: [90, 146, 'middle'],
  commitNote: [445, 168, 'middle'],
  pullLabel: [400, 252, 'middle'],
  fwdNote: [600, 252, 'start'],
  followerGap: 95,
  followers: [
    {
      box: [40, 300, 330, 120],
      c: [205, 360],
      name: 'FOLLOWER CLUSTER · REGION A',
      spoke: [
        [205, 300],
        [330, 180],
      ],
      client: [205, 495],
      okNote: [267, 500, 'start'],
    },
    {
      box: [430, 300, 330, 120],
      c: [595, 360],
      name: 'FOLLOWER CLUSTER · REGION B',
      spoke: [
        [595, 300],
        [560, 180],
      ],
      client: [595, 495],
      okNote: [657, 500, 'start'],
    },
  ],
};

/** Portrait layout for phones: leader on top, the two followers stacked below it. */
const COMPACT: WPLayout = {
  viewBox: [400, 770],
  leaderBox: [20, 110, 360, 120],
  leaderC: [200, 165],
  leaderGap: 110,
  writer: [90, 40],
  putFrom: [90, 60],
  putTo: [90, 144],
  writerNote: [150, 45, 'start'],
  commitNote: [200, 131, 'middle'],
  pullLabel: [212, 290, 'start'],
  fwdNote: [384, 314, 'end'],
  followerGap: 110,
  followers: [
    {
      box: [20, 330, 360, 120],
      c: [200, 390],
      name: 'FOLLOWER CLUSTER · REGION A',
      spoke: [
        [200, 330],
        [130, 230],
      ],
      client: [200, 495],
      okNote: [262, 500, 'start'],
    },
    {
      box: [20, 560, 360, 120],
      c: [200, 620],
      name: 'FOLLOWER CLUSTER · REGION B',
      // runs down the right-hand side, past region A
      spoke: [
        [290, 560],
        [392, 520],
        [392, 262],
        [350, 230],
      ],
      client: [200, 725],
      okNote: [262, 730, 'start'],
    },
  ],
};

function buildWritePath(svg: SVGSVGElement, L: WPLayout) {
  svg.setAttribute('viewBox', `0 0 ${L.viewBox[0]} ${L.viewBox[1]}`);
  const root = svgEl(svg, 'g');
  const gLines = svgEl(root, 'g');
  const gBoxes = svgEl(root, 'g');
  const gParts = svgEl(root, 'g');
  const gLabels = svgEl(root, 'g');
  const parts = particlePool(gParts, 40);

  const label = (x: number, y: number, text: string, attrs: Record<string, string | number> = {}) =>
    svgEl(gLabels, 'text', { x, y, 'font-size': 13, fill: V.muted, ...attrs }, text);

  function clusterBox(x: number, y: number, w: number, h: number, color: string, name: string) {
    svgEl(gBoxes, 'rect', {
      x,
      y,
      width: w,
      height: h,
      rx: 16,
      fill: V.panel,
      stroke: color,
      'stroke-width': 2,
    });
    const role = label(x + 2, y - 10, name, {
      'font-weight': 600,
      'letter-spacing': 1,
      fill: color,
    });
    const rev = svgEl(gLabels, 'text', {
      x: x + w - 2,
      y: y - 10,
      'text-anchor': 'end',
      'font-size': 13,
      'font-weight': 600,
      fill: V.muted,
    });
    fitHeaderLabels(role as SVGTextElement, rev as SVGTextElement, w, 'rev 00');
    return rev;
  }

  function raftNodes(cx: number, cy: number, gap: number, color: string, names: boolean) {
    return [-1, 0, 1].map((k) => {
      const at: Pt = [cx + k * gap, cy];
      const ring = svgEl(gBoxes, 'circle', {
        cx: at[0],
        cy: at[1],
        r: 27,
        fill: 'none',
        stroke: V.ok,
        'stroke-width': 3,
        opacity: 0,
      });
      const body = svgEl(gBoxes, 'circle', {
        cx: at[0],
        cy: at[1],
        r: 21,
        fill: V.panel,
        stroke: k === 0 ? color : V.stroke,
        'stroke-width': k === 0 ? 3 : 2,
      });
      if (names)
        label(at[0], at[1] + 42, k === 0 ? 'Raft leader' : `node ${k + 2}`, {
          'text-anchor': 'middle',
          'font-size': 12,
          fill: k === 0 ? color : V.muted,
        });
      return { at, ring, body };
    });
  }

  function client(cx: number, cy: number, name: string) {
    const rect = svgEl(gBoxes, 'rect', {
      x: cx - 52,
      y: cy - 20,
      width: 104,
      height: 40,
      rx: 10,
      fill: V.panel,
      stroke: V.stroke,
      'stroke-width': 2,
    });
    svgEl(
      gLabels,
      'text',
      {
        x: cx,
        y: cy + 5,
        'text-anchor': 'middle',
        'font-size': 14,
        'font-weight': 600,
        fill: V.text,
      },
      name,
    );
    return rect;
  }

  const line = (a: Pt, b: Pt, attrs: Record<string, string | number> = {}) =>
    svgEl(gLines, 'line', {
      x1: a[0],
      y1: a[1],
      x2: b[0],
      y2: b[1],
      stroke: V.stroke,
      'stroke-width': 2,
      ...attrs,
    });

  /* ---- Layout --------------------------------------------------------------------------- */
  const leadRev = clusterBox(...L.leaderBox, V.leader, 'LEADER CLUSTER');
  // node order: [node 1 (entry point), Raft leader, node 3]; Raft leader sits in the middle
  const lead = raftNodes(...L.leaderC, L.leaderGap, V.leader, true);
  const [entry, rl, n3] = [lead[0], lead[1], lead[2]];
  const writerRect = client(...L.writer, 'client');
  line(L.putFrom, L.putTo);
  line([entry.at[0] + 21, L.leaderC[1]], [rl.at[0] - 21, L.leaderC[1]]);
  line([rl.at[0] + 21, L.leaderC[1]], [n3.at[0] - 21, L.leaderC[1]]);

  const spotText = ([x, y, anchor]: Spot, attrs: Record<string, string | number>) =>
    svgEl(gLabels, 'text', { x, y, 'text-anchor': anchor, 'font-size': 13, ...attrs });

  const fols = L.followers.map((f) => {
    const [, y, , h] = f.box;
    const rev = clusterBox(...f.box, V.follower, f.name);
    const nodes = raftNodes(...f.c, L.followerGap, V.follower, false);
    line([nodes[0].at[0] + 21, f.c[1]], [nodes[1].at[0] - 21, f.c[1]]);
    line([nodes[1].at[0] + 21, f.c[1]], [nodes[2].at[0] - 21, f.c[1]]);
    // replication spoke from the leader cluster to this follower
    svgEl(gLines, 'polyline', {
      points: polyline(f.spoke),
      fill: 'none',
      stroke: V.leader,
      'stroke-width': 2,
      'stroke-dasharray': '6 5',
      opacity: 0.7,
    });
    const rect = client(...f.client, 'client');
    const okNote = spotText(f.okNote, { 'font-weight': 600, fill: V.ok, opacity: 0 });
    okNote.textContent = 'OK · rev 44';
    line([f.c[0], y + h], [f.c[0], f.client[1] - 20]);
    return {
      rev,
      nodes,
      up: f.spoke, // follower -> leader
      down: [...f.spoke].reverse(), // leader -> follower
      port: f.spoke[f.spoke.length - 1],
      rect,
      okNote,
      readerTop: [f.c[0], f.client[1] - 20] as Pt,
      bottom: [f.c[0], y + h] as Pt,
    };
  });
  spotText(L.pullLabel, { fill: V.leader }).textContent = 'async pull · Log.Replicate';

  const note = spotText(L.commitNote, { 'font-weight': 600, fill: V.ok, opacity: 0 });
  const writerNote = spotText(L.writerNote, { 'font-weight': 600, fill: V.ok, opacity: 0 });
  writerNote.textContent = 'OK · rev 43';
  const fwdNote = spotText(L.fwdNote, { 'font-weight': 600, fill: V.write, opacity: 0 });
  fwdNote.textContent = 'forwarded Put';

  /* ---- Timeline (seconds) --------------------------------------------------------------- */
  const T = {
    put: [0.4, 1.4] as const, // client -> node 1
    fwd: [1.7, 2.5] as const, // node 1 -> Raft leader
    rep: [3.4, 4.2] as const, // Raft leader -> followers
    ack: [4.4, 5.0] as const, // acks back
    commit: 5.2,
    resp1: [6.8, 7.3] as const, // Raft leader -> node 1
    resp2: [7.3, 8.0] as const, // node 1 -> client
    poll: [
      [8.8, 9.6],
      [9.3, 10.1],
    ] as const,
    pull: [
      [9.8, 10.7],
      [10.3, 11.2],
    ] as const,
    frep: [12.1, 12.7] as const,
    fack: [12.9, 13.4] as const,
    fcommit: [13.6, 14.1] as const,
    reads: [15.2, 19.0] as const,
    // 7. a Put made by the client in region B
    bPut: [19.8, 20.5] as const, // client -> follower
    bUp: [20.7, 21.7] as const, // follower -> leader cluster (forwarded)
    bIn: [21.7, 22.2] as const, // into the leader's Raft leader
    bRep: [22.3, 22.8] as const,
    bAck: [22.9, 23.3] as const,
    bCommit: 23.4,
    bResp: [23.5, 24.4] as const, // leader's response back to the follower
    bPull: [
      [24.6, 25.4],
      [24.2, 25.0],
    ] as const, // rev 44 replicated to both followers (B asked first)
    bOk: [25.4, 26.0] as const, // follower B acks its client only after applying rev 44
  };

  return (t: number) => {
    parts.begin();
    let k: number;
    // fade around the loop seam
    setAttrs(root, { opacity: Math.min(prog(t, 0, 0.3), 1 - prog(t, LOOP - 0.5, LOOP)) });

    // 1. Put reaches node 1, which forwards it to the Raft leader
    if ((k = span(t, ...T.put)) >= 0) parts.box(along(L.putFrom, L.putTo, ease(k)), V.write, 1.3);
    if ((k = span(t, ...T.fwd)) >= 0) parts.box(along(entry.at, rl.at, ease(k)), V.write, 1.3);
    setAttrs(entry.body, { stroke: t >= T.put[1] && t < T.fwd[1] ? V.write : V.stroke });

    // 2. Raft: replicate to the other two nodes, collect acks, commit on a majority
    if ((k = span(t, ...T.rep)) >= 0) {
      parts.box(along(rl.at, entry.at, k), V.write);
      parts.box(along(rl.at, n3.at, k), V.write);
    }
    if ((k = span(t, ...T.ack)) >= 0) {
      parts.dot(along(entry.at, rl.at, k), V.ok);
      parts.dot(along(n3.at, rl.at, k), V.ok);
    }
    if ((k = span(t, ...T.bRep)) >= 0) {
      parts.box(along(rl.at, entry.at, k), V.write);
      parts.box(along(rl.at, n3.at, k), V.write);
    }
    if ((k = span(t, ...T.bAck)) >= 0) {
      parts.dot(along(entry.at, rl.at, k), V.ok);
      parts.dot(along(n3.at, rl.at, k), V.ok);
    }
    const c = Math.max(flash(t, T.commit, 1.2), flash(t, T.bCommit, 1.2));
    lead.forEach((n) => setAttrs(n.ring, { opacity: c }));
    const leaderRev = 42 + +(t >= T.commit) + +(t >= T.bCommit);
    leadRev.textContent = `rev ${leaderRev}`;
    setAttrs(leadRev, { fill: c > 0 ? V.ok : V.muted });
    note.textContent = 'committed on a majority · applied to Pebble';
    setAttrs(note, { opacity: Math.min(prog(t, T.commit, T.commit + 0.3), 1 - prog(t, 8.2, 8.6)) });

    // 3. response travels back the way the request came
    if ((k = span(t, ...T.resp1)) >= 0) parts.dot(along(rl.at, entry.at, k), V.ok);
    if ((k = span(t, ...T.resp2)) >= 0) parts.dot(along(L.putTo, L.putFrom, k), V.ok);
    const w = flash(t, T.resp2[1], 2.2);
    setAttrs(writerRect, { stroke: w > 0 ? V.ok : V.stroke });
    setAttrs(writerNote, { opacity: w > 0 ? Math.min(1, w * 2) : 0 });

    fols.forEach((f, i) => {
      // 4. follower asks "anything after rev 42?" and gets the new entry back
      if ((k = span(t, T.poll[i][0], T.poll[i][1])) >= 0)
        parts.dot(alongPath(f.up, k), V.follower, true);
      if ((k = span(t, T.pull[i][0], T.pull[i][1])) >= 0)
        parts.box(alongPath(f.down, ease(k)), V.leader, 1.3);
      const [frl, fa, fb] = [f.nodes[1], f.nodes[0], f.nodes[2]];
      const got = t >= T.pull[i][1];
      setAttrs(frl.body, { stroke: got && t < T.fcommit[0] ? V.leader : V.follower });

      // 5. it re-proposes the entry into its own Raft group
      if ((k = span(t, ...T.frep)) >= 0) {
        parts.box(along(frl.at, fa.at, k), V.leader);
        parts.box(along(frl.at, fb.at, k), V.leader);
      }
      if ((k = span(t, ...T.fack)) >= 0) {
        parts.dot(along(fa.at, frl.at, k), V.ok);
        parts.dot(along(fb.at, frl.at, k), V.ok);
      }
      const fc = Math.max(flash(t, T.fcommit[0] + i * 0.15, 1.2), flash(t, T.bPull[i][1], 1.2));
      f.nodes.forEach((n) => setAttrs(n.ring, { opacity: fc }));
      const rev = 42 + +(t >= T.fcommit[0] + i * 0.15) + +(t >= T.bPull[i][1]);
      f.rev.textContent = `rev ${rev}`;
      setAttrs(f.rev, { fill: rev < leaderRev ? V.write : fc > 0 ? V.ok : V.muted });

      // 6. local reads: short round trips that stay inside the region
      for (let r = 0; ; r++) {
        const s = T.reads[0] + i * 0.2 + r * 0.55;
        if (s > T.reads[1]) break;
        const u = (t - s) / 0.6;
        if (u < 0 || u >= 1) continue;
        if (u < 0.5) parts.dot(along(f.readerTop, f.bottom, u * 2), V.read, false, 5);
        else parts.dot(along(f.bottom, f.readerTop, (u - 0.5) * 2), V.ok, false, 5);
      }

      // 7. rev 44 comes back through normal replication, to both followers
      if ((k = span(t, T.bPull[i][0], T.bPull[i][1])) >= 0)
        parts.box(alongPath(f.down, ease(k)), V.leader, 1.3);
    });

    // 7. the client in region B writes; its follower forwards the Put to the leader
    const B = fols[1];
    if ((k = span(t, ...T.bPut)) >= 0)
      parts.box(along(B.readerTop, B.bottom, ease(k)), V.write, 1.3);
    if ((k = span(t, ...T.bUp)) >= 0) parts.box(alongPath(B.up, ease(k)), V.write, 1.3);
    if ((k = span(t, ...T.bIn)) >= 0) parts.box(along(B.port, rl.at, k), V.write, 1.3);
    if ((k = span(t, ...T.bResp)) >= 0) parts.dot(alongPath(B.down, k), V.ok);
    // the follower holds the client's response until it has applied rev 44 itself
    const waiting = t >= T.bPut[1] && t < T.bOk[0];
    if (waiting) setAttrs(B.nodes[1].body, { stroke: V.write });
    if ((k = span(t, ...T.bOk)) >= 0) parts.dot(along(B.bottom, B.readerTop, k), V.ok);
    const bw = flash(t, T.bOk[1], 2.2);
    setAttrs(B.rect, { stroke: bw > 0 ? V.ok : V.stroke });
    setAttrs(B.okNote, { opacity: bw > 0 ? Math.min(1, bw * 2) : 0 });
    setAttrs(fwdNote, {
      opacity: Math.min(prog(t, T.bUp[0], T.bUp[0] + 0.3), 1 - prog(t, T.bOk[1], T.bOk[1] + 0.4)),
    });

    parts.end();
  };
}

export default function WritePathAnimation() {
  const compact = useCompact();
  return <WritePathFigure key={compact ? 'compact' : 'wide'} layout={compact ? COMPACT : WIDE} />;
}

function WritePathFigure({ layout }: { layout: WPLayout }) {
  const [step, setStep] = useState(0);
  const stepRef = useRef(0);
  const { svgRef, playing, play, pause, seek } = useTimeline({
    setup: (svg) => buildWritePath(svg, layout),
    loop: LOOP,
    stillAt: 16.5,
    onTick: (t) => {
      const s = stepAt(t);
      if (s !== stepRef.current) {
        stepRef.current = s;
        setStep(s);
      }
    },
  });

  return (
    <div className={`grid grid-cols-1 items-start gap-8 lg:grid-cols-5 ${THEME_CLASSES}`}>
      <figure className="lg:sticky lg:top-24 lg:col-span-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
          <svg
            ref={svgRef}
            role="img"
            aria-label="Animation of a single write: a client Put is committed by the leader cluster's Raft group, acknowledged, pulled by two follower clusters, re-applied through their Raft groups, and then read locally."
            className="block h-auto w-full"
            style={{ fontFamily: 'var(--font-sans), system-ui, sans-serif' }}
          />
        </div>
        <figcaption className="mt-3 flex items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span>Select a step to jump to it.</span>
          <button
            type="button"
            onClick={playing ? pause : play}
            className="rounded-md border border-slate-300 px-2 py-0.5 font-medium text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-white"
          >
            {playing ? 'Pause' : 'Play'}
          </button>
        </figcaption>
      </figure>

      <ol className="space-y-2 lg:col-span-2">
        {STEPS.map((s, i) => {
          const active = i === step;
          return (
            <li key={s.title}>
              <button
                type="button"
                aria-current={active ? 'step' : undefined}
                onClick={() => {
                  seek(s.at + 0.01);
                  setStep(i);
                  stepRef.current = i;
                }}
                className={`flex w-full gap-4 rounded-xl border p-4 text-left transition-colors ${
                  active
                    ? 'border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/40'
                    : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {i + 1}
                </span>
                <span>
                  <span className="mb-1 block font-semibold text-slate-900 dark:text-slate-50">
                    {s.title}
                  </span>
                  <span className="block text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {s.body}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
