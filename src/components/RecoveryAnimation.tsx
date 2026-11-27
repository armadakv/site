'use client';

import { useRef, useState } from 'react';
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
 * Snapshot recovery of one table on a follower that fell below the leader's GC horizon, in the
 * three ways a deployment can be wired:
 *
 *  - `none`:   the leader has no shared store and streams a live, on-demand snapshot. A live
 *              snapshot has no stable identity, so an interrupted transfer starts over.
 *  - `proxy`:  the leader exports artefacts to its own store; the follower queries the leader
 *              and downloads through the leader's HTTP endpoint, resuming with Range.
 *  - `direct`: both clusters reach the same bucket; the follower resolves the artefact, holds
 *              the GC lease and downloads straight from the bucket.
 *
 * In every mode the artefact is loaded into a separate recovery shard, its peers join as Raft
 * learners and are promoted, the shard is swapped in, and log replication resumes. The old
 * shard keeps serving (stale) reads until the swap.
 */

export type RecoveryMode = 'none' | 'proxy' | 'direct';

export const MODES: {
  id: RecoveryMode;
  label: string;
  config: string[];
  body: string;
}[] = [
  {
    id: 'none',
    label: 'No shared store',
    config: ['leader: --shared-store.backend=none'],
    body: 'The leader keeps no stored snapshots. On request it builds a live snapshot of the table and streams it from its HTTP endpoint. Nothing extra to run, but every recovery costs the leader a fresh snapshot, and an interrupted live transfer starts over from zero.',
  },
  {
    id: 'proxy',
    label: 'Store on the leader',
    config: [
      'leader: --shared-store.backend=s3 | gcs | azblob | filesystem',
      'follower: --replication.snapshot-source=proxy (what auto picks without a store)',
    ],
    body: 'The leader exports full and incremental snapshots to its own store ahead of time, for example a bucket or an NFS mount only it can reach. The follower asks the leader which artefact to use and downloads it through the leader’s HTTP endpoint, resuming with a Range request after a drop. With S3, GCS or Azure the leader can answer with a redirect to a pre-signed URL, so the bytes come from the bucket.',
  },
  {
    id: 'direct',
    label: 'Shared object store',
    config: [
      'both: --shared-store.backend=s3 | gcs | azblob | filesystem',
      'follower: --replication.snapshot-source=direct (what auto picks with a store)',
    ],
    body: 'Both clusters reach the same store. The follower picks the artefact, holds the GC lease and downloads straight from the store, so the leader is out of the data path and many followers can recover in parallel. The leader is still asked for a live snapshot if no stored artefact applies.',
  },
];

const PHASES = ['Detect', 'Choose snapshot', 'Download', 'Load', 'Learners', 'Swap', 'Tail log'];

/** Phase start times for a mode. Downloads of a live snapshot take longer (they restart). */
function timeline(mode: RecoveryMode) {
  const d = mode === 'none' ? 1.4 : 0;
  const E = 8.4 + d; // download finished
  return {
    publish: [0.4, 1.3] as const,
    tryTail: [1.4, 2.1] as const,
    refuse: [2.2, 2.9] as const,
    query: [3.0, 3.6] as const,
    answer: [3.6, 4.2] as const,
    build: [4.0, 4.6] as const,
    dl: [4.6, E] as const,
    drop: [6.0, 6.7] as const,
    load: [E + 0.1, E + 0.9] as const,
    learn: [E + 0.9, E + 2.4] as const,
    swap: [E + 2.6, E + 3.3] as const,
    tail: [E + 3.5, E + 5.3] as const,
    end: E + 6,
    phases: [0, 3.0, 4.6, E + 0.1, E + 0.9, E + 2.6, E + 3.5],
  };
}

export const phaseAt = (mode: RecoveryMode, t: number) =>
  timeline(mode).phases.reduce((acc, s, i) => (t >= s ? i : acc), 0);

type Anchor = 'start' | 'middle' | 'end';
type Spot = [number, number, Anchor];
type Box = [number, number, number, number];

