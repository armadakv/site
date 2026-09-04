'use client';

import { useEffect, useId, useState } from 'react';

interface MermaidDiagramProps {
  chart: string;
}

function isDarkMode(): boolean {
  if (typeof document === 'undefined') return true;
  return document.documentElement.classList.contains('dark');
}

/**
 * Renders a Mermaid diagram on the client.
 *
 * Mermaid manipulates the DOM and reads `document`, so it is dynamically
 * imported inside an effect to keep it out of the server bundle. The rendered
 * SVG is injected via `dangerouslySetInnerHTML`; the source is authored by us in
 * the docs repo, and Mermaid is initialized with `securityLevel: 'strict'`.
 */
export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rawId = useId();
  const renderId = `mermaid-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: isDarkMode() ? 'dark' : 'default',
          fontFamily: 'var(--font-geist-sans), Arial, sans-serif',
        });
        const { svg: rendered } = await mermaid.render(renderId, chart.trim());
        if (!cancelled) {
          setSvg(rendered);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    }

    render();

    return () => {
      cancelled = true;
    };
  }, [chart, renderId]);

  if (error) {
    return (
      <pre className="mb-4 overflow-x-auto rounded-lg border border-red-800 bg-slate-900 p-4 font-mono text-sm text-red-300">
        {`Failed to render diagram: ${error}\n\n${chart}`}
      </pre>
    );
  }

  if (!svg) {
    return <div className="mb-4 h-48 animate-pulse rounded-lg bg-slate-800" aria-hidden="true" />;
  }

  return (
    <div
      className="my-6 flex justify-center overflow-x-auto [&_svg]:h-auto [&_svg]:max-w-full"
      role="img"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
