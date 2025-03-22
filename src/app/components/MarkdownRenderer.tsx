'use client';

import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import remarkGfm from 'remark-gfm';
import { useState, useMemo } from 'react';
import { Check, Copy } from 'lucide-react';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize from 'rehype-sanitize';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
      })
      .catch(err => console.error('Failed to copy text: ', err));
  };

  // 使用useMemo缓存渲染结果
  const renderedContent = useMemo(() => {
    return (
      <ReactMarkdown
        className={`prose prose-invert max-w-none ${className || ''}`}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeSanitize]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const codeContent = String(children).replace(/\n$/, '');
            
            return !inline && match ? (
              <div className="relative group my-0.5">
                <SyntaxHighlighter
                  style={atomDark}
                  language={match[1]}
                  wrapLongLines={false}
                  PreTag="div"
                  className="rounded-md !bg-[#1e1e1e] !border-0 !py-1 text-[15px]"
                  codeTagProps={{ style: { fontSize: '15px' } }}
                  {...props}
                >
                  {codeContent}
                </SyntaxHighlighter>
                
                <div className="absolute top-2 right-2">
                  <span className="text-xs text-gray-500 px-2 py-1 rounded bg-gray-800 mr-2">
                    {match[1]}
                  </span>
                  <button
                    onClick={() => handleCopyCode(codeContent)}
                    className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700 transition-colors"
                    title="复制代码"
                  >
                    {copiedCode === codeContent ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            ) : (
              <code className="bg-[#2a2a2a] py-0.5 px-1 rounded text-sm" {...props}>
                {children}
              </code>
            );
          },
          a({ node, className, children, ...props }: any) {
            return (
              <a 
                className="text-blue-400 hover:text-blue-300 hover:underline"
                target="_blank" 
                rel="noopener noreferrer" 
                {...props}
              >
                {children}
              </a>
            );
          },
          blockquote({ node, className, children, ...props }: any) {
            return (
              <blockquote 
                className="border-l-4 border-gray-600 pl-4 py-1 my-2 bg-gray-800 bg-opacity-50 rounded-r" 
                {...props}
              >
                {children}
              </blockquote>
            );
          },
          table({ node, className, children, ...props }: any) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="border-collapse w-full text-sm" {...props}>
                  {children}
                </table>
              </div>
            );
          },
          th({ node, className, children, ...props }: any) {
            return (
              <th className="border border-gray-700 px-4 py-2 bg-gray-800 font-medium text-left" {...props}>
                {children}
              </th>
            );
          },
          td({ node, className, children, ...props }: any) {
            return (
              <td className="border border-gray-700 px-4 py-2" {...props}>
                {children}
              </td>
            );
          },
          p({ node, className, children, ...props }: any) {
            return (
              <p className="my-2" {...props}>
                {children}
              </p>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    );
  }, [content]);
  
  return renderedContent;
} 