interface RecoveryLayout {
  viewBox: [number, number];
  leaderRegion: Box;
  followerRegion: Box;
  leaderBox: Box;
  leaderNodes: { x: number[]; y: number };
  leadNote: Pt;
  followerBox: Box;
  rows: { serving: number; recovery: number };
  nodeX: number[];
  bar: [number, number]; // x, width
  client: Pt;
  tail: [Pt, Pt];
  tailLabel: Spot;
  tailNote: Spot;
  shortNotes: boolean;
  snap: [Pt, Pt];
  snapLabel: Spot;
  proxyStore: Pt;
  proxyUp: [Pt, Pt];
  directStore: Pt;
  directToLeader: [Pt, Pt];
  directToFollower: [Pt, Pt];
  directLabel: Spot;
  storeNote: (mode: RecoveryMode, store: Pt) => Spot;
}

const WIDE: RecoveryLayout = {
  viewBox: [900, 430],
  leaderRegion: [20, 40, 310, 370],
  followerRegion: [570, 40, 310, 370],
  leaderBox: [50, 90, 250, 100],
  leaderNodes: { x: [110, 175, 240], y: 150 },
  leadNote: [175, 212],
  followerBox: [600, 90, 260, 240],
  rows: { serving: 155, recovery: 265 },
  nodeX: [665, 730, 795],
  bar: [640, 180],
  client: [730, 380],
  tail: [
    [300, 130],
    [600, 130],
  ],
  tailLabel: [450, 122, 'middle'],
  tailNote: [450, 152, 'middle'],
  shortNotes: false,
  snap: [
    [300, 175],
    [600, 265],
  ],
  snapLabel: [440, 245, 'end'],
  proxyStore: [175, 300],
  proxyUp: [
    [175, 276],
    [175, 190],
  ],
  directStore: [450, 330],
  directToLeader: [
    [300, 188],
    [410, 312],
  ],
  directToFollower: [
    [496, 318],
    [600, 275],
  ],
  directLabel: [505, 352, 'start'],
  storeNote: (_, [x, y]) => [x, y + 86, 'middle'],
};

/** Portrait layout for phones: leader region on top, follower region below. */
const COMPACT: RecoveryLayout = {
  viewBox: [420, 830],
  leaderRegion: [10, 30, 400, 300],
  followerRegion: [10, 480, 400, 340],
  leaderBox: [85, 70, 250, 100],
  leaderNodes: { x: [145, 210, 275], y: 130 },
  leadNote: [210, 192],
  followerBox: [70, 520, 280, 240],
  rows: { serving: 585, recovery: 695 },
  nodeX: [145, 210, 275],
  bar: [120, 180],
  client: [210, 795],
  tail: [
    [100, 170],
    [100, 520],
  ],
  tailLabel: [108, 350, 'start'],
  tailNote: [108, 370, 'start'],
  shortNotes: true,
  snap: [
    [320, 170],
    [320, 520],
  ],
  snapLabel: [312, 420, 'end'],
  proxyStore: [210, 250],
  proxyUp: [
    [210, 226],
    [210, 170],
  ],
  directStore: [330, 405],
  directToLeader: [
    [320, 170],
    [330, 371],
  ],
  directToFollower: [
    [330, 439],
    [330, 520],
  ],
  directLabel: [322, 500, 'end'],
  storeNote: (mode, [x, y]) => (mode === 'proxy' ? [266, y + 4, 'start'] : [x - 54, y + 4, 'end']),
};

