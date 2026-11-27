'use client';

import {
  along,
  DARK_THEME_CLASSES,
  fitHeaderLabels,
  flash,
  particlePool,
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
 * Hub-and-spoke topology in motion: writes are committed by the leader cluster's Raft group,
 * every follower pulls them on its own schedule (so followers briefly lag by different amounts),
 * re-applies them through its own Raft group, and serves reads locally. Clients next to the
 * leader read and write it directly; writes that reach a follower are forwarded to the leader.
 */

interface Layout {
  viewBox: [number, number];
  leader: Pt;
  followers: Pt[];
  /** Where each follower's local client sits, relative to the follower. */
  readerOffset: (i: number) => Pt;
  /** Where the leader cluster's own local client sits, relative to the leader. */
  leaderClient: Pt;
  /** Which side of the leader's client its label goes. */
  leaderClientLabel?: 'left' | 'right' | 'below';
  cluster: [number, number];
  nodeGap: number;
  nodeR: number;
  labels: boolean;
  /** Draw the follower's poll request before each pull. */
  polls: boolean;
  writeEvery: number;
  readEvery: number;
}

const SECTION: Layout = {
  viewBox: [720, 400],
  leader: [360, 80],
  followers: [
    [120, 290],
    [360, 290],
    [600, 290],
  ],
  readerOffset: () => [0, 80],
  leaderClient: [-180, 0],
  leaderClientLabel: 'left',
  cluster: [168, 64],
  nodeGap: 44,
  nodeR: 12,
  labels: true,
  polls: true,
  writeEvery: 2.6,
  readEvery: 0.9,
};

/** Portrait layout for phones: two followers so labels stay large enough to read. */
const SECTION_COMPACT: Layout = {
  ...SECTION,
  viewBox: [400, 390],
  leader: [200, 100],
  followers: [
    [105, 280],
    [295, 280],
  ],
  readerOffset: () => [0, 75],
  leaderClient: [-160, 0],
  leaderClientLabel: 'below',
};

const AMBIENT: Layout = (() => {
  const c: Pt = [800, 450];
  const ring = [-150, -95, -30, 30, 95, 150, 210].map((deg, i) => {
    const a = ((deg - 90) * Math.PI) / 180;
    const rx = i % 2 ? 640 : 560;
    const ry = i % 2 ? 330 : 300;
    return [c[0] + Math.cos(a) * rx, c[1] + Math.sin(a) * ry] as Pt;
  });
  return {
    viewBox: [1600, 900],
    leader: c,
    followers: ring,
    readerOffset: (i) => {
      const [x, y] = ring[i];
      const dx = x - c[0];
      const dy = y - c[1];
      const len = Math.hypot(dx, dy);
      return [(dx / len) * 110, (dy / len) * 110];
    },
    leaderClient: [0, -130],
    cluster: [176, 68],
    nodeGap: 46,
    nodeR: 13,
    labels: false,
    polls: false,
    writeEvery: 1.9,
    readEvery: 1.4,
  };
})();

/** Deterministic 0..1 jitter so the same moment always looks the same. */
const jitter = (a: number, b: number) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

function buildTopology(svg: SVGSVGElement, L: Layout) {
  const [W, H] = L.viewBox;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const [cw, ch] = L.cluster;
  const gLines = svgEl(svg, 'g');
  const gClusters = svgEl(svg, 'g');
  const gParts = svgEl(svg, 'g');
  const parts = particlePool(gParts, 48);

  /** Point where the segment from a cluster's centre towards `to` leaves its box. */
  const edge = (c: Pt, to: Pt): Pt => {
    const dx = to[0] - c[0];
    const dy = to[1] - c[1];
    const s = Math.min(cw / 2 / Math.abs(dx || 1e-6), ch / 2 / Math.abs(dy || 1e-6));
    return [c[0] + dx * s, c[1] + dy * s];
  };

  function cluster(c: Pt, color: string, label?: string) {
    const g = svgEl(gClusters, 'g');
    svgEl(g, 'rect', {
      x: c[0] - cw / 2,
      y: c[1] - ch / 2,
      width: cw,
      height: ch,
      rx: 14,
      fill: V.panel,
      stroke: color,
      'stroke-width': 2,
    });
    const nodes = [-1, 0, 1].map((k) => {
      const at: Pt = [c[0] + k * L.nodeGap, c[1]];
      const ring = svgEl(g, 'circle', {
        cx: at[0],
        cy: at[1],
        r: L.nodeR + 5,
        fill: 'none',
        stroke: V.ok,
        'stroke-width': 3,
        opacity: 0,
      });
      svgEl(g, 'circle', {
        cx: at[0],
        cy: at[1],
        r: L.nodeR,
        fill: k === 0 ? color : V.panel,
        stroke: color,
        'stroke-width': 2,
      });
      return ring;
    });
    let rev: SVGElement | null = null;
    if (label && L.labels) {
      const role = svgEl(
        g,
        'text',
        {
          x: c[0] - cw / 2 + 2,
          y: c[1] - ch / 2 - 10,
          'font-size': 13,
          'font-weight': 600,
          'letter-spacing': 1,
          fill: color,
        },
        label,
      );
      rev = svgEl(g, 'text', {
        x: c[0] + cw / 2 - 2,
        y: c[1] - ch / 2 - 10,
        'text-anchor': 'end',
        'font-size': 13,
        'font-weight': 600,
        fill: V.muted,
      });
      fitHeaderLabels(role as SVGTextElement, rev as SVGTextElement, cw, 'rev 0000');
    }
    return { nodes, rev };
  }

  /** A client app in the same region as cluster `c`, talking to it over a short link. */
  function localClient(c: Pt, offset: Pt, labelPos: 'left' | 'right' | 'below' = 'right') {
    const reader: Pt = [c[0] + offset[0], c[1] + offset[1]];
    const readerEdge = edge(c, reader);
    svgEl(gLines, 'line', {
      x1: readerEdge[0],
      y1: readerEdge[1],
      x2: reader[0],
      y2: reader[1],
      stroke: V.stroke,
      'stroke-width': 2,
    });
    svgEl(gClusters, 'circle', {
      cx: reader[0],
      cy: reader[1],
      r: 9,
      fill: V.panel,
      stroke: V.read,
      'stroke-width': 2,
    });
    if (L.labels)
      svgEl(
        gClusters,
        'text',
        {
          x: reader[0] + (labelPos === 'left' ? -16 : labelPos === 'right' ? 16 : 0),
          y: reader[1] + (labelPos === 'below' ? 26 : 4),
          'text-anchor': labelPos === 'left' ? 'end' : labelPos === 'right' ? 'start' : 'middle',
          'font-size': 12,
          fill: V.muted,
        },
        'local clients',
      );
    return { reader, readerEdge };
  }

  const leader = {
    ...cluster(L.leader, V.leader, 'LEADER CLUSTER'),
    ...localClient(L.leader, L.leaderClient, L.leaderClientLabel),
  };
  const followers = L.followers.map((f, i) => {
    const a = edge(f, L.leader);
    const b = edge(L.leader, f);
    svgEl(gLines, 'line', {
      x1: a[0],
      y1: a[1],
      x2: b[0],
      y2: b[1],
      stroke: V.leader,
      'stroke-width': 2,
      'stroke-dasharray': '6 5',
      opacity: 0.55,
    });
    return {
      ...cluster(f, V.follower, 'FOLLOWER'),
      ...localClient(f, L.readerOffset(i)),
      up: a, // follower side of the spoke
      down: b, // leader side of the spoke
    };
  });

  // Distance-based travel time keeps packet speed constant across spokes.
  const travel = followers.map((f) => Math.hypot(f.up[0] - f.down[0], f.up[1] - f.down[1]) / 260);
  const lag = (w: number, i: number) => 0.25 + jitter(w, i) * 1.3;
  const N = followers.length;
  const BASE_REV = 1040;
  const COMMIT_AT = 0.9;

  return (t: number) => {
    parts.begin();
    const wNow = Math.floor(t / L.writeEvery);
    // Commits are evenly spaced; a write is committed `COMMIT_AT` into its slot.
    const committed = t < COMMIT_AT ? 0 : Math.floor((t - COMMIT_AT) / L.writeEvery) + 1;
    // Writes older than this window have reached every follower (lag + travel < 3 slots).
    const from = Math.max(0, wNow - 4);
    const applied = new Array(N).fill(from);
    const rings = followers.map(() => [0, 0, 0]);
    let leaderFlash = 0;

    for (let w = from; w <= wNow + 1; w++) {
      const commit = w * L.writeEvery + COMMIT_AT;
      leaderFlash = Math.max(leaderFlash, flash(t, commit));

      // Even writes come from the leader's own clients; odd ones are made by a follower's
      // local client and forwarded to the leader.
      const via = w % 2 === 1 ? (w * 3) % N : -1;
      if (via < 0) {
        const kl = span(t, commit - 0.6, commit - 0.05);
        if (kl >= 0) parts.box(along(leader.reader, leader.readerEdge, kl), V.write, 0.8);
      } else {
        const f = followers[via];
        const upAt = commit - 0.3 - travel[via];
        const kc = span(t, upAt - 0.5, upAt);
        if (kc >= 0) parts.box(along(f.reader, f.readerEdge, kc), V.write, 0.8);
        const ku = span(t, upAt, commit - 0.3);
        if (ku >= 0) parts.box(along(f.up, f.down, ku), V.write);
      }

      followers.forEach((f, i) => {
        const pullAt = commit + lag(w, i);
        if (L.polls) {
          const kp = span(t, pullAt - travel[i], pullAt);
          if (kp >= 0) parts.dot(along(f.up, f.down, kp), V.follower, true, 5);
        }
        const kd = span(t, pullAt, pullAt + travel[i]);
        if (kd >= 0) parts.box(along(f.down, f.up, kd), V.leader);
        const arrive = pullAt + travel[i];
        if (t >= arrive) applied[i] = w + 1;
        // the follower re-applies the entry through its own Raft group: its leader first
        rings[i] = rings[i].map((v, j) =>
          Math.max(v, flash(t, arrive + (j === 1 ? 0 : 0.18), 0.8)),
        );
      });
    }

    leader.nodes.forEach((ring, j) =>
      ring.setAttribute('opacity', String(j === 1 ? leaderFlash : Math.max(0, leaderFlash - 0.15))),
    );
    followers.forEach((f, i) =>
      f.nodes.forEach((ring, j) => ring.setAttribute('opacity', String(rings[i][j]))),
    );

    // Each follower's revision trails the leader's until its pull lands.
    if (leader.rev) leader.rev.textContent = `rev ${BASE_REV + committed}`;
    followers.forEach((f, i) => {
      if (!f.rev) return;
      const rev = Math.min(applied[i], committed);
      f.rev.textContent = `rev ${BASE_REV + rev}`;
      setAttrs(f.rev, { fill: rev < committed ? V.write : V.muted });
    });

    // Local reads: short round trips that never leave the client's region.
    [leader, ...followers].forEach((f, i) => {
      const phase = jitter(i, 7) * L.readEvery;
      const r0 = Math.floor((t - phase) / L.readEvery);
      for (let r = r0 - 1; r <= r0; r++) {
        const start = r * L.readEvery + phase;
        const u = (t - start) / 0.7;
        if (u < 0 || u >= 1) continue;
        if (u < 0.5) parts.dot(along(f.reader, f.readerEdge, u * 2), V.read, false, 4.5);
        else parts.dot(along(f.readerEdge, f.reader, (u - 0.5) * 2), V.ok, false, 4.5);
      }
    });
    parts.end();
  };
}

/** Animated diagram for the Hub-and-Spoke section of /architecture. */
export function TopologyAnimation() {
  const compact = useCompact();
  return (
    <TopologyFigure
      key={compact ? 'compact' : 'wide'}
      layout={compact ? SECTION_COMPACT : SECTION}
    />
  );
}

function TopologyFigure({ layout }: { layout: Layout }) {
  const { svgRef, playing, play, pause } = useTimeline({
    setup: (svg) => buildTopology(svg, layout),
    stillAt: 3.2,
  });

  return (
    <figure className={`mx-auto mb-10 max-w-2xl ${THEME_CLASSES}`}>
      <svg
        ref={svgRef}
        role="img"
        aria-label="Hub-and-spoke topology: a leader cluster of three Raft nodes commits writes; three follower clusters pull them asynchronously, each lagging a little, and serve reads locally."
        className="block h-auto w-full"
        style={{ fontFamily: 'var(--font-sans), system-ui, sans-serif' }}
      />
      <figcaption className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
        <Legend shape="box" color="bg-[var(--ax-leader)]" label="log entry pulled by a follower" />
        <Legend shape="box" color="bg-[var(--ax-write)]" label="write forwarded to the leader" />
        <Legend shape="dot" color="bg-[var(--ax-read)]" label="local read" />
        <button
          type="button"
          onClick={playing ? pause : play}
          className="rounded-md border border-slate-300 px-2 py-0.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-white"
        >
          {playing ? 'Pause' : 'Play'}
        </button>
      </figcaption>
    </figure>
  );
}

function Legend({ shape, color, label }: { shape: 'box' | 'dot'; color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className={`inline-block h-2.5 w-2.5 ${shape === 'dot' ? 'rounded-full' : 'rounded-[3px]'} ${color}`}
      />
      {label}
    </span>
  );
}

/**
 * The same topology, spread radially and heavily dimmed, as a decorative backdrop for the
 * homepage hero. Hidden from assistive tech and never intercepts the pointer.
 */
export function TopologyBackdrop() {
  const { svgRef } = useTimeline({
    setup: (svg) => buildTopology(svg, AMBIENT),
    stillAt: 3.2,
    speed: 0.6,
  });

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_78%)] opacity-25 ${DARK_THEME_CLASSES}`}
    >
      <svg ref={svgRef} preserveAspectRatio="xMidYMid slice" className="h-full w-full" />
    </div>
  );
}
