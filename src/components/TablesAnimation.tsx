'use client';

import {
  along,
  ease,
  flash,
  particlePool,
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
 * Tables as independent Raft groups. One cluster of three nodes holds a replica of every table;
 * each table elects its own leader, commits on its own, keeps its own revision counter and has
 * its own replication stream to followers. When a node goes down, only the table whose leader
 * was on it pauses for an election; the others keep committing.
 *
 * Leader placement is illustrative: Armada does not balance table leaders across nodes, each
 * table's Raft group simply elects one, so they can land on different nodes.
 */

const TABLES = [
  { name: 'config', color: 'var(--ax-t1)', rev: 12, lag: 0.35 },
  { name: 'flags', color: 'var(--ax-t2)', rev: 87, lag: 0.7 },
  { name: 'sessions', color: 'var(--ax-t3)', rev: 3051, lag: 1.5 },
];
const NODES = ['node 1', 'node 2', 'node 3'];

const LOOP = 17.5;
const DOWN: [number, number] = [8.6, 12.6]; // node 3 is unreachable
const ELECTION: [number, number] = [8.9, 10.3]; // sessions had its leader on node 3
const DOWN_NODE = 2;
const isUp = (n: number, t: number) => !(n === DOWN_NODE && t >= DOWN[0] && t < DOWN[1]);

/** Each table's Raft leader at time t. */
const leaderOf = (table: number, t: number) =>
  table === 2 ? (t < ELECTION[0] ? 2 : t < ELECTION[1] ? -1 : 1) : table;

/** Writes per table. config and flags start together: separate groups commit in parallel. */
const WRITES: { table: number; at: number }[] = [
  { table: 0, at: 0.8 },
  { table: 1, at: 0.8 },
  { table: 2, at: 2.1 },
  { table: 1, at: 3.3 },
  { table: 0, at: 4.6 },
  { table: 2, at: 5.4 },
  { table: 1, at: 6.5 },
  { table: 2, at: 7.0 },
  { table: 0, at: 9.2 }, // during the sessions election
  { table: 1, at: 9.6 },
  { table: 2, at: 11.0 },
  { table: 0, at: 12.2 },
  { table: 2, at: 13.3 },
  { table: 1, at: 13.9 },
  { table: 0, at: 14.6 },
];
const W = { enter: 0.6, rep: [0.7, 1.15], ack: [1.2, 1.55], commit: 1.6, pull: 0.7 } as const;

type Anchor = 'start' | 'middle' | 'end';
type Box = [number, number, number, number];

interface TablesLayout {
  viewBox: [number, number];
  colX: number[];
  laneY: number[];
  cell: [number, number];
  /** Node column panels: top, height and width. */
  panel: { y: number; h: number; w: number; labelY: number; noteY: number };
  leaderBox: Box;
  leaderLabel: [number, number, string];
  followerBox: Box;
  followerLabel: [number, number];
  streamLabel: [number, number, Anchor];
  /** Where a client write starts its way down into the leader cell. */
  entryY: number;
  legend: (i: number) => { dot: [number, number]; name: [number, number]; rev: [number, number] };
  stream: (i: number) => { line: [Pt, Pt]; packet: [Pt, Pt] };
  folCell: (i: number) => {
    box: Box;
    name: [number, number, Anchor];
    rev: [number, number, Anchor];
  };
}

const WIDE: TablesLayout = {
  viewBox: [900, 330],
  colX: [228, 370, 512],
  laneY: [120, 178, 236],
  cell: [116, 38],
  panel: { y: 54, h: 212, w: 132, labelY: 80, noteY: 100 },
  leaderBox: [150, 40, 440, 240],
  leaderLabel: [152, 304, 'LEADER CLUSTER · 3 tables = 3 Raft groups'],
  followerBox: [700, 40, 185, 240],
  followerLabel: [702, 304],
  streamLabel: [645, 72, 'middle'],
  entryY: 8,
  legend: (i) => {
    const y = WIDE.laneY[i];
    return { dot: [24, y - 5], name: [38, y], rev: [38, y + 18] };
  },
  stream: (i) => {
    const y = WIDE.laneY[i];
    return {
      line: [
        [590, y],
        [700, y],
      ],
      packet: [
        [590, y],
        [716, y],
      ],
    };
  },
  folCell: (i) => {
    const y = WIDE.laneY[i];
    return { box: [716, y - 19, 153, 38], name: [730, y + 5, 'start'], rev: [856, y + 5, 'end'] };
  },
};

/** Portrait layout for phones: legend on top, follower cells under the leader cluster. */
const COMPACT: TablesLayout = {
  viewBox: [420, 486],
  colX: [75, 210, 345],
  laneY: [140, 190, 240],
  cell: [108, 36],
  panel: { y: 66, h: 224, w: 122, labelY: 90, noteY: 108 },
  leaderBox: [4, 56, 412, 244],
  leaderLabel: [6, 318, 'LEADER CLUSTER · 3 Raft groups'],
  followerBox: [4, 372, 412, 82],
  followerLabel: [6, 472],
  streamLabel: [142, 330, 'middle'],
  entryY: 46,
  legend: (i) => {
    const x = [14, 150, 286][i];
    return { dot: [x + 6, 18], name: [x + 18, 23], rev: [x + 18, 40] };
  },
  stream: (i) => {
    const x = COMPACT.colX[i];
    const seg: [Pt, Pt] = [
      [x, 300],
      [x, 390],
    ];
    return { line: [seg[0], [x, 372]], packet: seg };
  },
  folCell: (i) => {
    const x = COMPACT.colX[i];
    return { box: [x - 61, 390, 122, 46], name: [x, 408, 'middle'], rev: [x, 426, 'middle'] };
  },
};

function buildTables(svg: SVGSVGElement, LY: TablesLayout) {
  svg.setAttribute('viewBox', `0 0 ${LY.viewBox[0]} ${LY.viewBox[1]}`);
  const { colX: COL_X, laneY: LANE_Y, cell: CELL } = LY;
  const root = svgEl(svg, 'g');
  const gBoxes = svgEl(root, 'g');
  const gParts = svgEl(root, 'g');
  const gLabels = svgEl(root, 'g');
  const parts = particlePool(gParts, 40);
  const text = (x: number, y: number, s: string, a: Record<string, string | number> = {}) =>
    svgEl(gLabels, 'text', { x, y, 'font-size': 13, fill: V.muted, ...a }, s);
  const frame = ([x, y, width, height]: Box, stroke: string) =>
    svgEl(gBoxes, 'rect', { x, y, width, height, rx: 16, fill: 'none', stroke, 'stroke-width': 2 });

  // Clusters
  frame(LY.leaderBox, V.leader);
  text(LY.leaderLabel[0], LY.leaderLabel[1], LY.leaderLabel[2], {
    'font-weight': 600,
    'letter-spacing': 1,
    fill: V.leader,
  });
  frame(LY.followerBox, V.follower);
  text(...LY.followerLabel, 'FOLLOWER CLUSTER', {
    'font-weight': 600,
    'letter-spacing': 1,
    fill: V.follower,
  });
  const [slx, sly, sla] = LY.streamLabel;
  text(slx, sly, 'one stream', { 'text-anchor': sla, 'font-size': 12 });
  text(slx, sly + 15, 'per table', { 'text-anchor': sla, 'font-size': 12 });

  // Node columns
  const nodes = NODES.map((name, n) => {
    const x = COL_X[n];
    const panel = svgEl(gBoxes, 'rect', {
      x: x - LY.panel.w / 2,
      y: LY.panel.y,
      width: LY.panel.w,
      height: LY.panel.h,
      rx: 12,
      fill: V.panel,
      stroke: V.stroke,
      'stroke-width': 1.5,
    });
    const label = text(x, LY.panel.labelY, name, {
      'text-anchor': 'middle',
      'font-weight': 600,
      fill: V.text,
    });
    return { panel, label };
  });

  // Per table: legend + revision, one cell per node, stream, follower cell
  const lanes = TABLES.map((tb, i) => {
    const y = LANE_Y[i];
    const lg = LY.legend(i);
    svgEl(gLabels, 'circle', { cx: lg.dot[0], cy: lg.dot[1], r: 6, fill: tb.color });
    text(...lg.name, tb.name, { 'font-size': 15, 'font-weight': 600, fill: V.text });
    const rev = text(...lg.rev, '', { 'font-size': 12 });

    const cells = COL_X.map((x) => {
      const box = svgEl(gBoxes, 'rect', {
        x: x - CELL[0] / 2,
        y: y - CELL[1] / 2,
        width: CELL[0],
        height: CELL[1],
        rx: 8,
        fill: V.panel,
        stroke: tb.color,
        'stroke-width': 1.5,
      });
      const glow = svgEl(gBoxes, 'rect', {
        x: x - CELL[0] / 2 - 4,
        y: y - CELL[1] / 2 - 4,
        width: CELL[0] + 8,
        height: CELL[1] + 8,
        rx: 11,
        fill: 'none',
        stroke: V.ok,
        'stroke-width': 3,
        opacity: 0,
      });
      const role = text(x, y + 5, '', { 'text-anchor': 'middle', 'font-size': 13 });
      return { at: [x, y] as Pt, box, glow, role };
    });

    const st = LY.stream(i);
    svgEl(gBoxes, 'line', {
      x1: st.line[0][0],
      y1: st.line[0][1],
      x2: st.line[1][0],
      y2: st.line[1][1],
      stroke: tb.color,
      'stroke-width': 2,
      'stroke-dasharray': '6 5',
      opacity: 0.8,
    });
    const fc = LY.folCell(i);
    const [bx, by, bw, bh] = fc.box;
    svgEl(gBoxes, 'rect', {
      x: bx,
      y: by,
      width: bw,
      height: bh,
      rx: 8,
      fill: V.panel,
      stroke: tb.color,
      'stroke-width': 1.5,
    });
    const folGlow = svgEl(gBoxes, 'rect', {
      x: bx - 4,
      y: by - 4,
      width: bw + 8,
      height: bh + 8,
      rx: 11,
      fill: 'none',
      stroke: V.ok,
      'stroke-width': 3,
      opacity: 0,
    });
    text(fc.name[0], fc.name[1], tb.name, {
      'text-anchor': fc.name[2],
      'font-weight': 600,
      fill: V.text,
    });
    const folRev = text(fc.rev[0], fc.rev[1], '', { 'text-anchor': fc.rev[2], 'font-size': 12 });
    return { cells, rev, folRev, folGlow, packet: st.packet };
  });

  const downNote = text(COL_X[DOWN_NODE], LY.panel.noteY, 'unreachable', {
    'text-anchor': 'middle',
    'font-size': 12,
    'font-weight': 600,
    fill: V.error,
    opacity: 0,
  });
  const catchNote = text(COL_X[DOWN_NODE], LY.panel.noteY, 'catching up', {
    'text-anchor': 'middle',
    'font-size': 12,
    'font-weight': 600,
    fill: V.ok,
    opacity: 0,
  });

  /** Packet path between two cells of a lane; hops over the middle cell when skipping it. */
  const hop = (a: Pt, b: Pt, k: number): Pt => {
    const p = along(a, b, k);
    return Math.abs(b[0] - a[0]) > 200 ? [p[0], p[1] - 30 * Math.sin(Math.PI * k)] : p;
  };

  return (t: number) => {
    parts.begin();
    let k: number;
    setAttrs(root, { opacity: Math.min(prog(t, 0, 0.4), 1 - prog(t, LOOP - 0.5, LOOP)) });
    const down = !isUp(DOWN_NODE, t);
    const alive = (n: number) => isUp(n, t);

    const committed = TABLES.map(() => 0);
    const pulled = TABLES.map(() => 0);
    const glow = TABLES.map(() => [0, 0, 0]);
    const folGlow = TABLES.map(() => 0);

    for (const w of WRITES) {
      const lead = leaderOf(w.table, w.at);
      const L = lanes[w.table];
      const from = L.cells[lead].at;
      const color = TABLES[w.table].color;
      const s = w.at;
      // a client write enters at this table's leader
      if ((k = span(t, s, s + W.enter)) >= 0)
        parts.box(
          along([from[0], LY.entryY], [from[0], from[1] - CELL[1] / 2], ease(k)),
          color,
          1.2,
        );
      // replicate to the members that are up; 2 of 3 is still a majority
      const peers = [0, 1, 2].filter((n) => n !== lead && isUp(n, s + W.rep[0]));
      if ((k = span(t, s + W.rep[0], s + W.rep[1])) >= 0)
        peers.forEach((n) => parts.box(hop(from, L.cells[n].at, k), color));
      if ((k = span(t, s + W.ack[0], s + W.ack[1])) >= 0)
        peers.forEach((n) => parts.dot(hop(L.cells[n].at, from, k), V.ok, false, 5));
      const c = s + W.commit;
      if (t >= c) committed[w.table]++;
      [lead, ...peers].forEach((n) => (glow[w.table][n] = Math.max(glow[w.table][n], flash(t, c))));

      // the follower pulls this table on its own stream, at its own pace
      const p0 = c + TABLES[w.table].lag;
      if ((k = span(t, p0, p0 + W.pull)) >= 0) parts.box(along(L.packet[0], L.packet[1], k), color);
      if (t >= p0 + W.pull) pulled[w.table]++;
      folGlow[w.table] = Math.max(folGlow[w.table], flash(t, p0 + W.pull));
    }

    // node 3 comes back and catches up on what it missed, table by table
    const back = DOWN[1];
    TABLES.forEach((_, i) => {
      glow[i][DOWN_NODE] = Math.max(glow[i][DOWN_NODE], flash(t, back + 0.25 + i * 0.2));
    });

    nodes.forEach((nd, n) => {
      const off = !alive(n);
      setAttrs(nd.panel, {
        stroke: off ? V.error : V.stroke,
        'stroke-dasharray': off ? '6 5' : 'none',
        opacity: off ? 0.55 : 1,
      });
    });
    setAttrs(downNote, { opacity: down ? 1 : 0 });
    setAttrs(catchNote, {
      opacity: Math.min(prog(t, back, back + 0.2), 1 - prog(t, back + 1.2, back + 1.5)),
    });

    lanes.forEach((L, i) => {
      const lead = leaderOf(i, t);
      const electing = lead < 0;
      L.cells.forEach((cell, n) => {
        const off = !alive(n);
        let role = 'replica';
        let fill = V.muted;
        let weight = 400;
        if (off) role = '—';
        else if (electing) {
          role = 'electing…';
          fill = V.write;
        } else if (n === lead) {
          role = 'leader';
          fill = TABLES[i].color;
          weight = 700;
        }
        cell.role.textContent = role;
        setAttrs(cell.role, { fill, 'font-weight': weight });
        setAttrs(cell.box, {
          'stroke-width': n === lead ? 3 : 1.5,
          'stroke-dasharray': electing && !off ? '4 4' : 'none',
          opacity: off ? 0.45 : 1,
        });
        setAttrs(cell.glow, { opacity: off ? 0 : glow[i][n] });
      });
      const leaderRev = TABLES[i].rev + committed[i];
      const folRev = TABLES[i].rev + pulled[i];
      L.rev.textContent = `rev ${leaderRev}`;
      L.folRev.textContent = `rev ${folRev}`;
      setAttrs(L.folRev, { fill: folRev < leaderRev ? V.write : V.muted });
      setAttrs(L.folGlow, { opacity: folGlow[i] });
    });

    parts.end();
  };
}

export default function TablesAnimation() {
  const compact = useCompact();
  return <TablesFigure key={compact ? 'compact' : 'wide'} layout={compact ? COMPACT : WIDE} />;
}

function TablesFigure({ layout }: { layout: TablesLayout }) {
  const { svgRef, playing, play, pause } = useTimeline({
    setup: (svg) => buildTables(svg, layout),
    loop: LOOP,
    stillAt: 9.9,
  });

  return (
    <figure className={`mb-8 ${THEME_CLASSES}`}>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
        <svg
          ref={svgRef}
          role="img"
          aria-label="Three tables on a three-node cluster. Each table is its own Raft group with its own leader and revision counter; writes to different tables commit in parallel and replicate on separate streams. When node 3 goes down, only the table whose leader was on node 3 pauses to elect a new leader."
          className="block h-auto w-full"
          style={{ fontFamily: 'var(--font-sans), system-ui, sans-serif' }}
        />
      </div>
      <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <span>
          Leader placement is illustrative: each table elects its own leader, so leaders can sit on
          different nodes.
        </span>
        <button
          type="button"
          onClick={playing ? pause : play}
          className="rounded-md border border-slate-300 px-2 py-0.5 font-medium text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-white"
        >
          {playing ? 'Pause' : 'Play'}
        </button>
      </figcaption>
    </figure>
  );
}