function buildRecovery(svg: SVGSVGElement, mode: RecoveryMode, RL: RecoveryLayout) {
  svg.setAttribute('viewBox', `0 0 ${RL.viewBox[0]} ${RL.viewBox[1]}`);
  const T = timeline(mode);
  const root = svgEl(svg, 'g');
  const gBack = svgEl(root, 'g');
  const gFront = svgEl(root, 'g');
  const gParts = svgEl(root, 'g');
  const gLabels = svgEl(root, 'g');
  const parts = particlePool(gParts, 50);
  const text = (x: number, y: number, s: string, a: Record<string, string | number> = {}) =>
    svgEl(gLabels, 'text', { x, y, 'font-size': 13, fill: V.muted, ...a }, s);
  const spot = ([x, y, anchor]: Spot, s: string, a: Record<string, string | number> = {}) =>
    text(x, y, s, { 'text-anchor': anchor, ...a });
  const rect = (g: Element, [x, y, w, h]: Box, a: Record<string, string | number>) =>
    svgEl(g, 'rect', { x, y, width: w, height: h, rx: 14, ...a });
  const line = (a: Pt, b: Pt, extra: Record<string, string | number> = {}) =>
    svgEl(gBack, 'line', {
      x1: a[0],
      y1: a[1],
      x2: b[0],
      y2: b[1],
      stroke: V.stroke,
      'stroke-width': 2,
      ...extra,
    });

  // Regions
  const region = { fill: 'none', stroke: V.stroke, 'stroke-dasharray': '4 6' };
  rect(gBack, RL.leaderRegion, region);
  rect(gBack, RL.followerRegion, region);
  text(RL.leaderRegion[0] + 12, RL.leaderRegion[1] + 22, 'LEADER REGION', {
    'font-size': 12,
    'letter-spacing': 1,
  });
  text(RL.followerRegion[0] + 12, RL.followerRegion[1] + 22, 'FOLLOWER REGION', {
    'font-size': 12,
    'letter-spacing': 1,
  });

  // Leader cluster
  rect(gFront, RL.leaderBox, { fill: V.panel, stroke: V.leader, 'stroke-width': 2 });
  text(RL.leaderBox[0] + 12, RL.leaderBox[1] + 22, 'leader cluster', {
    'font-weight': 600,
    fill: V.leader,
  });
  const leadNodes = RL.leaderNodes.x.map((x, i) => {
    const y = RL.leaderNodes.y;
    const ring = svgEl(gFront, 'circle', {
      cx: x,
      cy: y,
      r: 20,
      fill: 'none',
      stroke: V.ok,
      'stroke-width': 3,
      opacity: 0,
    });
    svgEl(gFront, 'circle', {
      cx: x,
      cy: y,
      r: 14,
      fill: i === 1 ? V.leader : V.panel,
      stroke: V.leader,
      'stroke-width': 2,
    });
    return ring;
  });
  const leadNote = text(...RL.leadNote, '', { 'text-anchor': 'middle', 'font-weight': 600 });

  // Follower cluster: serving shard on top, recovery shard below
  const [fx, fy, fw, fh] = RL.followerBox;
  rect(gFront, RL.followerBox, { fill: V.panel, stroke: V.follower, 'stroke-width': 2 });
  text(fx + 12, fy + 22, 'follower cluster', { 'font-weight': 600, fill: V.follower });
  const ROW = RL.rows;
  const NX = RL.nodeX;
  const gOld = svgEl(gFront, 'g');
  const gNew = svgEl(gFront, 'g');
  const shardRow = (g: Element, y: number, name: string) => {
    const label = svgEl(g, 'text', { x: fx + 12, y: y - 26, 'font-size': 12, fill: V.muted }, name);
    const nodes = NX.map((x) => {
      const ring = svgEl(g, 'circle', {
        cx: x,
        cy: y,
        r: 18,
        fill: 'none',
        stroke: V.ok,
        'stroke-width': 3,
        opacity: 0,
      });
      const body = svgEl(g, 'circle', {
        cx: x,
        cy: y,
        r: 12,
        fill: V.panel,
        stroke: V.follower,
        'stroke-width': 2,
      });
      return { ring, body, at: [x, y] as Pt };
    });
    const rev = svgEl(g, 'text', {
      x: fx + fw - 12,
      y: y - 26,
      'text-anchor': 'end',
      'font-size': 12,
      'font-weight': 600,
      fill: V.muted,
    });
    return { label, nodes, rev };
  };
  const old = shardRow(gOld, ROW.serving, 'serving shard');
  const neu = shardRow(gNew, ROW.recovery, 'recovery shard');
  const [barX, barW] = RL.bar;
  const barTrack = rect(gNew, [barX, ROW.recovery + 28, barW, 8], {
    rx: 4,
    fill: V.stroke,
    opacity: 0.5,
  });
  const bar = rect(gNew, [barX, ROW.recovery + 28, 0, 8], { rx: 4, fill: V.follower });
  const neuNote = svgEl(gNew, 'text', {
    x: NX[1],
    y: ROW.recovery + 54,
    'text-anchor': 'middle',
    'font-size': 12,
    'font-weight': 600,
    fill: V.muted,
  });

  // Local client keeps reading from whichever shard is serving
  const client = RL.client;
  const clientFrom: Pt = [client[0], fy + fh];
  line(clientFrom, [client[0], client[1] - 10]);
  svgEl(gFront, 'circle', {
    cx: client[0],
    cy: client[1],
    r: 10,
    fill: V.panel,
    stroke: V.read,
    'stroke-width': 2,
  });
  const readNote = text(client[0] + 18, client[1] + 4, '', { 'font-size': 12 });

  // Links between the clusters
  const TAIL = RL.tail;
  line(...TAIL, { stroke: V.leader, 'stroke-dasharray': '6 5', opacity: 0.7 });
  spot(RL.tailLabel, 'Log.Replicate', { 'font-size': 12, fill: V.leader });
  const tailNote = spot(RL.tailNote, '', { 'font-weight': 600 });

  const SNAP = RL.snap;
  // Where the follower fetches the snapshot from, and how artefacts get there
  let fetchPath: Pt[][]; // chain of segments a chunk travels
  let queryTo: [Pt, Pt]; // where "which artefact?" goes
  let publishPath: [Pt, Pt] | null = null;
  let leaseAt: Pt | null = null;
  const storeAt: Pt | null =
    mode === 'proxy' ? RL.proxyStore : mode === 'direct' ? RL.directStore : null;

  if (storeAt) {
    const [sx, sy] = storeAt;
    // cylinder
    svgEl(gFront, 'path', {
      d: `M ${sx - 46} ${sy - 22} v 44 a 46 12 0 0 0 92 0 v -44`,
      fill: V.panel,
      stroke: V.muted,
      'stroke-width': 2,
    });
    svgEl(gFront, 'ellipse', {
      cx: sx,
      cy: sy - 22,
      rx: 46,
      ry: 12,
      fill: V.panel,
      stroke: V.muted,
      'stroke-width': 2,
    });
    text(sx, sy + 52, mode === 'proxy' ? 'object store / NFS' : 'shared object store', {
      'text-anchor': 'middle',
      'font-weight': 600,
      fill: V.text,
    });
    text(sx, sy + 68, mode === 'proxy' ? 'reachable from the leader' : 'reachable from both', {
      'text-anchor': 'middle',
      'font-size': 12,
    });
    leaseAt = [sx, sy + 6];
  }

  if (mode === 'none') {
    line(...SNAP, { 'stroke-dasharray': '2 5' });
    spot(RL.snapLabel, 'HTTP · live snapshot', { 'font-size': 12 });
    fetchPath = [SNAP];
    queryTo = [SNAP[1], SNAP[0]];
  } else if (mode === 'proxy') {
    const up = RL.proxyUp;
    line(...up);
    line(...SNAP, { 'stroke-dasharray': '2 5' });
    spot(RL.snapLabel, 'HTTP · Range, resumable', { 'font-size': 12 });
    publishPath = [up[1], up[0]];
    // store -> leader -> follower: the leader proxies the bytes
    fetchPath = [up, [up[1], SNAP[0]], SNAP];
    queryTo = [SNAP[1], SNAP[0]];
  } else {
    const toLeader = RL.directToLeader;
    const toFollower = RL.directToFollower;
    line(...toLeader);
    line(...toFollower);
    spot(RL.directLabel, 'direct, resumable', { 'font-size': 12 });
    publishPath = toLeader;
    fetchPath = [[toFollower[0], toFollower[1]]];
    queryTo = [toFollower[1], toFollower[0]];
  }
  const leaseNote = leaseAt
    ? text(leaseAt[0], leaseAt[1], 'GC lease held', {
        'text-anchor': 'middle',
        'font-size': 12,
        'font-weight': 600,
        fill: V.write,
        opacity: 0,
      })
    : null;
  const storeNote = storeAt
    ? spot(RL.storeNote(mode, storeAt), '', { 'font-size': 12, 'font-weight': 600 })
    : null;

  /** Position along a chain of segments, 0..1 over the whole chain (by length). */
  const lengths = fetchPath.map(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1]));
  const total = lengths.reduce((a, b) => a + b, 0);
  const chain = (k: number): Pt => {
    let d = k * total;
    for (let i = 0; i < fetchPath.length; i++) {
      if (d <= lengths[i] || i === fetchPath.length - 1)
        return along(fetchPath[i][0], fetchPath[i][1], Math.min(1, d / lengths[i]));
      d -= lengths[i];
    }
    return fetchPath[0][0];
  };

  /** Download progress 0..1, honouring the drop and, for a live snapshot, the restart. */
  const ACTIVE = 3.1; // seconds of transfer for a whole snapshot
  const progress = (t: number) => {
    const [a, b] = T.dl;
    const [da, db] = T.drop;
    if (t < a) return 0;
    if (t < da) return (t - a) / ACTIVE;
    if (t < db) return mode === 'none' ? 0 : (da - a) / ACTIVE;
    if (mode === 'none') return Math.min(1, (t - db) / ACTIVE);
    return Math.min(1, (da - a + Math.min(t, b) - db) / ACTIVE);
  };

  const BASE = 1200; // where the follower got stuck
  const SNAP_REV = 5400; // the artefact's tip
  const LEADER_REV = 5402;

  return (t: number) => {
    parts.begin();
    let k: number;
    setAttrs(root, { opacity: Math.min(prog(t, 0, 0.4), 1 - prog(t, T.end - 0.5, T.end)) });

    // 0. artefacts are published ahead of time when there is a store
    if (publishPath && (k = span(t, ...T.publish)) >= 0)
      parts.box(along(publishPath[0], publishPath[1], ease(k)), V.leader, 1.2);
    if (storeNote) {
      storeNote.textContent = RL.shortNotes
        ? 'full + incr. artefacts'
        : 'full + incremental artefacts';
      setAttrs(storeNote, { opacity: prog(t, T.publish[1], T.publish[1] + 0.3), fill: V.leader });
    }

    // 1. the follower asks for entries after 1200, but they are below the GC horizon
    if ((k = span(t, ...T.tryTail)) >= 0) parts.dot(along(TAIL[1], TAIL[0], k), V.follower, true);
    if ((k = span(t, ...T.refuse)) >= 0) parts.dot(along(TAIL[0], TAIL[1], k), V.error);
    const swapped = t >= T.swap[1];
    if (t >= T.refuse[0] && t < T.query[1] + 0.4) {
      tailNote.textContent = RL.shortNotes
        ? 'below GC horizon → snapshot'
        : 'below the GC horizon → use a snapshot';
      setAttrs(tailNote, { fill: V.error, opacity: 1 });
    } else if (t >= T.tail[0]) {
      tailNote.textContent = `tailing again from ${SNAP_REV + 1}`;
      setAttrs(tailNote, { fill: V.ok, opacity: 1 });
    } else setAttrs(tailNote, { opacity: 0 });

    // 2. which snapshot? asked of the leader, or read from the bucket in direct mode
    if ((k = span(t, ...T.query)) >= 0)
      parts.dot(along(queryTo[0], queryTo[1], k), V.follower, true);
    if ((k = span(t, ...T.answer)) >= 0) parts.dot(along(queryTo[1], queryTo[0], k), V.ok);
    const building = mode === 'none' ? flash(t, T.build[0], 1.4) : 0;
    leadNodes.forEach((r) => setAttrs(r, { opacity: building }));
    const leaseOn = t >= T.answer[1] && t < T.dl[1] + 0.2;
    if (leaseNote) setAttrs(leaseNote, { opacity: leaseOn ? 1 : 0 });
    if (mode === 'none' && t >= T.build[0] && t < T.dl[1]) {
      const again = t >= T.drop[0] && t < T.drop[1] + 1.2;
      leadNote.textContent = again ? 'building it again' : 'serving a live snapshot';
      if (t < T.dl[0]) leadNote.textContent = 'building a live snapshot';
      setAttrs(leadNote, { fill: V.leader, opacity: 1 });
    } else setAttrs(leadNote, { opacity: 0 });

    // 3. download, with one dropped connection
    const pr = progress(t);
    const dropping = t >= T.drop[0] && t < T.drop[1];
    if (t >= T.dl[0] && t < T.dl[1] && !dropping) {
      for (let c = 0; c < 8; c++) {
        const u = ((t - T.dl[0]) / 1.1 + c / 8) % 1;
        parts.box(chain(u), V.leader, 0.8);
      }
    }
    setAttrs(bar, { width: barW * pr });
    const showBar = t >= T.dl[0] - 0.2 && t < T.load[1];
    setAttrs(barTrack, { opacity: showBar ? 0.5 : 0 });
    setAttrs(bar, { opacity: showBar ? 1 : 0 });
    let nn = '';
    let nf = V.muted;
    if (dropping) {
      nn = mode === 'none' ? 'connection dropped · starting over' : 'connection dropped';
      nf = V.error;
    } else if (t >= T.drop[1] && t < T.drop[1] + 1.2 && t < T.dl[1]) {
      nn = mode === 'none' ? 'live snapshot restarts from 0' : 'resumed from the last checkpoint';
      nf = mode === 'none' ? V.write : V.ok;
    } else if (t >= T.dl[0] && t < T.dl[1]) nn = `downloading · ${Math.round(pr * 100)}%`;
    else if (t >= T.load[0] && t < T.load[1])
      nn = mode === 'none' ? 'one node loads it' : 'verified (size, SHA-256) · one node loads it';
    else if (t >= T.learn[0] && t < T.learn[1]) nn = 'peers join as learners, catch up';
    else if (t >= T.learn[1] && t < T.swap[0]) nn = 'learners promoted to voters';
    neuNote.textContent = nn;
    setAttrs(neuNote, { fill: nf });

    // 4. load into one node, 5. learners catch up and get promoted
    const loaded = t >= T.load[1];
    neu.nodes.forEach((n, i) => {
      const present = i === 0 ? t >= T.dl[0] - 0.2 : t >= T.learn[0];
      const voter = i === 0 ? loaded : t >= T.learn[1];
      setAttrs(n.body, {
        opacity: present ? 1 : 0.25,
        'stroke-dasharray': voter ? 'none' : '3 3',
        fill: i === 0 && loaded ? V.follower : V.panel,
      });
      const f = i === 0 ? flash(t, T.load[1], 1) : flash(t, T.learn[1] - 0.3 + i * 0.15, 1);
      setAttrs(n.ring, { opacity: f });
    });
    if ((k = span(t, T.learn[0] + 0.2, T.learn[0] + 1.0)) >= 0) {
      parts.box(along(neu.nodes[0].at, neu.nodes[1].at, k), V.follower, 0.8);
      parts.box(along(neu.nodes[0].at, neu.nodes[2].at, k), V.follower, 0.8);
    }
    neu.label.textContent = swapped ? 'serving shard' : 'recovery shard';
    neu.rev.textContent =
      t >= T.load[1] ? `rev ${swapped && t >= T.tail[1] ? LEADER_REV : SNAP_REV}` : '';
    setAttrs(neu.rev, { fill: swapped ? V.ok : V.muted });
    setAttrs(gNew, { opacity: t >= T.dl[0] - 0.4 ? 1 : 0.35 });

    // old shard keeps serving stale reads until the swap
    old.nodes.forEach((n) => setAttrs(n.body, { fill: V.panel }));
    old.rev.textContent = `rev ${BASE}`;
    setAttrs(old.rev, { fill: t >= T.refuse[1] ? V.write : V.muted });

    // 6. swap: the recovery shard becomes the serving shard
    const sw = ease(prog(t, T.swap[0], T.swap[1]));
    setAttrs(gNew, { transform: `translate(0, ${(ROW.serving - ROW.recovery) * sw})` });
    setAttrs(gOld, { opacity: 1 - sw });

    // 7. tail the log again
    for (let e = 0; e < 2; e++)
      if ((k = span(t, T.tail[0] + 0.3 + e * 0.6, T.tail[0] + 1.1 + e * 0.6)) >= 0)
        parts.box(along(TAIL[0], TAIL[1], ease(k)), V.leader);

    // reads never stop
    for (let r = 0; ; r++) {
      const s = 0.6 + r * 0.55;
      if (s > T.end - 0.8) break;
      const u = (t - s) / 0.6;
      if (u < 0 || u >= 1) continue;
      const top = clientFrom;
      if (u < 0.5) parts.dot(along(client, top, u * 2), V.read, false, 4.5);
      else parts.dot(along(top, client, (u - 0.5) * 2), V.ok, false, 4.5);
    }
    const stale = t >= T.refuse[1] && !swapped;
    readNote.textContent = stale ? 'reads keep working (stale)' : 'local reads';
    setAttrs(readNote, { fill: stale ? V.write : V.muted });

    parts.end();
  };
}

