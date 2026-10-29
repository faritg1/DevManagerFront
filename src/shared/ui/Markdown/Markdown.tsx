import React from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Model output is untrusted: no images (tracking pixels) and only http(s) links, opened in a new tab.
const safeUrl = (url: string) => (/^https?:\/\//i.test(url) ? url : '');
const components: Components = {
    a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
};

// GFM: the model answers with tables, autolinks and strikethrough.
const REMARK_PLUGINS = [remarkGfm];

/** Renders AI-generated markdown (GFM) safely with the app's prose styles. */
export const Markdown: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => (
    <div className={`prose prose-sm dark:prose-invert max-w-none break-words prose-p:my-2 prose-pre:overflow-x-auto prose-table:block prose-table:overflow-x-auto prose-th:whitespace-nowrap prose-td:align-top [&_td]:min-w-[6.5rem] prose-a:text-primary ${className}`}>
        <ReactMarkdown remarkPlugins={REMARK_PLUGINS} disallowedElements={['img']} unwrapDisallowed urlTransform={safeUrl} components={components}>
            {text}
        </ReactMarkdown>
    </div>
);
