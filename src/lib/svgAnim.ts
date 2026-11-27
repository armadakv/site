'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

/** Small helpers shared by the time-driven SVG animations (topology, write path). */

export type Pt = [number, number];

const NS = 'http://www.w3.org/2000/svg';

export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
/** Progress of t through [a, b], clamped to 0..1. */
export const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const ease = (x: number) => x * x * (3 - 2 * x);
export const along = (a: Pt, b: Pt, k: number): Pt => [
  a[0] + (b[0] - a[0]) * k,
  a[1] + (b[1] - a[1]) * k,
];
/** Position along a polyline, 0..1 over its whole length. */
export function alongPath(points: Pt[], k: number): Pt {
  if (points.length === 2) return along(points[0], points[1], k);
  const seg = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
  let d = clamp(k) * seg.reduce((a, b) => a + b, 0);
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i] || i === seg.length - 1)
      return along(points[i], points[i + 1], seg[i] ? Math.min(1, d / seg[i]) : 1);
    d -= seg[i];
  }
  return points[points.length - 1];
}

export const polyline = (points: Pt[]) => points.map((p) => p.join(',')).join(' ');

/** 0..1 while t is inside [a, b], otherwise -1. */
export const span = (t: number, a: number, b: number) => (t >= a && t < b ? (t - a) / (b - a) : -1);
/** Decaying flash that starts at `at` and lasts `d` seconds. */
export const flash = (t: number, at: number, d = 0.9) =>
  t >= at ? Math.max(0, 1 - (t - at) / d) : 0;

export type Attrs = Record<string, string | number>;

export function svgEl(parent: Element, tag: string, attrs: Attrs = {}, text?: string): SVGElement {
  const e = document.createElementNS(NS, tag) as SVGElement;
  setAttrs(e, attrs);
  if (text != null) e.textContent = text;
  parent.appendChild(e);
  return e;
}

export function setAttrs(e: Element, attrs: Attrs) {
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
}

/** Theme colours live in CSS custom properties on the wrapper, so light/dark just works. */
export const V = {
  panel: 'var(--ax-panel)',
  stroke: 'var(--ax-stroke)',
  text: 'var(--ax-text)',
  muted: 'var(--ax-muted)',
  leader: 'var(--ax-leader)',
  follower: 'var(--ax-follower)',
  write: 'var(--ax-write)',
  ok: 'var(--ax-ok)',
  read: 'var(--ax-read)',
  error: 'var(--ax-error)',
};

/** Tailwind classes defining the palette above, adaptive to the site's `.dark` class. */
export const THEME_CLASSES =
  '[--ax-panel:#ffffff] [--ax-stroke:#cbd5e1] [--ax-text:#0f172a] [--ax-muted:#64748b] ' +
  '[--ax-leader:#e85a2c] [--ax-follower:#2563eb] [--ax-write:#d97706] [--ax-ok:#059669] ' +
  '[--ax-read:#0284c7] [--ax-error:#dc2626] [--ax-t1:#7c3aed] [--ax-t2:#0d9488] [--ax-t3:#db2777] ' +
  'dark:[--ax-panel:#0f172a] dark:[--ax-stroke:#334155] dark:[--ax-text:#f1f5f9] ' +
  'dark:[--ax-muted:#94a3b8] dark:[--ax-follower:#60a5fa] dark:[--ax-write:#fbbf24] ' +
  'dark:[--ax-ok:#34d399] dark:[--ax-read:#38bdf8] dark:[--ax-error:#f87171] ' +
  'dark:[--ax-t1:#a78bfa] dark:[--ax-t2:#2dd4bf] dark:[--ax-t3:#f472b6]';

/** Fixed dark palette for places that are always dark (the homepage hero). */
export const DARK_THEME_CLASSES =
  '[--ax-panel:#0f172a] [--ax-stroke:#475569] [--ax-text:#f1f5f9] [--ax-muted:#94a3b8] ' +
  '[--ax-leader:#e85a2c] [--ax-follower:#60a5fa] [--ax-write:#fbbf24] [--ax-ok:#34d399] ' +
  '[--ax-read:#38bdf8] [--ax-error:#f87171]';