function RecoveryScene({
  mode,
  onPhase,
}: {
  mode: RecoveryMode;
  onPhase: (phase: number) => void;
}) {
  const compact = useCompact();
  return (
    <RecoverySvg
      key={compact ? 'compact' : 'wide'}
      mode={mode}
      layout={compact ? COMPACT : WIDE}
      onPhase={onPhase}
    />
  );
}

function RecoverySvg({
  mode,
  layout,
  onPhase,
}: {
  mode: RecoveryMode;
  layout: RecoveryLayout;
  onPhase: (phase: number) => void;
}) {
  const last = useRef(-1);
  const { svgRef, playing, play, pause } = useTimeline({
    setup: (svg) => buildRecovery(svg, mode, layout),
    loop: timeline(mode).end,
    stillAt: timeline(mode).learn[0] + 0.4,
    onTick: (t) => {
      const p = phaseAt(mode, t);
      if (p !== last.current) {
        last.current = p;
        onPhase(p);
      }
    },
  });
  return (
    <>
      <svg
        ref={svgRef}
        role="img"
        aria-label={`Snapshot recovery of a follower, ${MODES.find((m) => m.id === mode)!.label.toLowerCase()} mode.`}
        className="block h-auto w-full"
        style={{ fontFamily: 'var(--font-sans), system-ui, sans-serif' }}
      />
      <button
        type="button"
        onClick={playing ? pause : play}
        className="absolute top-3 right-3 rounded-md border border-slate-300 bg-white/80 px-2 py-0.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-white"
      >
        {playing ? 'Pause' : 'Play'}
      </button>
    </>
  );
}

