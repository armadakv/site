import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface DocsContentProps {
  content: string;
}

const components: Components = {
  h1: ({ children, ...props }) => {
    const id = slugifyHeading(children);
    return (
      <h1
        id={id}
        className="mt-8 mb-4 text-3xl font-bold tracking-tight text-slate-900 first:mt-0 dark:text-slate-50"
        {...props}
      >
        {children}
      </h1>
    );
  },
  h2: ({ children, ...props }) => {
    const id = slugifyHeading(children);
    return (
      <h2
        id={id}
        className="mt-10 mb-3 border-b border-slate-200 pb-2 text-2xl font-semibold tracking-tight text-slate-800 dark:border-slate-700 dark:text-slate-100"
        {...props}
      >
        {children}
      </h2>
    );
  },
  h3: ({ children, ...props }) => {
    const id = slugifyHeading(children);
    return (
      <h3
        id={id}
        className="mt-8 mb-2 text-xl font-semibold text-slate-800 dark:text-slate-100"
        {...props}
      >
        {children}
      </h3>
    );
  },
  h4: ({ children, ...props }) => {
    const id = slugifyHeading(children);
    return (
      <h4
        id={id}
        className="mt-6 mb-2 text-lg font-semibold text-slate-700 dark:text-slate-200"
        {...props}
      >
        {children}
      </h4>
    );
  },
  p: ({ children }) => (
    <p className="mb-4 leading-7 text-slate-700 dark:text-slate-300">{children}</p>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-blue-600 underline underline-offset-2 transition-colors hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="mb-4 ml-4 list-disc space-y-1 text-slate-700 dark:text-slate-300">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-4 ml-4 list-decimal space-y-1 text-slate-700 dark:text-slate-300">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-7">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-4 border-blue-400 pl-4 text-slate-600 italic dark:border-blue-500 dark:text-slate-400">
      {children}
    </blockquote>
  ),
  code: ({ className, children, ...props }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code
          className="rounded bg-slate-100 px-1 py-0.5 font-mono text-sm text-slate-800 dark:bg-slate-800 dark:text-slate-200"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code className={`${className ?? ''} font-mono text-sm`} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="mb-4 overflow-x-auto rounded-lg border border-slate-700 bg-slate-900 p-4 font-mono text-sm text-slate-100 dark:bg-slate-950">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="mb-4 overflow-x-auto">
      <table className="min-w-full border-collapse text-sm text-slate-700 dark:text-slate-300">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-slate-100 dark:bg-slate-800">{children}</thead>,
  th: ({ children }) => (
    <th className="border border-slate-200 px-4 py-2 text-left font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-100">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-slate-200 px-4 py-2 dark:border-slate-700">{children}</td>
  ),
  tr: ({ children }) => <tr className="even:bg-slate-50 dark:even:bg-slate-800/50">{children}</tr>,
  hr: () => <hr className="my-8 border-slate-200 dark:border-slate-700" />,
  img: ({ src, alt }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt ?? ''} className="my-4 max-w-full rounded-lg" />
  ),
};

function slugifyHeading(children: React.ReactNode): string {
  const text = extractText(children);
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node !== null && typeof node === 'object' && 'props' in node) {
    const el = node as { props?: { children?: React.ReactNode } };
    return extractText(el.props?.children);
  }
  return '';
}

export default function DocsContent({ content }: DocsContentProps) {
  return (
    <article className="min-w-0">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </article>
  );
}