/** A pool of reusable particles, so a frame never creates DOM nodes. */
export function particlePool(parent: Element, size = 40) {
  const dots = Array.from({ length: size }, () => svgEl(parent, 'circle', { r: 6, opacity: 0 }));
  const boxes = Array.from({ length: size }, () =>
    svgEl(parent, 'rect', { x: -6, y: -6, width: 12, height: 12, rx: 3, opacity: 0 }),
  );
  let di = 0;
  let bi = 0;
  return {
    begin() {
      di = 0;
      bi = 0;
    },
    /** A request or acknowledgement. Hollow dots are polls/questions. */
    dot(pos: Pt, color: string, hollow = false, r = 6) {
      const d = dots[di++];
      if (!d) return;
      setAttrs(d, {
        cx: pos[0],
        cy: pos[1],
        r,
        opacity: 1,
        fill: hollow ? 'none' : color,
        stroke: hollow ? color : 'none',
        'stroke-width': 2.5,
      });
    },
    /** A log entry (data). */
    box(pos: Pt, color: string, scale = 1) {
      const b = boxes[bi++];
      if (!b) return;
      setAttrs(b, {
        transform: `translate(${pos[0]},${pos[1]}) scale(${scale})`,
        fill: color,
        opacity: 1,
      });
    },
    end() {
      for (; di < dots.length; di++) dots[di].setAttribute('opacity', '0');
      for (; bi < boxes.length; bi++) boxes[bi].setAttribute('opacity', '0');
    },
  };
}

interface TimelineOptions {
  /** Builds the scene once and returns a pure `render(t)`. */
  setup: (svg: SVGSVGElement) => (t: number) => void;
  /** Wrap time at this length; omit for an endless clock. */
  loop?: number;
  /** Frame shown (and kept) when the user prefers reduced motion. */
  stillAt: number;
  speed?: number;
  onTick?: (t: number) => void;
}

/**
 * Runs a time-driven SVG animation: rAF clock, pauses while off screen, honours
 * prefers-reduced-motion, and exposes play/pause/seek to the component.
 */
export function useTimeline({ setup, loop, stillAt, speed = 1, onTick }: TimelineOptions) {
  const svgRef = useRef<SVGSVGElement>(null);
  const api = useRef<{ seek: (t: number) => void; setPlaying: (p: boolean) => void } | null>(null);
  const [playing, setPlayingState] = useState(false);
  const opts = useRef({ setup, loop, stillAt, speed, onTick });
  // Keep the latest callbacks without restarting the animation.
  useEffect(() => {
    opts.current = { setup, loop, stillAt, speed, onTick };
  });

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.replaceChildren();
    const o = opts.current;
    const render = o.setup(svg);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let t = reduce ? o.stillAt : 0;
    let playingNow = !reduce;
    let visible = true;
    let last: number | null = null;
    let raf = 0;

    const draw = () => {
      render(t);
      opts.current.onTick?.(t);
    };
    const frame = (now: number) => {
      raf = 0;
      if (last != null) {
        t += Math.min(0.1, (now - last) / 1000) * opts.current.speed;
        if (o.loop) t %= o.loop;
      }
      last = now;
      draw();
      schedule();
    };
    const schedule = () => {
      if (!raf && playingNow && visible) raf = requestAnimationFrame(frame);
    };
    const halt = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      last = null;
    };

    api.current = {
      seek: (to) => {
        t = o.loop ? ((to % o.loop) + o.loop) % o.loop : Math.max(0, to);
        draw();
      },
      setPlaying: (p) => {
        playingNow = p;
        setPlayingState(p);
        if (p) schedule();
        else halt();
      },
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) schedule();
      else halt();
    });
    io.observe(svg);
    setPlayingState(playingNow);
    draw();
    schedule();

    return () => {
      io.disconnect();
      halt();
      api.current = null;
    };
  }, []);

  const seek = useCallback((t: number) => api.current?.seek(t), []);
  const play = useCallback(() => api.current?.setPlaying(true), []);
  const pause = useCallback(() => api.current?.setPlaying(false), []);

  return { svgRef, playing, seek, play, pause };
}

/**
 * Keeps a cluster's role label and its revision badge from colliding. Both sit above the box,
 * left- and right-aligned; when the rendered font makes them wider than the box (`sample` is the
 * widest text the badge will show), the badge moves to its own line above the role label.
 */
export function fitHeaderLabels(
  role: SVGTextElement,
  rev: SVGTextElement,
  boxWidth: number,
  sample: string,
) {
  const baseY = role.getAttribute('y')!;
  const check = () => {
    const prev = rev.textContent;
    rev.textContent = sample;
    const needed = role.getComputedTextLength() + rev.getComputedTextLength() + 12;
    rev.textContent = prev;
    const size = Number(role.getAttribute('font-size') || 13);
    rev.setAttribute('y', needed > boxWidth ? String(Number(baseY) - size - 5) : baseY);
  };
  check();
  // Widths change once the web font has loaded.
  document.fonts?.ready.then(() => {
    if (role.isConnected) check();
  });
}

const COMPACT_QUERY = '(max-width: 639px)';

/**
 * True on phone-sized screens, where the animations switch to a portrait layout so their
 * labels stay readable. Server render and first paint use the wide layout.
 */
export function useCompact() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(COMPACT_QUERY);
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    () => window.matchMedia(COMPACT_QUERY).matches,
    () => false,
  );
}