export default function RecoveryAnimation() {
  const [mode, setMode] = useState<RecoveryMode>('none');
  const [phase, setPhase] = useState(0);
  const current = MODES.find((m) => m.id === mode)!;

  return (
    <figure className={`mb-8 ${THEME_CLASSES}`}>
      <div role="tablist" aria-label="Snapshot source" className="mb-3 flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={m.id === mode}
            onClick={() => {
              setMode(m.id);
              setPhase(0);
            }}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              m.id === mode
                ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300'
                : 'border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-white'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="relative rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
        <RecoveryScene key={mode} mode={mode} onPhase={setPhase} />
      </div>

      <ol className="mt-3 flex flex-wrap gap-x-1 gap-y-2 text-xs" aria-label="Recovery phases">
        {PHASES.map((p, i) => (
          <li
            key={p}
            aria-current={i === phase ? 'step' : undefined}
            className={`rounded-full px-2.5 py-1 transition-colors ${
              i === phase
                ? 'bg-blue-600 text-white'
                : i < phase
                  ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  : 'text-slate-500 dark:text-slate-500'
            }`}
          >
            {i + 1}. {p}
          </li>
        ))}
      </ol>

      <figcaption className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        <p>{current.body}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {current.config.map((c) => (
            <code
              key={c}
              className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              {c}
            </code>
          ))}
        </div>
      </figcaption>
    </figure>
  );
}
